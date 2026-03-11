"use client";

import { StatsCard } from "@/components/shared/stats-card";
import { SectionHeader } from "@/components/shared/section-header";
import { CompanyCard } from "@/components/shared/company-card";
import { Badge } from "@/components/ui/badge";
import { useCompanies, useStats } from "@/hooks/use-api";
import { Building2, Loader2, Target } from "lucide-react";

export default function PortfolioTechnologyPage() {
  const { companies, loading: companiesLoading, error: companiesError } = useCompanies({
    portfolio: "technology",
  });
  const {
    technology: technologyStats,
    loading: statsLoading,
    error: statsError,
  } = useStats();

  const loading = companiesLoading || statsLoading;
  const error = companiesError || statsError;

  const activeCount = companies.filter((company) => company.status === "active").length;
  const realizedCount = companies.filter((company) => company.status === "realized").length;
  const softwareCount = companies.filter((company) => company.sector === "software").length;
  const marketplaceCount = companies.filter((company) => company.sector === "marketplace").length;

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
        title="Technology Portfolio"
        description="B2B software companies serving the consumer ecosystem"
      />

      <div className="grid grid-cols-3 gap-4 stagger-fade-in">
        <StatsCard
          title="Total Companies"
          value={technologyStats?.totalCompanies ?? 0}
          icon={Building2}
        />
        <StatsCard
          title="Active"
          value={technologyStats?.activeCompanies ?? 0}
          icon={Target}
        />
        <StatsCard
          title="Realized"
          value={technologyStats?.realizedCompanies ?? 0}
          description={`${technologyStats?.sectors ?? 0} sectors`}
          icon={Target}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="active">{activeCount} Active</Badge>
        <Badge variant="realized">{realizedCount} Realized</Badge>
        <Badge variant="tech">{softwareCount} Software</Badge>
        <Badge variant="tech">{marketplaceCount} Marketplace</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-fade-in">
        {companies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </div>
  );
}
