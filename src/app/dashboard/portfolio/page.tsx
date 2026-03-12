"use client";

import Link from "next/link";
import { StatsCard } from "@/components/shared/stats-card";
import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStats } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import {
  Award,
  ArrowRight,
  Building2,
  Cpu,
  ExternalLink,
  Loader2,
  ShoppingBag,
  Target,
} from "lucide-react";

export default function PortfolioPage() {
  const { overall, technology, consumer, loading, error } = useStats();

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
        <p className="text-sm text-destructive">Failed to load portfolio stats: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
      <SectionHeader
        title="Portfolio"
        description="Portfolio-level dashboards for VMG Consumer and VMG Technology"
        action={
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            Connect to PitchBook
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-fade-in">
        <StatsCard
          title="Total Portfolio"
          value={overall?.totalCompanies ?? 0}
          description="companies across both strategies"
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
          description="tracked across consumer and technology"
          icon={Award}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-5 stagger-fade-in">
        <Link href="/dashboard/portfolio/technology">
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

        <Link href="/dashboard/portfolio/consumer">
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
    </div>
  );
}
