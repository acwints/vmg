"use client";

import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, CalendarDays, ShieldCheck, Sparkles } from "lucide-react";
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
                <Badge variant={gmailConnected ? "active" : "warning"} className="text-[11px]">
                  {gmailConnected ? "Connected" : "Not connected"}
                </Badge>
              </div>
              <div className="border-t border-border bg-muted/30 px-5 py-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  <Sparkles className="h-3 w-3" />
                  <span>Summary</span>
                </div>
                <p className="mt-1.5 text-sm text-foreground/90">{inboxSummary}</p>
              </div>
              {gmailConnected && !summary?.gmail.error ? (
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
                  <p className="text-sm text-muted-foreground">
                    {gmailConnected ? "Summary unavailable." : "Connect Gmail to see messages."}
                  </p>
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
                <Badge variant={calendarConnected ? "active" : "warning"} className="text-[11px]">
                  {calendarConnected ? "Synced" : "Not connected"}
                </Badge>
              </div>
              <div className="border-t border-border bg-muted/30 px-5 py-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  <Sparkles className="h-3 w-3" />
                  <span>Summary</span>
                </div>
                <p className="mt-1.5 text-sm text-foreground/90">{calendarSummary}</p>
              </div>
              {calendarConnected && !summary?.calendar.error ? (
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
                  <p className="text-sm text-muted-foreground">
                    {calendarConnected ? "Calendar summary pending." : "Connect Calendar to see events."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
