const API_BASE = "/api/backend";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// --- Types matching the API response ---

export interface LeaderResponse {
  id: string;
  name: string;
  title: string;
  linkedin_url: string | null;
  headshot_url: string | null;
}

export interface CompanyResponse {
  id: string;
  name: string;
  slug: string;
  portfolio: string;
  sector: string;
  status: string;
  description: string;
  website: string | null;
  logo_url: string | null;
  domain: string | null;
  investment_year: number | null;
  exit_year: number | null;
  acquirer: string | null;
  founded_year: number | null;
  hq_location: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  leaders: LeaderResponse[];
}

export interface CompanyListResponse {
  companies: CompanyResponse[];
  total: number;
}

export interface PortfolioStatsResponse {
  total_companies: number;
  active_companies: number;
  realized_companies: number;
  sectors: number;
}

export interface StatsResponse {
  overall: PortfolioStatsResponse;
  technology: PortfolioStatsResponse;
  consumer: PortfolioStatsResponse;
}

export interface MemoResponse {
  id: string;
  title: string;
  content: string | null;
  status: string;
  author: string;
  created_at: string;
  updated_at: string;
  companies: CompanyResponse[];
}

export interface ActivityLogResponse {
  id: string;
  company_id: string;
  event_type: string;
  title: string;
  description: string | null;
  author: string | null;
  created_at: string;
}

// --- API functions ---

export async function getCompanies(params?: {
  portfolio?: string;
  sector?: string;
  status?: string;
  search?: string;
}): Promise<CompanyListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.portfolio) searchParams.set("portfolio", params.portfolio);
  if (params?.sector) searchParams.set("sector", params.sector);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.search) searchParams.set("search", params.search);
  const qs = searchParams.toString();
  return fetchAPI(`/api/companies${qs ? `?${qs}` : ""}`);
}

export async function getCompany(slug: string): Promise<CompanyResponse> {
  return fetchAPI(`/api/companies/${slug}`);
}

export async function getStats(): Promise<StatsResponse> {
  return fetchAPI("/api/stats");
}

export async function getMemos(): Promise<{ memos: MemoResponse[]; total: number }> {
  return fetchAPI("/api/memos");
}

export async function getActivityLogs(companyId: string): Promise<ActivityLogResponse[]> {
  return fetchAPI(`/api/activity?company_id=${companyId}`);
}

// --- Adapters to convert API response to frontend types ---

import type { PortfolioCompany, CompanyLeader, PortfolioStats, Fund, FundMetrics, FundDetail, InvestmentRecord, FundOverview, PortfolioConstruction, DeploymentModel, FundReturns, FundingRound, PipelineDeal } from "@/types";

export function toPortfolioCompany(c: CompanyResponse): PortfolioCompany {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    portfolio: c.portfolio as PortfolioCompany["portfolio"],
    sector: c.sector as PortfolioCompany["sector"],
    status: c.status as PortfolioCompany["status"],
    description: c.description,
    website: c.website || undefined,
    logoUrl: c.domain
      ? `https://www.google.com/s2/favicons?domain=${c.domain}&sz=128`
      : undefined,
    domain: c.domain || undefined,
    investmentYear: c.investment_year || undefined,
    exitYear: c.exit_year || undefined,
    acquirer: c.acquirer || undefined,
    foundedYear: c.founded_year || undefined,
    hqLocation: c.hq_location || undefined,
    category: c.category || undefined,
    leaders: c.leaders.map(toCompanyLeader),
  };
}

export function toCompanyLeader(l: LeaderResponse): CompanyLeader {
  return {
    name: l.name,
    title: l.title,
    linkedinUrl: l.linkedin_url || undefined,
  };
}

export function toPortfolioStats(s: PortfolioStatsResponse): PortfolioStats {
  return {
    totalCompanies: s.total_companies,
    activeCompanies: s.active_companies,
    realizedCompanies: s.realized_companies,
    sectors: s.sectors,
  };
}

