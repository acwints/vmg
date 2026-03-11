import type { JWT } from "next-auth/jwt";

export const GOOGLE_GMAIL_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly";
export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

export const GOOGLE_WORKSPACE_SCOPES = [
  "openid",
  "email",
  "profile",
  GOOGLE_GMAIL_SCOPE,
  GOOGLE_CALENDAR_SCOPE,
];

export const googleAllowedDomain =
  process.env.GOOGLE_ALLOWED_DOMAIN?.toLowerCase() || "vmgpartners.com";

export const googleAllowedEmails = new Set(
  (process.env.GOOGLE_ALLOWED_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

export interface GoogleAuthToken extends JWT {
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleExpiresAt?: number;
  googleScope?: string;
  googleHostedDomain?: string;
  googleEmailVerified?: boolean;
  googleError?: string;
}

export interface WorkspaceSummaryMessage {
  id: string;
  from: string;
  subject: string;
  receivedAt: string | null;
  snippet: string;
}

export interface WorkspaceSummaryEvent {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  location: string | null;
  htmlLink: string | null;
}

export interface WorkspaceSummary {
  generatedAt: string;
  connected: boolean;
  hostedDomain: string | null;
  scopes: string[];
  authError: string | null;
  gmail: {
    connected: boolean;
    address: string | null;
    inboxCount: number | null;
    unreadCount: number | null;
    messages: WorkspaceSummaryMessage[];
    error: string | null;
  };
  calendar: {
    connected: boolean;
    primaryCalendar: string | null;
    upcomingCount: number | null;
    events: WorkspaceSummaryEvent[];
    error: string | null;
  };
}

interface GoogleTokenRefreshResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
}

interface GmailProfileResponse {
  emailAddress?: string;
}

interface GmailLabelResponse {
  messagesTotal?: number;
  messagesUnread?: number;
}

interface GmailMessageListResponse {
  messages?: Array<{ id: string }>;
}

interface GmailMessageResponse {
  id: string;
  snippet?: string;
  payload?: {
    headers?: GmailHeader[];
  };
}

interface GmailHeader {
  name?: string;
  value?: string;
}

interface CalendarResponse {
  summary?: string;
}

interface CalendarEventsResponse {
  items?: Array<{
    id: string;
    summary?: string;
    location?: string;
    htmlLink?: string;
    start?: { date?: string; dateTime?: string };
    end?: { date?: string; dateTime?: string };
  }>;
}

function buildEmptyWorkspaceSummary(token?: GoogleAuthToken): WorkspaceSummary {
  return {
    generatedAt: new Date().toISOString(),
    connected: Boolean(token?.googleAccessToken),
    hostedDomain: token?.googleHostedDomain || null,
    scopes: normalizeScopes(token?.googleScope),
    authError: token?.googleError || null,
    gmail: {
      connected: false,
      address: null,
      inboxCount: null,
      unreadCount: null,
      messages: [],
      error: null,
    },
    calendar: {
      connected: false,
      primaryCalendar: null,
      upcomingCount: null,
      events: [],
      error: null,
    },
  };
}

function normalizeScopes(scope?: string): string[] {
  return (scope || "")
    .split(" ")
    .map((value) => value.trim())
    .filter(Boolean);
}

function sanitizeText(value?: string | null): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function getHeader(headers: GmailHeader[] | undefined, name: string): string {
  return (
    headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value ||
    ""
  );
}

async function googleJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google API ${response.status}: ${details}`);
  }

  return response.json() as Promise<T>;
}

export async function refreshGoogleAccessToken(
  token: GoogleAuthToken
): Promise<GoogleAuthToken> {
  if (
    !token.googleRefreshToken ||
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET
  ) {
    return {
      ...token,
      googleError: "MissingGoogleRefreshToken",
    };
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.googleRefreshToken,
    }),
  });

  const refreshed = (await response.json()) as GoogleTokenRefreshResponse;

  if (!response.ok || !refreshed.access_token) {
    return {
      ...token,
      googleError: refreshed.error || "RefreshAccessTokenError",
    };
  }

  return {
    ...token,
    googleAccessToken: refreshed.access_token,
    googleExpiresAt: Date.now() + (Number(refreshed.expires_in || 3600) * 1000),
    googleRefreshToken: refreshed.refresh_token || token.googleRefreshToken,
    googleScope: refreshed.scope || token.googleScope,
    googleError: undefined,
  };
}

async function getFreshGoogleToken(
  token: GoogleAuthToken
): Promise<GoogleAuthToken> {
  if (!token.googleAccessToken) {
    return token;
  }

  if (
    typeof token.googleExpiresAt !== "number" ||
    Date.now() < token.googleExpiresAt - 60_000
  ) {
    return token;
  }

  return refreshGoogleAccessToken(token);
}

async function getGmailSummary(accessToken: string) {
  const [profile, inbox, unread, messageList] = await Promise.all([
    googleJson<GmailProfileResponse>(
      "https://gmail.googleapis.com/gmail/v1/users/me/profile",
      accessToken
    ),
    googleJson<GmailLabelResponse>(
      "https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX",
      accessToken
    ),
    googleJson<GmailLabelResponse>(
      "https://gmail.googleapis.com/gmail/v1/users/me/labels/UNREAD",
      accessToken
    ),
    googleJson<GmailMessageListResponse>(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=5&q=newer_than:14d",
      accessToken
    ),
  ]);

  const messages = await Promise.all(
    (messageList.messages || []).map(async (message) => {
      const detail = await googleJson<GmailMessageResponse>(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        accessToken
      );

      const headers = detail.payload?.headers || [];

      return {
        id: detail.id,
        from: sanitizeText(getHeader(headers, "From")) || "Unknown sender",
        subject: sanitizeText(getHeader(headers, "Subject")) || "(No subject)",
        receivedAt: sanitizeText(getHeader(headers, "Date")) || null,
        snippet: sanitizeText(detail.snippet) || "No preview available.",
      };
    })
  );

  return {
    connected: true,
    address: profile.emailAddress || null,
    inboxCount:
      typeof inbox.messagesTotal === "number" ? inbox.messagesTotal : null,
    unreadCount:
      typeof unread.messagesUnread === "number" ? unread.messagesUnread : null,
    messages,
    error: null,
  };
}

async function getCalendarSummary(accessToken: string) {
  const now = new Date().toISOString();

  const [calendar, events] = await Promise.all([
    googleJson<CalendarResponse>(
      "https://www.googleapis.com/calendar/v3/calendars/primary",
      accessToken
    ),
    googleJson<CalendarEventsResponse>(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
        now
      )}&maxResults=5`,
      accessToken
    ),
  ]);

  return {
    connected: true,
    primaryCalendar: calendar.summary || null,
    upcomingCount: events.items?.length || 0,
    events: (events.items || []).map((event) => ({
      id: event.id,
      title: sanitizeText(event.summary) || "Untitled event",
      start: event.start?.dateTime || event.start?.date || null,
      end: event.end?.dateTime || event.end?.date || null,
      location: sanitizeText(event.location) || null,
      htmlLink: event.htmlLink || null,
    })),
    error: null,
  };
}

