import { technologyCompanies } from "./technology-companies";
import { consumerCompanies } from "./consumer-companies";
import type { PortfolioStats } from "@/types";

function computeStats(companies: typeof technologyCompanies): PortfolioStats {
  const active = companies.filter((c) => c.status === "active");
  const sectors = new Set(companies.map((c) => c.sector));

  return {
    totalCompanies: companies.length,
    activeCompanies: active.length,
    realizedCompanies: companies.length - active.length,
    sectors: sectors.size,
  };
}

export const technologyStats = computeStats(technologyCompanies);
export const consumerStats = computeStats(consumerCompanies);

export const overallStats: PortfolioStats = {
  totalCompanies: technologyStats.totalCompanies + consumerStats.totalCompanies,
  activeCompanies: technologyStats.activeCompanies + consumerStats.activeCompanies,
  realizedCompanies: technologyStats.realizedCompanies + consumerStats.realizedCompanies,
  sectors: technologyStats.sectors + consumerStats.sectors,
};
