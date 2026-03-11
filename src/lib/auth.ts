import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { nextAuthSecret } from "@/lib/auth-env";
import {
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_GMAIL_SCOPE,
  GOOGLE_WORKSPACE_SCOPES,
  googleAllowedDomain,
  googleAllowedEmails,
  refreshGoogleAccessToken,
  type GoogleAuthToken,
} from "@/lib/google-workspace";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          access_type: "offline",
          hd: googleAllowedDomain,
          include_granted_scopes: "true",
          prompt: "consent",
          response_type: "code",
          scope: GOOGLE_WORKSPACE_SCOPES.join(" "),
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

      // Allow explicit demo users or verified Workspace users in the allowed domain.
      if (
        !email ||
        !emailVerified ||
        (!explicitlyAllowed && (!hasAllowedDomain || !hasAllowedHostedDomain))
      ) {
        return "/login?error=AccessDenied";
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      const googleToken = token as GoogleAuthToken;
      const googleProfile = profile as
        | { hd?: string; email_verified?: boolean | string }
        | undefined;

      if (user) {
        token.sub = user.id;
      }

      if (account?.provider === "google") {
        googleToken.googleAccessToken = account.access_token;
        googleToken.googleRefreshToken =
          account.refresh_token || googleToken.googleRefreshToken;
        googleToken.googleExpiresAt = account.expires_at
          ? account.expires_at * 1000
          : googleToken.googleExpiresAt;
        googleToken.googleScope = account.scope || googleToken.googleScope;
        googleToken.googleHostedDomain =
          typeof googleProfile?.hd === "string"
            ? googleProfile.hd
            : googleToken.googleHostedDomain;
        googleToken.googleEmailVerified =
          typeof googleProfile?.email_verified === "boolean"
            ? googleProfile.email_verified
            : googleProfile?.email_verified === "true";
        googleToken.googleError = undefined;
      }

      const scopeSet = new Set(
        (googleToken.googleScope || "")
          .split(" ")
          .map((scope) => scope.trim())
          .filter(Boolean)
      );

      const needsWorkspaceRefresh =
        scopeSet.has(GOOGLE_GMAIL_SCOPE) &&
        scopeSet.has(GOOGLE_CALENDAR_SCOPE) &&
        typeof googleToken.googleExpiresAt === "number" &&
        Date.now() >= googleToken.googleExpiresAt - 60_000 &&
        Boolean(googleToken.googleRefreshToken);

      if (needsWorkspaceRefresh) {
        return refreshGoogleAccessToken(googleToken);
      }

      return googleToken;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: nextAuthSecret,
};
