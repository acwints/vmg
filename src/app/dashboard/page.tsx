"use client";

import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, CalendarDays, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
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

function friendlyScope(scope: string) {
  const fragment = scope.split("/").pop() ?? scope;
  return fragment
    .replace(/[._]/g, " ")
    .split(" ")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : ""))
    .join(" ")
    .trim();
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { summary, loading, error } = useWorkspaceSummary(Boolean(session?.user));
  const firstName = session?.user?.name?.split(" ")[0] || "Andrew";

  const snapshotDate = summary?.generatedAt ? new Date(summary.generatedAt) : REFERENCE_DATE;
  const snapshotLabel = Number.isNaN(snapshotDate.getTime())
    ? "Snapshot pending"
    : snapshotFormatter.format(snapshotDate);

  const gmailConnected = Boolean(summary?.gmail.connected);
  const calendarConnected = Boolean(summary?.calendar.connected);

  const heroStatuses = [
    {
      title: "Workspace",
      state: summary?.connected ? "Connected" : "Authorization needed",
      detail: summary?.hostedDomain ? `Domain: ${summary.hostedDomain}` : "Sign in with @vmgpartners.com",
      accent: Boolean(summary?.connected),
    },
    {
      title: "Gmail",
      state: gmailConnected ? "Inbox listening" : "Inbox locked",
      detail: summary?.gmail.address ?? session?.user?.email ?? "Authorize Gmail",
      accent: gmailConnected,
    },
    {
      title: "Calendar",
      state: calendarConnected ? "Synced" : "Locked",
      detail: summary?.calendar.primaryCalendar ?? "Authorize Calendar",
      accent: calendarConnected,
    },
  ];

  const inboxSummary = summary?.gmail.error
    ? summary.gmail.error
    : summary?.gmail.summary ?? "Grant Gmail access to surface the top threads.";

  const calendarSummary = summary?.calendar.error
    ? summary.calendar.error
    : summary?.calendar.summary ?? "Authorize Calendar to capture your upcoming events.";

  const inboxMessages = summary?.gmail.messages ?? [];
  const calendarEvents = summary?.calendar.events ?? [];

  const scopeBadges =
    summary?.scopes?.length && summary.scopes.length > 0
      ? summary.scopes.slice(0, 6).map((scope) => (
          <Badge
            key={scope}
            variant="outline"
            className="text-[10px] uppercase tracking-[0.35em]"
          >
            {friendlyScope(scope)}
          </Badge>
        ))
      : [
          <Badge
            key="waiting"
            variant="outline"
            className="text-[10px] uppercase tracking-[0.35em]"
          >
            Scopes pending
          </Badge>,
        ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-[32px] border border-border/40 bg-gradient-to-br from-[#08090c]/90 via-[#121420]/80 to-[#050607]/95 p-8 shadow-[0_40px_120px_rgba(3,2,9,0.85)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,209,197,0.18),_transparent_45%)]" />
        <div className="relative space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/70">
                Workspace spotlight
              </p>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Workspace for {firstName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                This surface keeps @vmgpartners.com inbox, calendar, and scope context in one refined
                place so you can feel the pulse of the workspace before diving into deals.
              </p>
            </div>
            <div className="flex flex-col items-start gap-1 text-xs uppercase tracking-[0.35em] text-muted-foreground/70">
              <span>Snapshot</span>
              <span className="text-[13px] text-foreground/80">{snapshotLabel}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-[11px] font-semibold">
              {session?.user?.email ?? "Guest session"}
            </Badge>
            <Badge variant="outline" className="text-[11px] font-semibold">
              {summary?.connected ? "Workspace connected" : "Waiting for auth"}
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {heroStatuses.map((status) => (
              <div
                key={status.title}
                className="rounded-2xl border border-border/50 bg-background/70 p-4 text-sm shadow-lg shadow-black/10"
              >
                <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60">
                  {status.title}
                </p>
                <p
                  className={cn(
                    "mt-3 font-display text-2xl font-semibold",
                    status.accent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {status.state}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{status.detail}</p>
                <Badge
                  variant={status.accent ? "active" : "warning"}
                  className="mt-4 text-[10px] font-semibold uppercase tracking-[0.4em]"
                >
                  {status.accent ? "Ready" : "Needs attention"}
                </Badge>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">{scopeBadges}</div>
        </div>
      </section>

      {error && (
        <Card className="glass-card border-destructive/20 bg-destructive/10">
          <CardContent className="flex items-center gap-4 px-6 py-5">
            <ShieldCheck className="h-5 w-5 text-destructive" />
            <div className="space-y-1 text-sm">
              <p className="text-sm font-semibold text-foreground">Workspace data unavailable</p>
              <p className="text-xs text-destructive/80">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="glass-card border-border/70">
          <CardContent className="flex items-center gap-4 px-6 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Loading your workspace context</p>
              <p className="text-xs text-muted-foreground">
                Fetching Gmail insights, calendar visibility, and active scopes.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="glass-card overflow-hidden border-border/60">
            <CardContent className="p-0">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 px-6 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-secondary/70 p-2">
                      <Mail className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Inbox Summary</p>
                      <p className="text-xs text-muted-foreground">Recent messages from your Google inbox.</p>
                    </div>
                  </div>
                  <Badge variant={gmailConnected ? "active" : "warning"} className="text-[11px]">
                    {gmailConnected ? "Connected" : "Reconnect Gmail"}
                  </Badge>
                </div>
                <div className="border-y border-border/60 bg-background/60 px-6 py-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.4em] text-muted-foreground/60">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI summary</span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/90">{inboxSummary}</p>
                </div>
                {gmailConnected && !summary?.gmail.error ? (
                  <div className="space-y-3 px-6 pb-6">
                    {inboxMessages.slice(0, 3).map((message) => (
                      <div
                        key={message.id}
                        className="rounded-2xl border border-border/70 bg-background/40 px-4 py-3 transition-colors hover:border-foreground/40 hover:bg-background/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {message.subject || "(No subject)"}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {formatSender(message.from)}
                            </p>
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatCompactTime(message.receivedAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-[13px] text-muted-foreground line-clamp-2">
                          {message.snippet}
                        </p>
                      </div>
                    ))}
                    {inboxMessages.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No conversations captured yet—give it a few minutes after you connect Gmail.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="px-6 pb-6">
                    <p className="text-sm text-muted-foreground">
                      {gmailConnected
                        ? "Summary temporarily unavailable."
                        : "Grant Gmail access to unlock inbox intelligence."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden border-border/60">
            <CardContent className="p-0">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 px-6 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-secondary/70 p-2">
                      <CalendarDays className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Calendar Summary</p>
                      <p className="text-xs text-muted-foreground">
                        Upcoming events from your primary calendar.
                      </p>
                    </div>
                  </div>
                  <Badge variant={calendarConnected ? "active" : "warning"} className="text-[11px]">
                    {calendarConnected ? "Synced" : "Reconnect Calendar"}
                  </Badge>
                </div>
                <div className="border-y border-border/60 bg-background/60 px-6 py-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.4em] text-muted-foreground/60">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI summary</span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/90">{calendarSummary}</p>
                </div>
                {calendarConnected && !summary?.calendar.error ? (
                  <div className="space-y-3 px-6 pb-6">
                    {calendarEvents.slice(0, 4).map((event) => (
                      <div
                        key={event.id}
                        className="rounded-2xl border border-border/70 bg-background/40 px-4 py-3 transition-colors hover:border-foreground/40 hover:bg-background/60"
                      >
                        <div className="flex flex-col gap-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {event.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatEventRange(event.start, event.end)}
                          </p>
                          {event.location ? (
                            <p className="text-[11px] text-muted-foreground/80">{event.location}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {calendarEvents.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No events were available—add meetings to your primary calendar to see them here.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="px-6 pb-6">
                    <p className="text-sm text-muted-foreground">
                      {calendarConnected
                        ? "Calendar summary pending."
                        : "Grant Calendar scope to surface your upcoming events."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
