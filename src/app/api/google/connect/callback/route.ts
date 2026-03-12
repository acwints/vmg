import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { nextAuthSecret } from "@/lib/auth-env";

const API_BASE =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://vmg-backend-production.up.railway.app";

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: nextAuthSecret });

  if (!token?.email) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state");
  const errorParam = req.nextUrl.searchParams.get("error");

  if (errorParam || !code || !stateRaw) {
    const dashUrl = new URL("/dashboard", req.nextUrl.origin);
    dashUrl.searchParams.set(
      "connect_error",
      errorParam || "Missing authorization code"
    );
    return NextResponse.redirect(dashUrl);
  }

  let state: { service: string; email: string };
  try {
    state = JSON.parse(stateRaw);
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard?connect_error=invalid_state", req.nextUrl.origin)
    );
  }

  // Verify the state email matches the logged-in user
  if (state.email !== token.email) {
    return NextResponse.redirect(
      new URL("/dashboard?connect_error=email_mismatch", req.nextUrl.origin)
    );
  }

  // Exchange authorization code for tokens
  const redirectUri = `${req.nextUrl.origin}/api/google/connect/callback`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokens.access_token) {
    const dashUrl = new URL("/dashboard", req.nextUrl.origin);
    dashUrl.searchParams.set(
      "connect_error",
      tokens.error || "Failed to exchange authorization code"
    );
    return NextResponse.redirect(dashUrl);
  }

  // Fetch the user's current scopes from DB so we can merge
  let existingScopes = "";
  try {
    const userRes = await fetch(
      `${API_BASE}/api/users/me?email=${encodeURIComponent(state.email)}`,
      { cache: "no-store" }
    );
    if (userRes.ok) {
      const user = await userRes.json();
      existingScopes = user.google_scopes || "";
    }
  } catch {
    // Non-fatal
  }

  // Merge existing scopes with newly granted scopes
  const newScopes = (tokens.scope || "").split(" ").filter(Boolean);
  const mergedScopes = Array.from(
    new Set([
      ...existingScopes.split(" ").filter(Boolean),
      ...newScopes,
    ])
  ).join(" ");

  // Store tokens in database
  try {
    await fetch(
      `${API_BASE}/api/users/me/tokens?email=${encodeURIComponent(state.email)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token || null,
          google_token_expiry: new Date(
            Date.now() + (Number(tokens.expires_in || 3600) * 1000)
          ).toISOString(),
          google_scopes: mergedScopes,
        }),
      }
    );
  } catch {
    const dashUrl = new URL("/dashboard", req.nextUrl.origin);
    dashUrl.searchParams.set("connect_error", "Failed to save connection");
    return NextResponse.redirect(dashUrl);
  }

  // Redirect back to dashboard with success indicator
  const dashUrl = new URL("/dashboard", req.nextUrl.origin);
  dashUrl.searchParams.set("connected", state.service);
  return NextResponse.redirect(dashUrl);
}
