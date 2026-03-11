export type Portfolio = "technology" | "consumer";

export type Sector =
  | "beauty"
  | "food-bev"
  | "wellness"
  | "pet"
  | "software"
  | "marketplace";

export type CompanyStatus = "active" | "realized";

export interface CompanyLeader {
  name: string;
  title: string;
  linkedinUrl?: string;
}

export interface DataSource {
  id: string;
  name: string;
  description: string;
  category: "enrichment" | "analytics" | "social" | "commerce" | "market-intel" | "talent" | "news";
  applicableTo: Portfolio[] | "all";
}

export interface PortfolioCompany {
  id: string;
  name: string;
  slug: string;
  portfolio: Portfolio;
  sector: Sector;
  status: CompanyStatus;
  description: string;
  website?: string;
  logoUrl?: string;
  domain?: string;

  // Investment details
  investmentYear?: number;
  exitYear?: number;
  acquirer?: string;

  // Company details
  foundedYear?: number;
  hqLocation?: string;
  category?: string;

  // Leadership
  leaders: CompanyLeader[];
}

export interface PortfolioStats {
  totalCompanies: number;
  activeCompanies: number;
  realizedCompanies: number;
  sectors: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface WorkspaceSummaryMessage {
  id: string;
  from: string;
  subject: string;
  receivedAt: string | null;
  snippet: string;
}

export interface WorkspaceSummaryEvent {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  location: string | null;
  htmlLink: string | null;
}

export interface WorkspaceSummary {
  generatedAt: string;
  connected: boolean;
  hostedDomain: string | null;
  scopes: string[];
  authError: string | null;
  gmail: {
    connected: boolean;
    address: string | null;
    inboxCount: number | null;
    unreadCount: number | null;
    messages: WorkspaceSummaryMessage[];
    error: string | null;
  };
  calendar: {
    connected: boolean;
    primaryCalendar: string | null;
    upcomingCount: number | null;
    events: WorkspaceSummaryEvent[];
    error: string | null;
  };
}

// Fund Model types
export type FundStrategy = "consumer" | "technology";
export type FundStatus = "active" | "harvesting" | "closed";

export interface Fund {
  id: string;
  name: string;
  slug: string;
  strategy: FundStrategy;
  vintageYear: number;
  committedCapital: number;
  managementFeeRate: number;
  carryRate: number;
  status: FundStatus;
}

export interface FundMetrics {
  fundId: string;
  asOfDate: string;
  investedCapital: number;
  realizedValue: number;
  unrealizedValue: number;
  totalValue: number;
  dryPowder: number;
  reservedCapital: number;
  tvpi: number;
  dpi: number;
  rvpi: number;
  grossIrr: number;
  netIrr: number;
  numInvestments: number;
  numRealized: number;
}

export interface FundDetail extends Fund {
  snapshot: FundMetrics | null;
  investments: InvestmentRecord[];
}

export interface InvestmentRecord {
  id: string;
  fundId: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  companySector: string;
  investmentDate: string;
  roundType: string;
  investedCapital: number;
  entryValuation: number;
  ownershipPct: number;
  currentValuation: number;
  currentMoic: number;
  isRealized: boolean;
  exitDate: string | null;
  exitProceeds: number | null;
  realizedMoic: number | null;
  realizedIrr: number | null;
  reservedCapital: number;
}

export interface FundOverview {
  funds: FundDetail[];
  totalAum: number;
  totalInvested: number;
  totalDryPowder: number;
  totalRealized: number;
  totalUnrealized: number;
  weightedTvpi: number;
  weightedNetIrr: number;
}

export interface ConstructionItem {
  label: string;
  invested: number;
  pct: number;
  count: number;
}

export interface PortfolioConstruction {
  byStrategy: ConstructionItem[];
  bySector: ConstructionItem[];
  byVintage: ConstructionItem[];
  concentration: { company: string; invested: number; pctOfFund: number }[];
  reserveSummary: { totalReserved: number; totalDeployed: number; adequacyRatio: number };
}

export interface DeploymentModel {
  fundId: string;
  fundName: string;
  committed: number;
  invested: number;
  reserved: number;
  dryPowder: number;
  monthsSinceClose: number;
  deploymentPct: number;
  projectedQuarters: { quarter: string; projectedDeploy: number; cumulative: number }[];
}

export interface FundReturnRow {
  fundName: string;
  fundSlug: string;
  vintageYear: number;
  strategy: string;
  tvpi: number;
  dpi: number;
  rvpi: number;
  grossIrr: number;
  netIrr: number;
}

export interface FundReturns {
  funds: FundReturnRow[];
  moicDistribution: { label: string; count: number }[];
}

// Funding Round types
export interface FundingRound {
  id: string;
  companyId: string;
  companyName: string;
  roundName: string;
  amount: number;
  date: string;
  leadInvestor: string;
  investors: string;
  preMoneyValuation: number | null;
  source: string;
}

// Pipeline types
export type DealStage = "screening" | "diligence" | "ic_review" | "term_sheet" | "closed" | "passed";

export interface PipelineDeal {
  id: string;
  companyName: string;
  sector: string;
  stage: DealStage;
  strategy: string;
  description: string;
  dealSize: number;
  valuation: number;
  revenue: number;
  growthRate: number;
  source: string;
  leadContact: string;
  priority: string;
  notes: string;
  enteredPipeline: string;
  lastActivity: string;
}
