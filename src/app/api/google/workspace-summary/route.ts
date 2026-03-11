import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { nextAuthSecret } from "@/lib/auth-env";
import {
  getWorkspaceSummary,
  type GoogleAuthToken,
} from "@/lib/google-workspace";

export async function GET(req: NextRequest) {
  const token = (await getToken({
    req,
    secret: nextAuthSecret,
  })) as GoogleAuthToken | null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getWorkspaceSummary(token);
    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load Google Workspace summary",
      },
      { status: 500 }
    );
  }
}
