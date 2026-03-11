const LOCAL_DEV_NEXTAUTH_URL = "http://localhost:3000";
const LOCAL_DEV_NEXTAUTH_SECRET = "vmg-local-dev-secret";

export function ensureNextAuthEnv() {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  process.env.NEXTAUTH_URL ??= LOCAL_DEV_NEXTAUTH_URL;
  process.env.NEXTAUTH_SECRET ??= LOCAL_DEV_NEXTAUTH_SECRET;
}

ensureNextAuthEnv();

export const nextAuthSecret = process.env.NEXTAUTH_SECRET;