// --- Fund Model API types ---

export interface FundApiResponse {
  id: string;
  name: string;
  slug: string;
  strategy: string;
  vintage_year: number;
  committed_capital: number;
  management_fee_rate: number;
  carry_rate: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FundSnapshotApiResponse {
  fund_id: string;
  as_of_date: string;
  invested_capital: number;
  realized_value: number;
  unrealized_value: number;
  total_value: number;
  dry_powder: number;
  reserved_capital: number;
  tvpi: number;
  dpi: number;
  rvpi: number;
  gross_irr: number;
  net_irr: number;
  num_investments: number;
  num_realized: number;
}

export interface InvestmentApiResponse {
  id: string;
  fund_id: string;
  company_id: string;
  company_name: string;
  company_slug: string;
  company_sector: string;
  investment_date: string;
  round_type: string;
  invested_capital: number;
  entry_valuation: number;
  ownership_pct: number;
  current_valuation: number;
  current_moic: number;
  is_realized: boolean;
  exit_date: string | null;
  exit_proceeds: number | null;
  realized_moic: number | null;
  realized_irr: number | null;
  reserved_capital: number;
  created_at: string;
  updated_at: string;
}

export interface FundDetailApiResponse extends FundApiResponse {
  snapshot: FundSnapshotApiResponse | null;
  investments: InvestmentApiResponse[];
}

export interface FundOverviewApiResponse {
  funds: FundDetailApiResponse[];
  total_aum: number;
  total_invested: number;
  total_dry_powder: number;
  total_realized: number;
  total_unrealized: number;
  weighted_tvpi: number;
  weighted_net_irr: number;
}

export interface ConstructionItemApi {
  label: string;
  invested: number;
  pct: number;
  count: number;
}

export interface PortfolioConstructionApiResponse {
  by_strategy: ConstructionItemApi[];
  by_sector: ConstructionItemApi[];
  by_vintage: ConstructionItemApi[];
  concentration: { company: string; invested: number; pct_of_fund: number }[];
  reserve_summary: { total_reserved: number; total_deployed: number; adequacy_ratio: number };
}

export interface DeploymentModelApiResponse {
  fund_id: string;
  fund_name: string;
  committed: number;
  invested: number;
  reserved: number;
  dry_powder: number;
  months_since_close: number;
  deployment_pct: number;
  projected_quarters: { quarter: string; projected_deploy: number; cumulative: number }[];
}

export interface FundReturnsApiResponse {
  funds: {
    fund_name: string;
    fund_slug: string;
    vintage_year: number;
    strategy: string;
    tvpi: number;
    dpi: number;
    rvpi: number;
    gross_irr: number;
    net_irr: number;
  }[];
  moic_distribution: { label: string; count: number }[];
}

// --- Fund Model fetch functions ---

export async function getFundOverview(): Promise<FundOverviewApiResponse> {
  return fetchAPI("/api/fund-model/overview");
}

export async function getFundDetail(slug: string): Promise<FundDetailApiResponse> {
  return fetchAPI(`/api/fund-model/funds/${slug}`);
}

export async function getInvestments(params?: { fundSlug?: string; realized?: boolean }): Promise<InvestmentApiResponse[]> {
  const searchParams = new URLSearchParams();
  if (params?.fundSlug) searchParams.set("fund_slug", params.fundSlug);
  if (params?.realized !== undefined) searchParams.set("realized", String(params.realized));
  const qs = searchParams.toString();
  return fetchAPI(`/api/fund-model/investments${qs ? `?${qs}` : ""}`);
}

export async function getPortfolioConstruction(): Promise<PortfolioConstructionApiResponse> {
  return fetchAPI("/api/fund-model/construction");
}

export async function getDeploymentModel(fundSlug: string): Promise<DeploymentModelApiResponse> {
  return fetchAPI(`/api/fund-model/deployment/${fundSlug}`);
}

export async function getFundReturns(): Promise<FundReturnsApiResponse> {
  return fetchAPI("/api/fund-model/returns");
}

// --- Fund Model adapters ---

export function toFund(f: FundApiResponse): Fund {
  return {
    id: f.id,
    name: f.name,
    slug: f.slug,
    strategy: f.strategy as Fund["strategy"],
    vintageYear: f.vintage_year,
    committedCapital: f.committed_capital,
    managementFeeRate: f.management_fee_rate,
    carryRate: f.carry_rate,
    status: f.status as Fund["status"],
  };
}

export function toFundMetrics(s: FundSnapshotApiResponse): FundMetrics {
  return {
    fundId: s.fund_id,
    asOfDate: s.as_of_date,
    investedCapital: s.invested_capital,
    realizedValue: s.realized_value,
    unrealizedValue: s.unrealized_value,
    totalValue: s.total_value,
    dryPowder: s.dry_powder,
    reservedCapital: s.reserved_capital,
    tvpi: s.tvpi,
    dpi: s.dpi,
    rvpi: s.rvpi,
    grossIrr: s.gross_irr,
    netIrr: s.net_irr,
    numInvestments: s.num_investments,
    numRealized: s.num_realized,
  };
}

export function toInvestment(i: InvestmentApiResponse): InvestmentRecord {
  return {
    id: i.id,
    fundId: i.fund_id,
    companyId: i.company_id,
    companyName: i.company_name,
    companySlug: i.company_slug,
    companySector: i.company_sector,
    investmentDate: i.investment_date,
    roundType: i.round_type,
    investedCapital: i.invested_capital,
    entryValuation: i.entry_valuation,
    ownershipPct: i.ownership_pct,
    currentValuation: i.current_valuation,
    currentMoic: i.current_moic,
    isRealized: i.is_realized,
    exitDate: i.exit_date,
    exitProceeds: i.exit_proceeds,
    realizedMoic: i.realized_moic,
    realizedIrr: i.realized_irr,
    reservedCapital: i.reserved_capital,
  };
}

export function toFundDetail(f: FundDetailApiResponse): FundDetail {
  return {
    ...toFund(f),
    snapshot: f.snapshot ? toFundMetrics(f.snapshot) : null,
    investments: f.investments.map(toInvestment),
  };
}

export function toFundOverview(o: FundOverviewApiResponse): FundOverview {
  return {
    funds: o.funds.map(toFundDetail),
    totalAum: o.total_aum,
    totalInvested: o.total_invested,
    totalDryPowder: o.total_dry_powder,
    totalRealized: o.total_realized,
    totalUnrealized: o.total_unrealized,
    weightedTvpi: o.weighted_tvpi,
    weightedNetIrr: o.weighted_net_irr,
  };
}

export function toPortfolioConstruction(c: PortfolioConstructionApiResponse): PortfolioConstruction {
  return {
    byStrategy: c.by_strategy,
    bySector: c.by_sector,
    byVintage: c.by_vintage,
    concentration: c.concentration.map(x => ({ company: x.company, invested: x.invested, pctOfFund: x.pct_of_fund })),
    reserveSummary: { totalReserved: c.reserve_summary.total_reserved, totalDeployed: c.reserve_summary.total_deployed, adequacyRatio: c.reserve_summary.adequacy_ratio },
  };
}

export function toDeploymentModel(d: DeploymentModelApiResponse): DeploymentModel {
  return {
    fundId: d.fund_id,
    fundName: d.fund_name,
    committed: d.committed,
    invested: d.invested,
    reserved: d.reserved,
    dryPowder: d.dry_powder,
    monthsSinceClose: d.months_since_close,
    deploymentPct: d.deployment_pct,
    projectedQuarters: d.projected_quarters.map(q => ({ quarter: q.quarter, projectedDeploy: q.projected_deploy, cumulative: q.cumulative })),
  };
}

// --- Macro API types ---

export interface MacroIndicator {
  name: string;
  series_id: string;
  value: number;
  previous_value: number;
  change: number;
  unit: string;
  category: string; // "rates" | "inflation" | "growth" | "sentiment"
  last_updated: string;
}

export interface MacroSeries {
  series_id: string;
  name: string;
  unit: string;
  observations: { date: string; value: number }[];
}

export interface AssistantContext {
  portfolio_summary: string;
  fund_performance: string;
  macro_context: string;
  funding_data: string;
  timestamp: string;
}

// --- Macro fetch functions ---

export async function getMacroIndicators(): Promise<MacroIndicator[]> {
  const data = await fetchAPI<{ indicators: MacroIndicator[] }>("/api/macro/indicators");
  return data.indicators;
}

export async function getMacroSeries(seriesId: string): Promise<MacroSeries> {
  return fetchAPI(`/api/macro/series/${seriesId}`);
}

export async function getAssistantContext(): Promise<AssistantContext> {
  return fetchAPI("/api/assistant/context");
}

// --- Funding Rounds ---

export interface FundingRoundApiResponse {
  id: string;
  company_id: string;
  company_name: string;
  round_name: string;
  amount: number;
  date: string;
  lead_investor: string;
  investors: string;
  pre_money_valuation: number | null;
  source: string;
}

export async function getFundingRounds(companyId?: string): Promise<FundingRoundApiResponse[]> {
  const qs = companyId ? `?company_id=${companyId}` : "";
  const data = await fetchAPI<{ funding_rounds: FundingRoundApiResponse[] }>(`/api/macro/funding${qs}`);
  return data.funding_rounds;
}

export function toFundingRound(r: FundingRoundApiResponse): FundingRound {
  return {
    id: r.id,
    companyId: r.company_id,
    companyName: r.company_name,
    roundName: r.round_name,
    amount: r.amount,
    date: r.date,
    leadInvestor: r.lead_investor,
    investors: r.investors,
    preMoneyValuation: r.pre_money_valuation,
    source: r.source,
  };
}

// --- Pipeline Deals ---

export interface PipelineDealApiResponse {
  id: string;
  company_name: string;
  sector: string;
  stage: string;
  strategy: string;
  description: string;
  deal_size: number;
  valuation: number;
  revenue: number;
  growth_rate: number;
  source: string;
  lead_contact: string;
  priority: string;
  notes: string;
  entered_pipeline: string;
  last_activity: string;
}

export async function getPipelineDeals(): Promise<PipelineDealApiResponse[]> {
  const data = await fetchAPI<{ deals: PipelineDealApiResponse[] }>("/api/pipeline/deals");
  return data.deals;
}

export async function updateDealStage(dealId: string, stage: string): Promise<void> {
  await fetchAPI(`/api/pipeline/deals/${dealId}/stage?stage=${stage}`, { method: "PATCH" });
}

export function toPipelineDeal(d: PipelineDealApiResponse): PipelineDeal {
  return {
    id: d.id,
    companyName: d.company_name,
    sector: d.sector,
    stage: d.stage as PipelineDeal["stage"],
    strategy: d.strategy,
    description: d.description,
    dealSize: d.deal_size,
    valuation: d.valuation,
    revenue: d.revenue,
    growthRate: d.growth_rate,
    source: d.source,
    leadContact: d.lead_contact,
    priority: d.priority,
    notes: d.notes,
    enteredPipeline: d.entered_pipeline,
    lastActivity: d.last_activity,
  };
}

export function toFundReturns(r: FundReturnsApiResponse): FundReturns {
  return {
    funds: r.funds.map(f => ({
      fundName: f.fund_name,
      fundSlug: f.fund_slug,
      vintageYear: f.vintage_year,
      strategy: f.strategy,
      tvpi: f.tvpi,
      dpi: f.dpi,
      rvpi: f.rvpi,
      grossIrr: f.gross_irr,
      netIrr: f.net_irr,
    })),
    moicDistribution: r.moic_distribution,
  };
}
