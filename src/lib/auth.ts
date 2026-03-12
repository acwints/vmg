import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { nextAuthSecret } from "@/lib/auth-env";
import {
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
          // Login only — no Gmail/Calendar scopes
          scope: "openid email profile",
        },
      },
    }),
    // Dev-only credentials provider for local testing
    ...(process.env.NODE_ENV === "development"
      ? [
          CredentialsProvider({
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "text" },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;
              return {
                id: "dev-user",
                name: "Dev User",
                email: credentials.email,
                image: null,
              };
            },
          }),
        ]
      : []),
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

      // Sync user to database (fire-and-forget — don't block login)
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
      // No longer storing Google workspace tokens in JWT
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: nextAuthSecret,
};
