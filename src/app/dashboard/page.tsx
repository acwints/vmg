"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { StatsCard } from "@/components/shared/stats-card";
import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStats, useWorkspaceSummary } from "@/hooks/use-api";
import {
  CalendarDays,
  Building2,
  Award,
  Cpu,
  ShoppingBag,
  ArrowRight,
  Target,
  Loader2,
  Mail,
  ExternalLink,
} from "lucide-react";

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

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const { overall, technology, consumer, loading, error } = useStats();
  const {
    summary: workspaceSummary,
    loading: workspaceLoading,
    error: workspaceError,
  } = useWorkspaceSummary(Boolean(session?.user));
  const unreadCount = workspaceSummary?.gmail.unreadCount;
  const upcomingCount = workspaceSummary?.calendar.upcomingCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-destructive">Failed to load stats: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          VMG Partners portfolio overview and intelligence
        </p>
      </div>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-fade-in">
        <StatsCard
          title="Total Portfolio"
          value={overall?.totalCompanies ?? 0}
          description="companies across both portfolios"
          icon={Building2}
        />
        <StatsCard
          title="Active"
          value={overall?.activeCompanies ?? 0}
          icon={Target}
        />
        <StatsCard
          title="Realized"
          value={overall?.realizedCompanies ?? 0}
          icon={Award}
        />
        <StatsCard
          title="Sectors"
          value={overall?.sectors ?? 0}
          description="across Technology & Consumer"
          icon={Award}
        />
      </div>

      {/* Portfolio Cards */}
      <SectionHeader
        title="Portfolios"
        description="Navigate to each portfolio for detailed company metrics"
      />

      <div className="grid md:grid-cols-2 gap-5 stagger-fade-in">
        {/* Technology Portfolio */}
        <Link href="/dashboard/technology">
          <Card className="glass-card glass-card-hover group cursor-pointer transition-all duration-300 hover:translate-y-[-2px]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="rounded-xl bg-secondary p-3">
                  <Cpu className="h-6 w-6 text-foreground" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>

              <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                Technology
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                B2B software companies serving the consumer ecosystem
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <Badge variant="active" className="text-[10px]">
                    {technology?.activeCompanies ?? 0} Active
                  </Badge>
                  <Badge variant="realized" className="text-[10px]">
                    {technology?.realizedCompanies ?? 0} Realized
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground ml-auto">
                  {technology?.totalCompanies ?? 0} companies
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Consumer Portfolio */}
        <Link href="/dashboard/consumer">
          <Card className="glass-card glass-card-hover group cursor-pointer transition-all duration-300 hover:translate-y-[-2px]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="rounded-xl bg-secondary p-3">
                  <ShoppingBag className="h-6 w-6 text-foreground" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>

              <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                Consumer
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Championing brands that anchor modern life
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <Badge variant="active" className="text-[10px]">
                    {consumer?.activeCompanies ?? 0} Active
                  </Badge>
                  <Badge variant="realized" className="text-[10px]">
                    {consumer?.realizedCompanies ?? 0} Realized
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground ml-auto">
                  {consumer?.totalCompanies ?? 0} companies
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <SectionHeader
        title="Workspace"
        description="Inbox and calendar context for your signed-in Google Workspace account"
      />

      <div className="grid md:grid-cols-2 gap-5 stagger-fade-in">
        <Card className="glass-card">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-secondary p-3">
                    <Mail className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      Inbox Summary
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Recent messages from your Google inbox
                    </p>
                  </div>
                </div>
              </div>
              {unreadCount !== null && unreadCount !== undefined && (
                <Badge variant="warning">
                  {unreadCount} unread
                </Badge>
              )}
            </div>

            {workspaceLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading inbox summary...
              </div>
            ) : workspaceError ? (
              <p className="text-sm text-destructive">
                Failed to load inbox summary: {workspaceError}
              </p>
            ) : !workspaceSummary?.connected ? (
              <p className="text-sm text-muted-foreground">
                Sign in with your VMG Google account to load Gmail and Calendar summaries.
              </p>
            ) : workspaceSummary.gmail.error ? (
              <p className="text-sm text-muted-foreground">
                {workspaceSummary.gmail.error}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {workspaceSummary.gmail.address || session?.user?.email}
                  </span>
                  <span className="text-muted-foreground">
                    {workspaceSummary.gmail.inboxCount ?? 0} inbox messages
                  </span>
                </div>

                <div className="space-y-3">
                  {workspaceSummary.gmail.messages.length > 0 ? (
                    workspaceSummary.gmail.messages.map((message) => (
                      <div
                        key={message.id}
                        className="rounded-xl border border-border bg-background/70 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {message.subject}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {message.from}
                            </p>
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatTimestamp(message.receivedAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {message.snippet}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No recent inbox messages found.
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-secondary p-3">
                  <CalendarDays className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    Calendar Summary
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upcoming events from your primary calendar
                  </p>
                </div>
              </div>
              {upcomingCount !== null && upcomingCount !== undefined && (
                <Badge variant="secondary">
                  {upcomingCount} upcoming
                </Badge>
              )}
            </div>

            {workspaceLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading calendar summary...
              </div>
            ) : workspaceError ? (
              <p className="text-sm text-destructive">
                Failed to load calendar summary: {workspaceError}
              </p>
            ) : !workspaceSummary?.connected ? (
              <p className="text-sm text-muted-foreground">
                Your dashboard will show meeting summaries here after Google sign-in completes.
              </p>
            ) : workspaceSummary.calendar.error ? (
              <p className="text-sm text-muted-foreground">
                {workspaceSummary.calendar.error}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {workspaceSummary.calendar.primaryCalendar || "Primary calendar"}
                  </span>
                  <span className="text-muted-foreground">
                    Updated {formatTimestamp(workspaceSummary.generatedAt)}
                  </span>
                </div>

                <div className="space-y-3">
                  {workspaceSummary.calendar.events.length > 0 ? (
                    workspaceSummary.calendar.events.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-xl border border-border bg-background/70 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {event.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {formatEventRange(event.start, event.end)}
                            </p>
                          </div>
                          {event.htmlLink && (
                            <a
                              href={event.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={`Open ${event.title} in Google Calendar`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                        {event.location && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {event.location}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No upcoming calendar events found.
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
