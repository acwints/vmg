"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePipelineDeals } from "@/hooks/use-api";
import { SectionHeader } from "@/components/shared/section-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Kanban,
  Loader2,
  ShoppingBag,
  Target,
  Cpu,
  FileText,
} from "lucide-react";

function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function PipelinePage() {
  const { deals, loading, error } = usePipelineDeals();

  const consumerDeals = useMemo(
    () => deals.filter((deal) => deal.strategy === "consumer"),
    [deals]
  );
  const technologyDeals = useMemo(
    () => deals.filter((deal) => deal.strategy === "technology"),
    [deals]
  );

  const activeConsumer = consumerDeals.filter((deal) => !["closed", "passed"].includes(deal.stage));
  const activeTechnology = technologyDeals.filter((deal) => !["closed", "passed"].includes(deal.stage));
  const closedDeals = deals.filter((deal) => deal.stage === "closed");

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
        <p className="text-sm text-destructive">Failed to load pipeline: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
      <SectionHeader
        title="Pipeline"
        description="Strategy-level sourcing and diligence dashboards for current pipeline work"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              Connect to Affinity
            </Button>
            <span className="text-xs text-muted-foreground">or</span>
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              HubSpot
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Deals" value={deals.length} icon={Kanban} />
        <StatsCard title="Active" value={activeConsumer.length + activeTechnology.length} icon={Target} />
        <StatsCard title="Closed Won" value={closedDeals.length} icon={CheckCircle2} />
        <StatsCard title="Memos" value={closedDeals.length} description="attached to closed deals" icon={FileText} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Link href="/dashboard/pipeline/consumer">
          <Card className="glass-card glass-card-hover group cursor-pointer transition-all duration-300 hover:translate-y-[-2px]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="rounded-xl bg-secondary p-3">
                  <ShoppingBag className="h-6 w-6 text-foreground" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                Consumer Pipeline
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Brand, retail, and category diligence across the consumer strategy.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{consumerDeals.length} total deals</Badge>
                <Badge variant="warning">{activeConsumer.length} active</Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {fmtUSD(activeConsumer.reduce((sum, deal) => sum + deal.dealSize, 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/pipeline/technology">
          <Card className="glass-card glass-card-hover group cursor-pointer transition-all duration-300 hover:translate-y-[-2px]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="rounded-xl bg-secondary p-3">
                  <Cpu className="h-6 w-6 text-foreground" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                Technology Pipeline
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Software and marketplace opportunities advancing through diligence.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{technologyDeals.length} total deals</Badge>
                <Badge variant="warning">{activeTechnology.length} active</Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {fmtUSD(activeTechnology.reduce((sum, deal) => sum + deal.dealSize, 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

    </div>
  );
}
