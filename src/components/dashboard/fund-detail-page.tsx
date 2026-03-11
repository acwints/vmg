"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/shared/section-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useDeploymentModel, useFundDetail } from "@/hooks/use-api";
import {
  ArrowLeft,
  CalendarRange,
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

function fmtPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function fmtDate(value: string | null) {
  if (!value) return "Ongoing";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function FundDetailPage({ slug }: { slug: string }) {
  const { fund, loading, error } = useFundDetail(slug);
  const { deployment, loading: deploymentLoading } = useDeploymentModel(slug);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-destructive">
          Failed to load fund detail{error ? `: ${error}` : "."}
        </p>
      </div>
    );
  }

  const snapshot = fund.snapshot;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 animate-fade-in">
      <div className="space-y-3">
        <Link
          href="/dashboard/fund"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to fund overview
        </Link>

        <SectionHeader
          title={fund.name}
          description={`Vintage ${fund.vintageYear} ${fund.strategy} vehicle with live deployment and holdings data.`}
        />
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="Committed" value={fmtUSD(fund.committedCapital)} icon={Landmark} />
        <StatsCard
          title="Invested"
          value={snapshot ? fmtUSD(snapshot.investedCapital) : "N/A"}
          icon={DollarSign}
        />
        <StatsCard
          title="Dry Powder"
          value={snapshot ? fmtUSD(snapshot.dryPowder) : "N/A"}
          icon={PieChart}
        />
        <StatsCard
          title="Net IRR"
          value={snapshot ? fmtPct(snapshot.netIrr) : "N/A"}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="glass-card">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Holdings and deal objects
                </h3>
                <p className="text-sm text-muted-foreground">
                  Active investments, reserve posture, and realized outcomes for this fund.
                </p>
              </div>
              {snapshot ? (
                <Badge variant="outline">{snapshot.numInvestments} holdings</Badge>
              ) : null}
            </div>

            <div className="space-y-3">
              {fund.investments.map((investment) => (
                <div
                  key={investment.id}
                  className="rounded-2xl border border-border/70 bg-background/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">
                          {investment.companyName}
                        </h4>
                        <Badge variant="outline" className="text-[10px]">
                          {investment.roundType}
                        </Badge>
                        {investment.isRealized ? (
                          <Badge variant="realized" className="text-[10px]">
                            Realized
                          </Badge>
                        ) : (
                          <Badge variant="active" className="text-[10px]">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {investment.companySector} sector
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {fmtUSD(investment.investedCapital)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {investment.currentMoic.toFixed(2)}x current MOIC
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em]">Entry</p>
                      <p className="mt-1 text-foreground">{fmtDate(investment.investmentDate)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em]">Ownership</p>
                      <p className="mt-1 text-foreground">{fmtPct(investment.ownershipPct)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em]">Current Value</p>
                      <p className="mt-1 text-foreground">{fmtUSD(investment.currentValuation)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em]">Reserved</p>
                      <p className="mt-1 text-foreground">{fmtUSD(investment.reservedCapital)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="glass-card">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-secondary p-3">
                  <CalendarRange className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Deployment model
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This is where the live model sits for each fund.
                  </p>
                </div>
              </div>

              {deploymentLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading deployment model...
                </div>
              ) : deployment ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">Committed</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {fmtUSD(deployment.committed)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">Deployment</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {fmtPct(deployment.deploymentPct)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">Reserved</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {fmtUSD(deployment.reserved)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">Months Since Close</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {deployment.monthsSinceClose}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {deployment.projectedQuarters.slice(0, 4).map((quarter) => (
                      <div
                        key={quarter.quarter}
                        className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm"
                      >
                        <span className="text-muted-foreground">{quarter.quarter}</span>
                        <span className="font-medium text-foreground">
                          {fmtUSD(quarter.projectedDeploy)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No deployment model is available for this fund yet.
                </p>
              )}
            </CardContent>
          </Card>

          {snapshot ? (
            <Card className="glass-card">
              <CardContent className="space-y-3 p-6">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Performance snapshot
                </h3>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">TVPI</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {snapshot.tvpi.toFixed(2)}x
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">DPI</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {snapshot.dpi.toFixed(2)}x
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">Unrealized</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {fmtUSD(snapshot.unrealizedValue)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">Realized</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {fmtUSD(snapshot.realizedValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
