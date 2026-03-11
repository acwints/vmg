"use client";

import { useSession } from "next-auth/react";
import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceSummary } from "@/hooks/use-api";
import { CalendarDays, Loader2, Mail, ShieldCheck } from "lucide-react";

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

function formatTimestamp(value: string | null) {
  if (!value) return "Unknown time";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return dateTimeFormatter.format(parsed);
}

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

function shortenScope(scope: string) {
  if (scope.includes("gmail")) return "Gmail";
  if (scope.includes("calendar")) return "Calendar";
  if (scope.endsWith("/email")) return "Email";
  if (scope.endsWith("/profile")) return "Profile";
  if (scope.endsWith("/openid")) return "OpenID";
  return scope;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { summary, loading, error } = useWorkspaceSummary(Boolean(session?.user));
  const firstName = session?.user?.name?.split(" ")[0] || "Andrew";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 animate-fade-in">
      <SectionHeader
        title={`Workspace for ${firstName}`}
        description="This dashboard is reserved for Google Workspace context: inbox activity, calendar visibility, and active auth scopes."
      />

      <Card className="glass-card">
        <CardContent className="flex flex-wrap items-center gap-3 p-6">
          <Badge variant="outline">{session?.user?.email ?? "No active user"}</Badge>
          {summary?.hostedDomain ? <Badge variant="secondary">{summary.hostedDomain}</Badge> : null}
          {summary?.connected ? (
            <Badge variant="active">Google connected</Badge>
          ) : (
            <Badge variant="warning">Awaiting Google connection</Badge>
          )}
          {(summary?.scopes ?? []).map((scope) => (
            <Badge key={scope} variant="outline">
              {shortenScope(scope)}
            </Badge>
          ))}
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
                  Sign in with an allowed Google account to load Gmail and Calendar summaries here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="glass-card">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-secondary p-3">
                    <Mail className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      Inbox Summary
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Recent messages from your Google inbox.
                    </p>
                  </div>
                </div>
                {summary.gmail.unreadCount !== null ? (
                  <Badge variant="warning">{summary.gmail.unreadCount} unread</Badge>
                ) : null}
              </div>

              {summary.gmail.error ? (
                <p className="text-sm text-muted-foreground">{summary.gmail.error}</p>
              ) : (
                <div className="space-y-3">
                  {summary.gmail.messages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-2xl border border-border/70 bg-background/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {message.subject || "(No subject)"}
                          </p>
                          <p className="text-xs text-muted-foreground">{message.from}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(message.receivedAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{message.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-secondary p-3">
                    <CalendarDays className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      Calendar Summary
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Upcoming events from your primary calendar.
                    </p>
                  </div>
                </div>
                {summary.calendar.upcomingCount !== null ? (
                  <Badge variant="outline">{summary.calendar.upcomingCount} upcoming</Badge>
                ) : null}
              </div>

              {summary.calendar.error ? (
                <p className="text-sm text-muted-foreground">{summary.calendar.error}</p>
              ) : (
                <div className="space-y-3">
                  {summary.calendar.events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-border/70 bg-background/60 p-4"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatEventRange(event.start, event.end)}
                        </p>
                      </div>
                      {event.location ? (
                        <p className="mt-3 text-sm text-muted-foreground">{event.location}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
