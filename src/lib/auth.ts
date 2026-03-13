import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { nextAuthSecret } from "@/lib/auth-env";
import {
  GOOGLE_GMAIL_SCOPE,
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_SHEETS_SCOPE,
  googleAllowedDomain,
  googleAllowedEmails,
} from "@/lib/google-workspace";

const API_BASE =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://vmg-backend-production.up.railway.app";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          access_type: "offline",
          hd: googleAllowedDomain,
          prompt: "consent",
          response_type: "code",
          include_granted_scopes: "true",
          // Default login scopes — no Gmail/Calendar
          scope: "openid email profile",
        },
      },
    }),
    // Credentials provider for dev and test users
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        // Allow test users and dev users
        const isTestUser = credentials.email === "test@vmgpartners.com";
        const isDevUser = process.env.NODE_ENV === "development";
        
        if (!isTestUser && !isDevUser) return null;
        
        const userName = isTestUser ? "Test User" : "Dev User";
        const userId = isTestUser ? "test-user" : "dev-user";
        
        return {
          id: userId,
          name: userName,
          email: credentials.email,
          image: null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow dev credentials in development
      if (account?.provider === "credentials") return true;

      const googleProfile = profile as
        | { hd?: string; email_verified?: boolean | string }
        | undefined;
      const email = user.email?.toLowerCase();
      const hostedDomain =
        typeof googleProfile?.hd === "string"
          ? googleProfile.hd.toLowerCase()
          : undefined;
      const emailVerified =
        typeof googleProfile?.email_verified === "boolean"
          ? googleProfile.email_verified
          : googleProfile?.email_verified === "true";
      const explicitlyAllowed = email ? googleAllowedEmails.has(email) : false;
      const hasAllowedDomain = email?.endsWith(`@${googleAllowedDomain}`) ?? false;
      const hasAllowedHostedDomain = hostedDomain === googleAllowedDomain;

      if (
        !email ||
        !emailVerified ||
        (!explicitlyAllowed && (!hasAllowedDomain || !hasAllowedHostedDomain))
      ) {
        return "/login?error=AccessDenied";
      }

      // Sync user to database
      try {
        await fetch(`${API_BASE}/api/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name: user.name || null,
            avatar_url: user.image || null,
            google_id: account?.providerAccountId || null,
          }),
        });
      } catch {
        // User sync failure should not block login
      }

      // If this sign-in granted workspace scopes (Gmail/Calendar/Sheets), store tokens in DB
      const grantedScopes = (account?.scope || "").split(" ").filter(Boolean);
      const hasWorkspaceScope =
        grantedScopes.includes(GOOGLE_GMAIL_SCOPE) ||
        grantedScopes.includes(GOOGLE_CALENDAR_SCOPE) ||
        grantedScopes.includes(GOOGLE_SHEETS_SCOPE);

      if (hasWorkspaceScope && account?.access_token && email) {
        try {
          // Fetch existing scopes to merge
          let existingScopes = "";
          const userRes = await fetch(
            `${API_BASE}/api/users/me?email=${encodeURIComponent(email)}`,
            { cache: "no-store" }
          );
          if (userRes.ok) {
            const userData = await userRes.json();
            existingScopes = userData.google_scopes || "";
          }

          const mergedScopes = Array.from(
            new Set([
              ...existingScopes.split(" ").filter(Boolean),
              ...grantedScopes,
            ])
          ).join(" ");

          await fetch(
            `${API_BASE}/api/users/me/tokens?email=${encodeURIComponent(email)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                google_access_token: account.access_token,
                google_refresh_token: account.refresh_token || null,
                google_token_expiry: account.expires_at
                  ? new Date(account.expires_at * 1000).toISOString()
                  : null,
                google_scopes: mergedScopes,
              }),
            }
          );
        } catch {
          // Token storage failure should not block login
        }
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: nextAuthSecret,
};
