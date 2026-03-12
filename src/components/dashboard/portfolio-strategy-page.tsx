"use client";

import { useState } from "react";
import { StatsCard } from "@/components/shared/stats-card";
import { SectionHeader } from "@/components/shared/section-header";
import { CompanyCard } from "@/components/shared/company-card";
import { PortfolioMarketMap } from "@/components/shared/portfolio-market-map";
import { ViewToggle, type ViewMode } from "@/components/shared/view-toggle";
import { Badge } from "@/components/ui/badge";
import { useCompanies, useStats } from "@/hooks/use-api";
import { Building2, Loader2, Target } from "lucide-react";
import type { Portfolio } from "@/types";

type BadgeVariant = "beauty" | "food-bev" | "wellness" | "pet" | "tech";

interface SectorBadge {
  sector: string;
  label: string;
  variant: BadgeVariant;
}

const strategyConfig: Record<
  Portfolio,
  {
    title: string;
    description: string;
    sectorBadges: SectorBadge[];
  }
> = {
  consumer: {
    title: "Consumer Portfolio",
    description: "Championing brands that anchor modern life",
    sectorBadges: [
      { sector: "beauty", label: "Beauty", variant: "beauty" },
      { sector: "food-bev", label: "Food & Bev", variant: "food-bev" },
      { sector: "wellness", label: "Wellness", variant: "wellness" },
      { sector: "pet", label: "Pet", variant: "pet" },
    ],
  },
  technology: {
    title: "Technology Portfolio",
    description: "B2B software companies serving the consumer ecosystem",
    sectorBadges: [
      { sector: "software", label: "Software", variant: "tech" },
      { sector: "marketplace", label: "Marketplace", variant: "tech" },
    ],
  },
};

export function PortfolioStrategyPage({ strategy }: { strategy: Portfolio }) {
  const config = strategyConfig[strategy];
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const { companies, loading: companiesLoading, error: companiesError } = useCompanies({
    portfolio: strategy,
  });
  const stats = useStats();

  const portfolioStats = stats[strategy];
  const loading = companiesLoading || stats.loading;
  const error = companiesError || stats.error;

  const activeCount = companies.filter((company) => company.status === "active").length;
  const realizedCount = companies.filter((company) => company.status === "realized").length;

  const sectorCounts = config.sectorBadges.map((badge) => ({
    ...badge,
    count: companies.filter((company) => company.sector === badge.sector).length,
  }));

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
        <p className="text-sm text-destructive">Failed to load data: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
      <SectionHeader
        title={config.title}
        description={config.description}
        action={<ViewToggle mode={viewMode} onChange={setViewMode} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-fade-in">
        <StatsCard
          title="Total Companies"
          value={portfolioStats?.totalCompanies ?? 0}
          icon={Building2}
        />
        <StatsCard
          title="Active"
          value={portfolioStats?.activeCompanies ?? 0}
          icon={Target}
        />
        <StatsCard
          title="Realized"
          value={portfolioStats?.realizedCompanies ?? 0}
          description={`${portfolioStats?.sectors ?? 0} sectors`}
          icon={Target}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="active">{activeCount} Active</Badge>
        <Badge variant="realized">{realizedCount} Realized</Badge>
        {sectorCounts.map((item) => (
          <Badge key={item.sector} variant={item.variant}>
            {item.count} {item.label}
          </Badge>
        ))}
      </div>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-fade-in">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <PortfolioMarketMap companies={companies} />
      )}
    </div>
  );
}
