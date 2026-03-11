"use client";

import { useSession } from "next-auth/react";
import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceSummary } from "@/hooks/use-api";
import { CalendarDays, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";

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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { summary, loading, error } = useWorkspaceSummary(Boolean(session?.user));
  const firstName = session?.user?.name?.split(" ")[0] || "Andrew";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 animate-fade-in">
      <SectionHeader
        title={`Workspace for ${firstName}`}
        description="Your email and calendar at a glance."
      />

      <Card className="glass-card">
        <CardContent className="flex flex-wrap items-center gap-3 p-6">
          <Badge variant="outline">{session?.user?.email ?? "No active user"}</Badge>
          {summary?.hostedDomain ? (
            <Badge variant="secondary">{summary.hostedDomain}</Badge>
          ) : null}
          {summary?.connected ? (
            <Badge variant="active">Workspace connected</Badge>
          ) : (
            <Badge variant="warning">Connection needed</Badge>
          )}
          {summary?.gmail.connected ? <Badge variant="outline">Inbox connected</Badge> : null}
          {summary?.calendar.connected ? (
            <Badge variant="outline">Calendar connected</Badge>
          ) : null}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-destructive">Failed to load workspace summary: {error}</p>
        </div>
      ) : !summary?.connected ? (
        <Card className="glass-card">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-secondary p-3">
                <ShieldCheck className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Workspace not connected
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sign in with an allowed Google account to see your inbox and calendar here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="glass-card overflow-hidden">
            <CardContent className="space-y-4 p-0">
              <div className="border-b border-border/60 bg-gradient-to-br from-card via-card to-card/70 px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-secondary p-3">
                      <Mail className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-foreground">
                        Inbox Summary
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        A quick read on what matters in your inbox.
                      </p>
                    </div>
                  </div>
                  {summary.gmail.unreadCount !== null ? (
                    <Badge variant="warning">
                      {summary.gmail.unreadCount.toLocaleString()} unread
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-4 rounded-2xl border border-border/60 bg-background/55 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Brief
                  </div>
                  <p className="text-sm leading-6 text-foreground/90">
                    {summary.gmail.error
                      ? summary.gmail.error
                      : summary.gmail.summary || "No inbox brief available yet."}
                  </p>
                </div>
              </div>

              <div className="space-y-2 px-3 pb-3">
                {summary.gmail.messages.slice(0, 4).map((message) => (
                  <div
                    key={message.id}
                    className="rounded-xl border border-border/50 bg-background/35 px-4 py-3 transition-colors hover:bg-background/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {message.subject || "(No subject)"}
                          </p>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatSender(message.from)}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatCompactTime(message.receivedAt)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                      {message.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden">
            <CardContent className="space-y-4 p-0">
              <div className="border-b border-border/60 bg-gradient-to-br from-card via-card to-card/70 px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-secondary p-3">
                      <CalendarDays className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-foreground">
                        Calendar Summary
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        A compact view of what your week looks like.
                      </p>
                    </div>
                  </div>
                  {summary.calendar.upcomingCount !== null ? (
                    <Badge variant="outline">
                      {summary.calendar.upcomingCount} upcoming
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-4 rounded-2xl border border-border/60 bg-background/55 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Brief
                  </div>
                  <p className="text-sm leading-6 text-foreground/90">
                    {summary.calendar.error
                      ? summary.calendar.error
                      : summary.calendar.summary || "No calendar brief available yet."}
                  </p>
                </div>
              </div>

              <div className="space-y-2 px-3 pb-3">
                {summary.calendar.events.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-border/50 bg-background/35 px-4 py-3 transition-colors hover:bg-background/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatEventRange(event.start, event.end)}
                        </p>
                      </div>
                    </div>
                    {event.location ? (
                      <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                        {event.location}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
