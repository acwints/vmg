"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCompanies, useFundingRounds, useMacroIndicators } from "@/hooks/use-api";
import { SectionHeader } from "@/components/shared/section-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Compass,
  Cpu,
  Loader2,
  RadioTower,
  ShoppingBag,
} from "lucide-react";

const featuredIndicators = [
  { id: "FEDFUNDS", label: "Fed Funds" },
  { id: "CPIAUCSL", label: "Inflation" },
  { id: "UMCSENT", label: "Consumer Sentiment" },
  { id: "A191RL1Q225SBEA", label: "GDP Growth" },
];

function fmtValue(value: number, unit: string) {
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "$") return `$${value.toLocaleString()}`;
  return `${value.toFixed(1)}${unit ? ` ${unit}` : ""}`;
}

function fmtUSD(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function IndustryPage() {
  const {
    companies: consumerCompanies,
    loading: consumerLoading,
    error: consumerError,
  } = useCompanies({
    portfolio: "consumer",
  });
  const {
    companies: technologyCompanies,
    loading: technologyLoading,
    error: technologyError,
  } = useCompanies({
    portfolio: "technology",
  });
  const { rounds, loading: roundsLoading, error: roundsError } = useFundingRounds();
  const { indicators, loading: macroLoading, error: macroError } = useMacroIndicators();

  const loading = consumerLoading || technologyLoading || roundsLoading || macroLoading;
  const error = consumerError || technologyError || roundsError || macroError;

  const macroCards = useMemo(
    () =>
      featuredIndicators
        .map((item) => {
          const indicator = indicators.find((entry) => entry.series_id === item.id);
          return indicator ? { ...item, indicator } : null;
        })
        .filter(Boolean),
    [indicators]
  );

  const totalTrackedCompanies = consumerCompanies.length + technologyCompanies.length;
  const recentRounds = [...rounds]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 5);
  const recentCapital = recentRounds.reduce((sum, round) => sum + round.amount, 0);

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
        <p className="text-sm text-destructive">Failed to load industry data: {error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 animate-fade-in">
      <SectionHeader
        title="Industry"
        description="Macro context, market maps, and strategy-specific industry views for Consumer and Technology."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="Tracked Companies" value={totalTrackedCompanies} icon={Compass} />
        <StatsCard
          title="Consumer Coverage"
          value={consumerCompanies.length}
          icon={ShoppingBag}
        />
        <StatsCard
          title="Technology Coverage"
          value={technologyCompanies.length}
          icon={Cpu}
        />
        <StatsCard
          title="Recent Financing"
          value={recentRounds.length}
          description={fmtUSD(recentCapital)}
          icon={RadioTower}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Link href="/dashboard/industry/consumer">
          <Card className="glass-card glass-card-hover group cursor-pointer transition-all duration-300 hover:translate-y-[-2px]">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl bg-secondary p-3">
                  <ShoppingBag className="h-6 w-6 text-foreground" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Consumer
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Category maps, financing activity, and market signals around branded consumer sectors.
                </p>
              </div>
              <Badge variant="outline">{consumerCompanies.length} tracked companies</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/industry/technology">
          <Card className="glass-card glass-card-hover group cursor-pointer transition-all duration-300 hover:translate-y-[-2px]">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl bg-secondary p-3">
                  <Cpu className="h-6 w-6 text-foreground" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Technology
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Software and marketplace landscape tracking with market and funding context.
                </p>
              </div>
              <Badge variant="outline">{technologyCompanies.length} tracked companies</Badge>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="glass-card">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-1">
            <h3 className="font-display text-xl font-semibold text-foreground">
              Macro context
            </h3>
            <p className="text-sm text-muted-foreground">
              Portfolio-level market framing belongs under Industry, not on the main dashboard.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {macroCards.map((item) =>
              item ? (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border/70 bg-background/60 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {fmtValue(item.indicator.value, item.indicator.unit)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.indicator.category}
                  </p>
                </div>
              ) : null
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-foreground">Recent rounds</h4>
              <span className="text-xs text-muted-foreground">
                {fmtUSD(recentCapital)} across latest activity
              </span>
            </div>

            {recentRounds.map((round) => (
              <div
                key={round.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{round.companyName}</p>
                  <p className="text-xs text-muted-foreground">
                    {round.roundName} led by {round.leadInvestor}
                  </p>
                </div>
                <Badge variant="outline">{fmtUSD(round.amount)}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
