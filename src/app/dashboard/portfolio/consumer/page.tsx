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

export default function PortfolioConsumerPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const { companies, loading: companiesLoading, error: companiesError } = useCompanies({
    portfolio: "consumer",
  });
  const { consumer: consumerStats, loading: statsLoading, error: statsError } = useStats();

  const loading = companiesLoading || statsLoading;
  const error = companiesError || statsError;

  const activeCount = companies.filter((company) => company.status === "active").length;
  const realizedCount = companies.filter((company) => company.status === "realized").length;
  const beautyCount = companies.filter((company) => company.sector === "beauty").length;
  const foodBevCount = companies.filter((company) => company.sector === "food-bev").length;
  const wellnessCount = companies.filter((company) => company.sector === "wellness").length;
  const petCount = companies.filter((company) => company.sector === "pet").length;

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
        title="Consumer Portfolio"
        description="Championing brands that anchor modern life"
        action={<ViewToggle mode={viewMode} onChange={setViewMode} />}
      />

      <div className="grid grid-cols-3 gap-4 stagger-fade-in">
        <StatsCard
          title="Total Companies"
          value={consumerStats?.totalCompanies ?? 0}
          icon={Building2}
        />
        <StatsCard
          title="Active"
          value={consumerStats?.activeCompanies ?? 0}
          icon={Target}
        />
        <StatsCard
          title="Realized"
          value={consumerStats?.realizedCompanies ?? 0}
          description={`${consumerStats?.sectors ?? 0} sectors`}
          icon={Target}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="active">{activeCount} Active</Badge>
        <Badge variant="realized">{realizedCount} Realized</Badge>
        <Badge variant="beauty">{beautyCount} Beauty</Badge>
        <Badge variant="food-bev">{foodBevCount} Food & Bev</Badge>
        <Badge variant="wellness">{wellnessCount} Wellness</Badge>
        <Badge variant="pet">{petCount} Pet</Badge>
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
