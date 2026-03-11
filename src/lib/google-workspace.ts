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
    summary: string | null;
    messages: WorkspaceSummaryMessage[];
    error: string | null;
  };
  calendar: {
    connected: boolean;
    primaryCalendar: string | null;
    upcomingCount: number | null;
    summary: string | null;
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
      summary: null,
      messages: [],
      error: null,
    },
    calendar: {
      connected: false,
      primaryCalendar: null,
      upcomingCount: null,
      summary: null,
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
    summary: null,
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
    summary: null,
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

function formatEventMoment(value: string | null): string {
  if (!value) return "unscheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "upcoming";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function buildGmailFallbackSummary(
  gmail: WorkspaceSummary["gmail"]
): string {
  if (!gmail.connected) {
    return "Connect your inbox to see a concise email brief here.";
  }

  if (!gmail.messages.length) {
    return "Your recent inbox is quiet. No notable messages were pulled into this view.";
  }

  const senders = Array.from(
    new Set(
      gmail.messages
        .map((message) => message.from.split("<")[0]?.replace(/"/g, "").trim())
        .filter(Boolean)
    )
  ).slice(0, 3);

  const senderCopy = senders.length
    ? `Recent messages are coming from ${senders.join(", ")}.`
    : "Recent messages are spread across a few senders.";

  const unreadCopy =
    typeof gmail.unreadCount === "number"
      ? `You have ${gmail.unreadCount.toLocaleString()} unread messages.`
      : "Unread count is not available right now.";

  return `${unreadCopy} ${senderCopy}`.trim();
}

function buildCalendarFallbackSummary(
  calendar: WorkspaceSummary["calendar"]
): string {
  if (!calendar.connected) {
    return "Connect your calendar to see your upcoming schedule here.";
  }

  if (!calendar.events.length) {
    return "Your calendar is clear for now with no upcoming events in this view.";
  }

  const nextEvent = calendar.events[0];
  const nextEventCopy = `Next up is ${nextEvent.title} ${formatEventMoment(nextEvent.start)}.`;
  const totalCopy =
    typeof calendar.upcomingCount === "number"
      ? `${calendar.upcomingCount} upcoming events are on deck.`
      : "Your next few events are loaded.";

  return `${totalCopy} ${nextEventCopy}`.trim();
}

async function generateAiBrief(
  label: "inbox" | "calendar",
  payload: Record<string, unknown>,
  fallback: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  try {
    const systemPrompt =
      label === "inbox"
        ? "You write crisp executive inbox briefs. Summarize only the most important email themes in one or two sentences. Be natural, not technical."
        : "You write crisp executive calendar briefs. Summarize the schedule in one or two sentences. Focus on what matters next and overall cadence. Be natural, not technical.";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 90,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Write a polished briefing summary from this JSON:\n${JSON.stringify(
              payload
            )}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return fallback;
    }

    const data = await response.json();
    const content = sanitizeText(data.choices?.[0]?.message?.content);
    return content || fallback;
  } catch {
    return fallback;
  }
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
      summary.gmail.summary = await generateAiBrief(
        "inbox",
        {
          unreadCount: summary.gmail.unreadCount,
          inboxCount: summary.gmail.inboxCount,
          messages: summary.gmail.messages.map((message) => ({
            from: message.from,
            subject: message.subject,
            snippet: message.snippet,
            receivedAt: message.receivedAt,
          })),
        },
        buildGmailFallbackSummary(summary.gmail)
      );
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
      summary.calendar.summary = await generateAiBrief(
        "calendar",
        {
          primaryCalendar: summary.calendar.primaryCalendar,
          upcomingCount: summary.calendar.upcomingCount,
          events: summary.calendar.events.map((event) => ({
            title: event.title,
            start: event.start,
            end: event.end,
            location: event.location,
          })),
        },
        buildCalendarFallbackSummary(summary.calendar)
      );
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
