// Deterministic pseudo-random from company name so data is stable across renders
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seeded(name: string, salt: number): number {
  return hash(name + String(salt));
}

function range(name: string, salt: number, min: number, max: number): number {
  return min + (seeded(name, salt) % (max - min + 1));
}

function decimal(name: string, salt: number, min: number, max: number): string {
  const val = min + (seeded(name, salt) % ((max - min) * 100 + 1)) / 100;
  return val.toFixed(1);
}

function pct(name: string, salt: number, min: number, max: number): string {
  const val = min + (seeded(name, salt) % ((max - min) * 10 + 1)) / 10;
  return val.toFixed(1);
}

function formatK(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function formatUSD(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(0) + "K";
  return "$" + n;
}

// --- Shopify ---
export function shopifyMetrics(name: string) {
  return {
    monthlyRevenue: formatUSD(range(name, 1, 800, 4500) * 1000),
    orders: formatK(range(name, 2, 2000, 18000)),
    aov: "$" + range(name, 3, 28, 95),
    conversionRate: pct(name, 4, 1.8, 4.2) + "%",
    returningCustomers: pct(name, 5, 22, 48) + "%",
    topChannel: ["DTC Website", "Wholesale", "Subscription"][seeded(name, 6) % 3],
  };
}

// --- Amazon ---
export function amazonMetrics(name: string) {
  return {
    bsr: "#" + range(name, 10, 120, 9800),
    monthlyUnits: formatK(range(name, 11, 1500, 35000)),
    rating: decimal(name, 12, 3.8, 4.9),
    reviews: formatK(range(name, 13, 200, 12000)),
    buyBoxPct: range(name, 14, 82, 99) + "%",
    adSpend: formatUSD(range(name, 15, 15, 120) * 1000),
  };
}

// --- NetSuite ---
export function netsuiteMetrics(name: string) {
  return {
    grossMargin: pct(name, 20, 42, 72) + "%",
    netRevenue: formatUSD(range(name, 21, 8, 85) * 1_000_000),
    cogs: formatUSD(range(name, 22, 3, 40) * 1_000_000),
    cashOnHand: formatUSD(range(name, 23, 2, 25) * 1_000_000),
    arDays: range(name, 24, 18, 45) + " days",
    yoyGrowth: "+" + pct(name, 25, 8, 42) + "%",
  };
}

// --- Stripe ---
export function stripeMetrics(name: string) {
  return {
    mrr: formatUSD(range(name, 30, 200, 3500) * 1000),
    arr: formatUSD(range(name, 31, 2, 42) * 1_000_000),
    customers: formatK(range(name, 32, 80, 4500)),
    churnRate: pct(name, 33, 1.2, 5.8) + "%",
    arpu: "$" + range(name, 34, 45, 350),
    nrr: range(name, 35, 105, 135) + "%",
  };
}

// --- HubSpot ---
export function hubspotMetrics(name: string) {
  const stages = ["Discovery", "Qualification", "Demo", "Proposal", "Negotiation"];
  return {
    dealsInPipeline: range(name, 70, 12, 85),
    pipelineValue: formatUSD(range(name, 71, 500, 8500) * 1000),
    avgDealSize: formatUSD(range(name, 72, 15, 120) * 1000),
    winRate: pct(name, 73, 18, 42) + "%",
    avgSalesCycle: range(name, 74, 28, 90) + " days",
    topStage: stages[seeded(name, 75) % stages.length],
  };
}

// --- Triple Whale ---
export function tripleWhaleMetrics(name: string) {
  const blendedRoas = decimal(name, 60, 2.5, 6.8);
  return {
    blendedRoas: blendedRoas + "x",
    adSpend: formatUSD(range(name, 61, 50, 450) * 1000),
    ncRoas: decimal(name, 62, 1.8, 4.5) + "x",
    mer: decimal(name, 63, 3.0, 8.5) + "x",
    cac: "$" + range(name, 64, 18, 85),
    ltv: "$" + range(name, 65, 60, 320),
  };
}

// ═══════════════════════════════════════════════════════════════
// TIME-SERIES DATA FOR CHARTS
// Each generator returns 12 months of data, deterministically
// seeded from the company name. When real APIs are connected,
// replace the body of each function with an API call — the
// return type stays the same, so charts don't change.
// ═══════════════════════════════════════════════════════════════

export interface MonthlyDataPoint {
  month: string;
  [key: string]: string | number;
}

const MONTH_LABELS = [
  "Apr", "May", "Jun", "Jul", "Aug", "Sep",
  "Oct", "Nov", "Dec", "Jan", "Feb", "Mar",
];

/** Generate a 12-point growth curve with some noise */
function growthSeries(
  name: string,
  salt: number,
  baseMin: number,
  baseMax: number,
  growthPct: number, // total growth over 12 months
): number[] {
  const base = range(name, salt, baseMin, baseMax);
  const points: number[] = [];
  for (let i = 0; i < 12; i++) {
    const trend = base * (1 + (growthPct / 100) * (i / 11));
    // deterministic noise ±5%
    const noise = 1 + ((seeded(name, salt * 100 + i) % 100) - 50) / 1000;
    points.push(Math.round(trend * noise));
  }
  return points;
}

/** Shopify time-series: revenue, orders, AOV */
export function shopifyTimeSeries(name: string): MonthlyDataPoint[] {
  const revSeries = growthSeries(name, 101, 600, 3500, range(name, 102, 15, 45));
  const orderSeries = growthSeries(name, 103, 1500, 12000, range(name, 104, 10, 35));
  return MONTH_LABELS.map((month, i) => ({
    month,
    revenue: revSeries[i] * 1000,
    orders: orderSeries[i],
    aov: Math.round((revSeries[i] * 1000) / orderSeries[i]),
  }));
}

/** Amazon time-series: units, ad spend, BSR */
export function amazonTimeSeries(name: string): MonthlyDataPoint[] {
  const unitSeries = growthSeries(name, 110, 1200, 25000, range(name, 111, 8, 30));
  const adSeries = growthSeries(name, 112, 12, 100, range(name, 113, 10, 40));
  const bsrBase = range(name, 114, 500, 8000);
  return MONTH_LABELS.map((month, i) => ({
    month,
    units: unitSeries[i],
    adSpend: adSeries[i] * 1000,
    bsr: Math.max(50, Math.round(bsrBase * (1 - 0.03 * i) + (seeded(name, 115 + i) % 200 - 100))),
  }));
}

/** NetSuite time-series: revenue, COGS, gross margin */
export function netsuiteTimeSeries(name: string): MonthlyDataPoint[] {
  const revSeries = growthSeries(name, 120, 500, 7000, range(name, 121, 12, 38));
  const marginBase = range(name, 122, 42, 68);
  return MONTH_LABELS.map((month, i) => {
    const rev = revSeries[i] * 1000;
    const margin = marginBase + (seeded(name, 123 + i) % 6 - 3);
    const cogs = Math.round(rev * (1 - margin / 100));
    return { month, revenue: rev, cogs, grossMargin: margin };
  });
}

/** Triple Whale time-series: ROAS, ad spend, CAC */
export function tripleWhaleTimeSeries(name: string): MonthlyDataPoint[] {
  const spendSeries = growthSeries(name, 160, 40, 380, range(name, 161, 15, 50));
  const roasBase = range(name, 162, 25, 55); // stored as 10x to avoid decimals
  return MONTH_LABELS.map((month, i) => ({
    month,
    adSpend: spendSeries[i] * 1000,
    roas: +(roasBase / 10 + (seeded(name, 163 + i) % 10 - 5) / 10).toFixed(1),
    cac: range(name, 164, 18, 75) + (seeded(name, 165 + i) % 12 - 6),
  }));
}

/** Stripe time-series: MRR, customers, churn */
export function stripeTimeSeries(name: string): MonthlyDataPoint[] {
  const mrrSeries = growthSeries(name, 130, 150, 2800, range(name, 131, 20, 55));
  const custSeries = growthSeries(name, 132, 60, 3500, range(name, 133, 15, 40));
  const churnBase = range(name, 134, 15, 48); // stored as 10x
  return MONTH_LABELS.map((month, i) => ({
    month,
    mrr: mrrSeries[i] * 1000,
    customers: custSeries[i],
    churn: +(churnBase / 10 - (i * 0.1) + (seeded(name, 135 + i) % 6 - 3) / 10).toFixed(1),
  }));
}

/** HubSpot time-series: pipeline value, deals, win rate */
export function hubspotTimeSeries(name: string): MonthlyDataPoint[] {
  const dealSeries = growthSeries(name, 170, 8, 60, range(name, 171, 15, 45));
  const valSeries = growthSeries(name, 172, 300, 6500, range(name, 173, 20, 50));
  const winBase = range(name, 174, 20, 38);
  return MONTH_LABELS.map((month, i) => ({
    month,
    deals: dealSeries[i],
    pipelineValue: valSeries[i] * 1000,
    winRate: +(winBase + i * 0.5 + (seeded(name, 175 + i) % 4 - 2)).toFixed(1),
  }));
}

// --- Social ---
export function socialMetrics(name: string, includeTikTok: boolean) {
  const socials: {
    platform: string;
    handle: string;
    followers: string;
    engagement: string;
    postsPerWeek: number;
  }[] = [
    {
      platform: "LinkedIn",
      handle: "@" + name.toLowerCase().replace(/[^a-z0-9]/g, ""),
      followers: formatK(range(name, 40, 2000, 85000)),
      engagement: pct(name, 41, 1.2, 6.5) + "%",
      postsPerWeek: range(name, 42, 2, 8),
    },
    {
      platform: "X",
      handle: "@" + name.toLowerCase().replace(/[^a-z0-9]/g, ""),
      followers: formatK(range(name, 43, 500, 120000)),
      engagement: pct(name, 44, 0.8, 4.2) + "%",
      postsPerWeek: range(name, 45, 3, 15),
    },
    {
      platform: "Instagram",
      handle: "@" + name.toLowerCase().replace(/[^a-z0-9]/g, ""),
      followers: formatK(range(name, 46, 5000, 350000)),
      engagement: pct(name, 47, 1.5, 7.8) + "%",
      postsPerWeek: range(name, 48, 3, 12),
    },
  ];

  if (includeTikTok) {
    socials.push({
      platform: "TikTok",
      handle: "@" + name.toLowerCase().replace(/[^a-z0-9]/g, ""),
      followers: formatK(range(name, 49, 8000, 500000)),
      engagement: pct(name, 50, 3.0, 12.5) + "%",
      postsPerWeek: range(name, 51, 2, 7),
    });
  }

  return socials;
}
