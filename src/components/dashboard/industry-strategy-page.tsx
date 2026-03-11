"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useCompanies, useFundingRounds } from "@/hooks/use-api";
import { SectionHeader } from "@/components/shared/section-header";
import { StatsCard } from "@/components/shared/stats-card";
import { CompanyCard } from "@/components/shared/company-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Building2, Loader2, RadioTower, Sparkles, Target } from "lucide-react";
import type { Portfolio, Sector } from "@/types";

const portfolioCopy: Record<
  Portfolio,
  {
    title: string;
    description: string;
    sectorOrder: Sector[];
  }
> = {
  consumer: {
    title: "Consumer Industry",
    description:
      "Market map, sector exposure, and financing signals across branded consumer categories.",
    sectorOrder: ["beauty", "food-bev", "wellness", "pet"],
  },
  technology: {
    title: "Technology Industry",
    description:
      "Software and marketplace landscape with live financing activity and portfolio signal tracking.",
    sectorOrder: ["software", "marketplace"],
  },
};

const sectorLabels: Record<Sector, string> = {
  beauty: "Beauty",
  "food-bev": "Food & Beverage",
  wellness: "Wellness",
  pet: "Pet",
  software: "Software",
  marketplace: "Marketplace",
};

function fmtUSD(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function IndustryStrategyPage({ strategy }: { strategy: Portfolio }) {
  const copy = portfolioCopy[strategy];
  const { companies, loading: companiesLoading, error: companiesError } = useCompanies({
    portfolio: strategy,
  });
  const { rounds, loading: roundsLoading, error: roundsError } = useFundingRounds();

  const sectorCounts = useMemo(
    () =>
      copy.sectorOrder.map((sector) => ({
        sector,
        count: companies.filter((company) => company.sector === sector).length,
      })),
    [companies, copy.sectorOrder]
  );

  const companyIds = useMemo(() => new Set(companies.map((company) => company.id)), [companies]);
  const filteredRounds = useMemo(
    () =>
      rounds
        .filter((round) => companyIds.has(round.companyId))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [companyIds, rounds]
  );

  const activeCompanies = companies.filter((company) => company.status === "active").length;
  const recentRounds = filteredRounds.slice(0, 5);
  const totalRecentCapital = recentRounds.reduce((sum, round) => sum + round.amount, 0);

  if (companiesLoading || roundsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (companiesError || roundsError) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-destructive">
          Failed to load industry data: {companiesError || roundsError}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 animate-fade-in">
      <div className="space-y-3">
        <Link
          href="/dashboard/industry"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to industry overview
        </Link>

        <SectionHeader title={copy.title} description={copy.description} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="Tracked Companies" value={companies.length} icon={Building2} />
        <StatsCard title="Active Footprint" value={activeCompanies} icon={Target} />
        <StatsCard
          title="Sector Coverage"
          value={sectorCounts.filter((item) => item.count > 0).length}
          icon={Sparkles}
        />
        <StatsCard
          title="Recent Financing"
          value={recentRounds.length}
          description={fmtUSD(totalRecentCapital)}
          icon={RadioTower}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sectorCounts.map((item) => (
          <Badge key={item.sector} variant="outline">
            {sectorLabels[item.sector]} {item.count}
          </Badge>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="glass-card">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h3 className="font-display text-xl font-semibold text-foreground">
                Portfolio footprint
              </h3>
              <p className="text-sm text-muted-foreground">
                Companies currently tracked under the {strategy} industry lens.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h3 className="font-display text-xl font-semibold text-foreground">
                Financing signals
              </h3>
              <p className="text-sm text-muted-foreground">
                Recent rounds attached to tracked companies in this strategy.
              </p>
            </div>

            <div className="space-y-3">
              {recentRounds.length ? (
                recentRounds.map((round) => (
                  <div
                    key={round.id}
                    className="rounded-2xl border border-border/70 bg-background/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {round.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {round.roundName} led by {round.leadInvestor}
                        </p>
                      </div>
                      <Badge variant="outline">{fmtUSD(round.amount)}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{fmtDate(round.date)}</span>
                      <span>{round.source}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent financing records are available for this strategy.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
