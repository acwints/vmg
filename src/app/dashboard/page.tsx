"use client";

import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, CalendarDays, ShieldCheck, Sparkles, Link2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { REFERENCE_DATE } from "@/lib/reference-date";
import { useWorkspaceSummary } from "@/hooks/use-api";

const snapshotFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatEventRange(start: string | null, end: string | null) {
  if (!start) return "Time TBD";

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const startIsDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(start);
  const endIsDateOnly = Boolean(end && /^\d{4}-\d{2}-\d{2}$/.test(end));

  if (Number.isNaN(startDate.getTime())) return start;

  if (startIsDateOnly) {
    const startLabel = dateFormatter.format(startDate);
    if (!endDate || Number.isNaN(endDate.getTime()) || !endIsDateOnly) {
      return `${startLabel} (all day)`;
    }

    return `${startLabel} - ${dateFormatter.format(endDate)}`;
  }

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return dateTimeFormatter.format(startDate);
  }

  return `${dateTimeFormatter.format(startDate)} - ${dateTimeFormatter.format(endDate)}`;
}

function formatSender(value: string) {
  return value.split("<")[0]?.replace(/"/g, "").trim() || value;
}

function formatCompactTime(value: string | null) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return dateTimeFormatter.format(parsed);
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { summary, loading, error } = useWorkspaceSummary(Boolean(session?.user));
  const firstName = session?.user?.name?.split(" ")[0] || "Andrew";

  const snapshotDate = summary?.generatedAt ? new Date(summary.generatedAt) : REFERENCE_DATE;
  const snapshotLabel = Number.isNaN(snapshotDate.getTime())
    ? "—"
    : snapshotFormatter.format(snapshotDate);

  const gmailConnected = Boolean(summary?.gmail.connected);
  const calendarConnected = Boolean(summary?.calendar.connected);

  const statusItems = [
    {
      label: "Workspace",
      ok: Boolean(summary?.connected),
    },
    {
      label: "Gmail",
      ok: gmailConnected,
    },
    {
      label: "Calendar",
      ok: calendarConnected,
    },
  ];

  const inboxSummary = summary?.gmail.error
    ? summary.gmail.error
    : summary?.gmail.summary ?? "Connect Gmail to see your latest threads.";

  const calendarSummary = summary?.calendar.error
    ? summary.calendar.error
    : summary?.calendar.summary ?? "Connect Calendar to see upcoming events.";

  const inboxMessages = summary?.gmail.messages ?? [];
  const calendarEvents = summary?.calendar.events ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 animate-fade-in">
      {/* Hero — compact status bar */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Good afternoon, {firstName}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {snapshotLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {statusItems.map((s) => (
              <Badge
                key={s.label}
                variant={s.ok ? "active" : "warning"}
                className="text-[11px]"
              >
                {s.label}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center gap-4 px-5 py-4">
            <ShieldCheck className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-3 px-5 py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading workspace…</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Inbox card */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Inbox</p>
                </div>
                {gmailConnected ? (
                  <Badge variant="active" className="text-[11px]">
                    Connected
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-[11px]"
                    onClick={() => {
                      window.location.href = "/api/google/connect/gmail";
                    }}
                  >
                    <Link2 className="h-3 w-3" />
                    Connect Gmail
                  </Button>
                )}
              </div>
              {gmailConnected ? (
                <>
                  <div className="border-t border-border bg-muted/30 px-5 py-3">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                      <Sparkles className="h-3 w-3" />
                      <span>Summary</span>
                    </div>
                    <div className="mt-1.5 text-sm text-foreground/90 prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-0 [&_strong]:text-foreground">
                      <ReactMarkdown>{inboxSummary}</ReactMarkdown>
                    </div>
                  </div>
                  {!summary?.gmail.error ? (
                    <div className="space-y-2 px-5 py-4">
                      {inboxMessages.slice(0, 3).map((message) => (
                        <div
                          key={message.id}
                          className="rounded-lg border border-border px-3.5 py-2.5 transition-colors hover:bg-accent/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-0.5">
                              <p className="truncate text-sm font-medium text-foreground">
                                {message.subject || "(No subject)"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {formatSender(message.from)}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatCompactTime(message.receivedAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                            {message.snippet}
                          </p>
                        </div>
                      ))}
                      {inboxMessages.length === 0 && (
                        <p className="text-sm text-muted-foreground">No recent messages.</p>
                      )}
                    </div>
                  ) : (
                    <div className="px-5 py-4">
                      <p className="text-sm text-muted-foreground">Summary unavailable.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="border-t border-border px-5 py-8">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Connect your inbox</p>
                      <p className="text-xs text-muted-foreground max-w-[220px]">
                        Grant read-only Gmail access to see AI-powered email summaries and recent threads.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="mt-1 gap-1.5"
                      onClick={() => {
                        window.location.href = "/api/google/connect/gmail";
                      }}
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Connect with Google
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar card */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Calendar</p>
                </div>
                {calendarConnected ? (
                  <Badge variant="active" className="text-[11px]">
                    Synced
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-[11px]"
                    onClick={() => {
                      window.location.href = "/api/google/connect/calendar";
                    }}
                  >
                    <Link2 className="h-3 w-3" />
                    Connect Calendar
                  </Button>
                )}
              </div>
              {calendarConnected ? (
                <>
                  <div className="border-t border-border bg-muted/30 px-5 py-3">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                      <Sparkles className="h-3 w-3" />
                      <span>Summary</span>
                    </div>
                    <div className="mt-1.5 text-sm text-foreground/90 prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-0 [&_strong]:text-foreground">
                      <ReactMarkdown>{calendarSummary}</ReactMarkdown>
                    </div>
                  </div>
                  {!summary?.calendar.error ? (
                    <div className="space-y-2 px-5 py-4">
                      {calendarEvents.slice(0, 4).map((event) => (
                        <div
                          key={event.id}
                          className="rounded-lg border border-border px-3.5 py-2.5 transition-colors hover:bg-accent/50"
                        >
                          <p className="truncate text-sm font-medium text-foreground">
                            {event.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatEventRange(event.start, event.end)}
                          </p>
                          {event.location ? (
                            <p className="text-xs text-muted-foreground/80">{event.location}</p>
                          ) : null}
                        </div>
                      ))}
                      {calendarEvents.length === 0 && (
                        <p className="text-sm text-muted-foreground">No upcoming events.</p>
                      )}
                    </div>
                  ) : (
                    <div className="px-5 py-4">
                      <p className="text-sm text-muted-foreground">Calendar summary pending.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="border-t border-border px-5 py-8">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Connect your calendar</p>
                      <p className="text-xs text-muted-foreground max-w-[220px]">
                        Grant read-only Calendar access to see AI-powered schedule summaries and upcoming events.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="mt-1 gap-1.5"
                      onClick={() => {
                        window.location.href = "/api/google/connect/calendar";
                      }}
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Connect with Google
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
