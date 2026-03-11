"use client";

import { useParams } from "next/navigation";
import { useCompany } from "@/hooks/use-api";
import { CompanyDetail } from "@/components/company/company-detail";
import { EmptyState } from "@/components/shared/empty-state";
import { Loader2, Target } from "lucide-react";

export default function PortfolioConsumerCompanyPage() {
  const params = useParams();
  const { company, loading, error } = useCompany(params.slug as string);

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
        <p className="text-sm text-destructive">Failed to load company: {error}</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-5xl mx-auto w-full">
        <EmptyState
          icon={Target}
          title="Company not found"
          description="The company you're looking for doesn't exist in the Consumer portfolio."
          actionLabel="Back to Consumer"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  return (
    <CompanyDetail
      company={company}
      backHref="/dashboard/portfolio/consumer"
      backLabel="Consumer Portfolio"
    />
  );
}
