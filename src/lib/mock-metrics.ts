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
