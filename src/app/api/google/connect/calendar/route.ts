import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { nextAuthSecret } from "@/lib/auth-env";
import { GOOGLE_CALENDAR_SCOPE } from "@/lib/google-workspace";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: nextAuthSecret });

  if (!token?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth not configured" },
      { status: 500 }
    );
  }

  const redirectUri = `${req.nextUrl.origin}/api/google/connect/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: `openid email profile ${GOOGLE_CALENDAR_SCOPE}`,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: JSON.stringify({ service: "calendar", email: token.email }),
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