export async function getWorkspaceSummary(
  token: GoogleAuthToken | null
): Promise<WorkspaceSummary> {
  if (!token) {
    return buildEmptyWorkspaceSummary();
  }

  const refreshedToken = await getFreshGoogleToken(token);
  const summary = buildEmptyWorkspaceSummary(refreshedToken);

  if (!refreshedToken.googleAccessToken) {
    summary.authError = summary.authError || "MissingGoogleAccessToken";
    return summary;
  }

  const scopeSet = new Set(summary.scopes);

  if (scopeSet.has(GOOGLE_GMAIL_SCOPE)) {
    try {
      summary.gmail = await getGmailSummary(refreshedToken.googleAccessToken);
    } catch (error) {
      summary.gmail.error =
        error instanceof Error ? error.message : "Failed to load Gmail summary";
    }
  } else {
    summary.gmail.error = "Reconnect Google to grant Gmail access.";
  }

  if (scopeSet.has(GOOGLE_CALENDAR_SCOPE)) {
    try {
      summary.calendar = await getCalendarSummary(refreshedToken.googleAccessToken);
    } catch (error) {
      summary.calendar.error =
        error instanceof Error
          ? error.message
          : "Failed to load Calendar summary";
    }
  } else {
    summary.calendar.error = "Reconnect Google to grant Calendar access.";
  }

  return summary;
}
