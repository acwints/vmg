import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { nextAuthSecret } from "@/lib/auth-env";
import {
  GOOGLE_SHEETS_SCOPE,
  refreshGoogleAccessToken,
} from "@/lib/google-workspace";

const API_BASE =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://vmg-backend-production.up.railway.app";

interface SheetData {
  title: string;
  headers: string[];
  rows: (string | number | boolean | null)[][];
}

interface CreateRequest {
  title: string;
  sheets: SheetData[];
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: nextAuthSecret });
  if (!token?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = token.email as string;

  // Get user tokens from DB
  let tokensRes: Response;
  try {
    tokensRes = await fetch(
      `${API_BASE}/api/users/me/tokens?email=${encodeURIComponent(email)}`,
      { cache: "no-store" }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to reach user service" },
      { status: 500 }
    );
  }

  if (!tokensRes.ok) {
    return NextResponse.json(
      { error: "needs_scope", scope: GOOGLE_SHEETS_SCOPE },
      { status: 403 }
    );
  }

  const tokens = await tokensRes.json();
  const scopes = ((tokens.google_scopes as string) || "").split(" ");

  if (!scopes.includes(GOOGLE_SHEETS_SCOPE)) {
    return NextResponse.json(
      { error: "needs_scope", scope: GOOGLE_SHEETS_SCOPE },
      { status: 403 }
    );
  }

  let accessToken = tokens.google_access_token as string | null;

  if (!accessToken) {
    return NextResponse.json(
      { error: "needs_scope", scope: GOOGLE_SHEETS_SCOPE },
      { status: 403 }
    );
  }

  // Refresh token if expired
  if (tokens.google_token_expiry) {
    const expiry = new Date(tokens.google_token_expiry).getTime();
    if (Date.now() >= expiry - 60_000 && tokens.google_refresh_token) {
      const refreshed = await refreshGoogleAccessToken(
        tokens.google_refresh_token
      );
      if (refreshed.access_token) {
        accessToken = refreshed.access_token;
        // Update in DB (fire-and-forget)
        fetch(
          `${API_BASE}/api/users/me/tokens?email=${encodeURIComponent(email)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              google_access_token: refreshed.access_token,
              google_refresh_token:
                refreshed.refresh_token || tokens.google_refresh_token,
              google_token_expiry: new Date(
                Date.now() + Number(refreshed.expires_in || 3600) * 1000
              ).toISOString(),
              google_scopes: refreshed.scope || tokens.google_scopes,
            }),
          }
        ).catch(() => {});
      } else {
        return NextResponse.json(
          { error: "Token refresh failed" },
          { status: 401 }
        );
      }
    }
  }

  // Parse the request body
  const body = (await req.json()) as CreateRequest;

  // Step 1: Create the spreadsheet with sheet titles
  const createPayload = {
    properties: { title: body.title },
    sheets: body.sheets.map((s) => ({
      properties: { title: s.title },
    })),
  };

  const createRes = await fetch(
    "https://sheets.googleapis.com/v4/spreadsheets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createPayload),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    return NextResponse.json(
      { error: `Sheets API error: ${createRes.status}`, details: err },
      { status: createRes.status }
    );
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId as string;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl as string;

  // Step 2: Populate each sheet with data via batchUpdate
  const valueRanges = body.sheets.map((s) => ({
    range: `'${s.title}'!A1`,
    majorDimension: "ROWS",
    values: [s.headers, ...s.rows],
  }));

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: valueRanges,
      }),
    }
  );

  if (!batchRes.ok) {
    // Spreadsheet was created but data write failed — still return the URL
    return NextResponse.json({
      spreadsheetId,
      spreadsheetUrl,
      warning: "Spreadsheet created but data write failed",
    });
  }

  // Step 3: Auto-resize columns and bold headers
  const formatRequests = body.sheets.map((s, i) => {
    const sheetId = spreadsheet.sheets[i]?.properties?.sheetId ?? i;
    return [
      // Bold the header row
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true },
              backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
            },
          },
          fields: "userEnteredFormat(textFormat,backgroundColor)",
        },
      },
      // Freeze header row
      {
        updateSheetProperties: {
          properties: {
            sheetId,
            gridProperties: { frozenRowCount: 1 },
          },
          fields: "gridProperties.frozenRowCount",
        },
      },
      // Auto-resize columns
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId,
            dimension: "COLUMNS",
            startIndex: 0,
            endIndex: s.headers.length,
          },
        },
      },
    ];
  });

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests: formatRequests.flat() }),
    }
  ).catch(() => {});

  return NextResponse.json({ spreadsheetId, spreadsheetUrl });
}
