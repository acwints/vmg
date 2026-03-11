"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/shared/section-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useFundOverview } from "@/hooks/use-api";
import {
  ArrowRight,
  DollarSign,
  Landmark,
  Loader2,
  PieChart,
  TrendingUp,
} from "lucide-react";

function fmtUSD(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function FundPage() {
  const { overview, loading, error } = useFundOverview();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-destructive">
          Failed to load fund overview{error ? `: ${error}` : "."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 animate-fade-in">
      <SectionHeader
        title="Fund"
        description="Fund-level dashboards and model entry points for each VMG vehicle."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="Total AUM" value={fmtUSD(overview.totalAum)} icon={Landmark} />
        <StatsCard title="Invested" value={fmtUSD(overview.totalInvested)} icon={DollarSign} />
        <StatsCard title="Dry Powder" value={fmtUSD(overview.totalDryPowder)} icon={PieChart} />
        <StatsCard
          title="Weighted TVPI"
          value={`${overview.weightedTvpi.toFixed(2)}x`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {overview.funds.map((fund) => (
          <Link key={fund.id} href={`/dashboard/fund/${fund.slug}`}>
            <Card className="glass-card glass-card-hover group h-full cursor-pointer transition-all duration-300 hover:translate-y-[-2px]">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {fund.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Vintage {fund.vintageYear} {fund.strategy} vehicle
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{fund.vintageYear}</Badge>
                  <Badge variant="secondary" className="capitalize">
                    {fund.strategy}
                  </Badge>
                  <Badge
                    variant={
                      fund.status === "active"
                        ? "active"
                        : fund.status === "harvesting"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {fund.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">Committed</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {fmtUSD(fund.committedCapital)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">Investments</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {fund.snapshot?.numInvestments ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">Dry Powder</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {fund.snapshot ? fmtUSD(fund.snapshot.dryPowder) : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">Net IRR</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {fund.snapshot ? `${(fund.snapshot.netIrr * 100).toFixed(1)}%` : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
