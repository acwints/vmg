"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PortfolioCompany } from "@/types";

// ── Consolidated theme mappings ──
// Maps granular categories + sector fallbacks into 5-8 macro themes per portfolio

const TECH_THEMES: Record<string, string> = {
  // Commerce Infrastructure
  "Commerce Experience Platform": "Commerce Infrastructure",
  "Ecommerce Page Builder": "Commerce Infrastructure",
  "Headless Commerce Platform": "Commerce Infrastructure",
  "Ecommerce Platform (LATAM)": "Commerce Infrastructure",
  "Ecommerce Analytics": "Commerce Infrastructure",
  "Post-Purchase Experience": "Commerce Infrastructure",
  "Social Commerce / Rewards": "Commerce Infrastructure",
  // Marketing & Data
  "SMS & Email Marketing": "Marketing & Data",
  "AI Marketing / Personalization": "Marketing & Data",
  "AI Marketing Automation": "Marketing & Data",
  "Brand Tracking / Market Research": "Marketing & Data",
  "Retail Media Platform": "Marketing & Data",
  "Media & Information Services": "Marketing & Data",
  // Supply Chain & Operations
  "Supply Chain / Grocery Tech": "Supply Chain & Ops",
  "Supply Chain AI": "Supply Chain & Ops",
  "Dairy Supply Chain Software": "Supply Chain & Ops",
  "Specification Management": "Supply Chain & Ops",
  "Workforce Management": "Supply Chain & Ops",
  "Car Wash CRM / SaaS": "Supply Chain & Ops",
  // Vertical SaaS
  "Salon & Spa Management Software": "Vertical SaaS",
  "Beauty Tech / Cosmetic Formulation": "Vertical SaaS",
  "Business/Productivity Software": "Vertical SaaS",
  // Consumer Services Tech
  "Healthcare Services": "Consumer Services Tech",
  "Telehealth / Prescription Skincare": "Consumer Services Tech",
  "Financial Services / Lending": "Consumer Services Tech",
  "Faith & Wellness App": "Consumer Services Tech",
  "Online Grocery Delivery": "Consumer Services Tech",
};

const CONSUMER_THEMES: Record<string, string> = {
  // Explicit category mappings
  "Personal Products": "Hair & Personal Care",
  Accessories: "Fragrance & Accessories",
  "Food Products": "Snacks & Packaged Food",
  "Clinics / Outpatient Services": "Fitness & Wellness",
  "Fitness & Gyms": "Fitness & Wellness",
};

// Sector-level fallback for consumer companies without a category
const CONSUMER_SECTOR_THEMES: Record<string, Record<string, string>> = {
  beauty: {
    // Sub-classify by known brand types
    "Drunk Elephant": "Prestige Skincare",
    "Shani Darden Skin Care": "Prestige Skincare",
    Necessaire: "Prestige Skincare",
    SkinMedica: "Prestige Skincare",
    Colorescience: "Prestige Skincare",
    BeautyStat: "Prestige Skincare",
    "Danessa Myricks Beauty": "Color & Fragrance",
    Kosas: "Color & Fragrance",
    Snif: "Color & Fragrance",
    "Yatsen Global": "Color & Fragrance",
    K18: "Hair & Personal Care",
    Briogeo: "Hair & Personal Care",
    "The Honey Pot Company": "Hair & Personal Care",
    BabyGanics: "Hair & Personal Care",
    "Hello Bello": "Hair & Personal Care",
    "Sun Bum": "Hair & Personal Care",
    Treat: "Prestige Skincare",
    "Speck Products": "Fragrance & Accessories",
    Timbuk2: "Fragrance & Accessories",
    "Pour La Victoire": "Fragrance & Accessories",
    _default: "Hair & Personal Care",
  },
  "food-bev": {
    Spindrift: "Beverages",
    "Stone Brewing": "Beverages",
    "Stone Distributing": "Beverages",
    "Humm Kombucha": "Beverages",
    "Ilegal Mezcal": "Beverages",
    "Mighty Leaf Tea": "Beverages",
    Ghost: "Fresh & Functional",
    "Daily Harvest": "Fresh & Functional",
    Bobbie: "Fresh & Functional",
    TerraVia: "Fresh & Functional",
    Nutpods: "Beverages",
    _default: "Snacks & Packaged Food",
  },
  wellness: {
    _default: "Fitness & Wellness",
  },
  pet: {
    _default: "Pet",
  },
};

function resolveTheme(company: PortfolioCompany): string {
  if (company.portfolio === "technology") {
    if (company.category && TECH_THEMES[company.category]) {
      return TECH_THEMES[company.category];
    }
    // Fallback for tech without category
    return company.sector === "marketplace" ? "Commerce Infrastructure" : "Vertical SaaS";
  }

  // Consumer
  if (company.category && CONSUMER_THEMES[company.category]) {
    return CONSUMER_THEMES[company.category];
  }

  const sectorMap = CONSUMER_SECTOR_THEMES[company.sector];
  if (sectorMap) {
    return sectorMap[company.name] || sectorMap._default || company.sector;
  }

  return company.sector;
}

// ── Theme colors (order matters for layout) ──

const THEME_COLORS: Record<string, { bg: string; border: string; header: string; accent: string }> = {
  // Tech themes
  "Commerce Infrastructure": {
    bg: "bg-violet-50/80 dark:bg-violet-950/20",
    border: "border-violet-200/80 dark:border-violet-800/30",
    header: "bg-violet-100 dark:bg-violet-900/40 text-violet-900 dark:text-violet-200",
    accent: "bg-violet-500",
  },
  "Marketing & Data": {
    bg: "bg-blue-50/80 dark:bg-blue-950/20",
    border: "border-blue-200/80 dark:border-blue-800/30",
    header: "bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200",
    accent: "bg-blue-500",
  },
  "Supply Chain & Ops": {
    bg: "bg-teal-50/80 dark:bg-teal-950/20",
    border: "border-teal-200/80 dark:border-teal-800/30",
    header: "bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200",
    accent: "bg-teal-500",
  },
  "Vertical SaaS": {
    bg: "bg-indigo-50/80 dark:bg-indigo-950/20",
    border: "border-indigo-200/80 dark:border-indigo-800/30",
    header: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200",
    accent: "bg-indigo-500",
  },
  "Consumer Services Tech": {
    bg: "bg-slate-50/80 dark:bg-slate-950/20",
    border: "border-slate-200/80 dark:border-slate-800/30",
    header: "bg-slate-100 dark:bg-slate-900/40 text-slate-900 dark:text-slate-200",
    accent: "bg-slate-500",
  },
  // Consumer themes
  "Prestige Skincare": {
    bg: "bg-rose-50/80 dark:bg-rose-950/20",
    border: "border-rose-200/80 dark:border-rose-800/30",
    header: "bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200",
    accent: "bg-rose-500",
  },
  "Hair & Personal Care": {
    bg: "bg-pink-50/80 dark:bg-pink-950/20",
    border: "border-pink-200/80 dark:border-pink-800/30",
    header: "bg-pink-100 dark:bg-pink-900/40 text-pink-900 dark:text-pink-200",
    accent: "bg-pink-500",
  },
  "Color & Fragrance": {
    bg: "bg-fuchsia-50/80 dark:bg-fuchsia-950/20",
    border: "border-fuchsia-200/80 dark:border-fuchsia-800/30",
    header: "bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-900 dark:text-fuchsia-200",
    accent: "bg-fuchsia-500",
  },
  "Fragrance & Accessories": {
    bg: "bg-amber-50/80 dark:bg-amber-950/20",
    border: "border-amber-200/80 dark:border-amber-800/30",
    header: "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200",
    accent: "bg-amber-500",
  },
  "Snacks & Packaged Food": {
    bg: "bg-orange-50/80 dark:bg-orange-950/20",
    border: "border-orange-200/80 dark:border-orange-800/30",
    header: "bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-200",
    accent: "bg-orange-500",
  },
  Beverages: {
    bg: "bg-yellow-50/80 dark:bg-yellow-950/20",
    border: "border-yellow-200/80 dark:border-yellow-800/30",
    header: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200",
    accent: "bg-yellow-500",
  },
  "Fresh & Functional": {
    bg: "bg-lime-50/80 dark:bg-lime-950/20",
    border: "border-lime-200/80 dark:border-lime-800/30",
    header: "bg-lime-100 dark:bg-lime-900/40 text-lime-900 dark:text-lime-200",
    accent: "bg-lime-600",
  },
  "Fitness & Wellness": {
    bg: "bg-emerald-50/80 dark:bg-emerald-950/20",
    border: "border-emerald-200/80 dark:border-emerald-800/30",
    header: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200",
    accent: "bg-emerald-500",
  },
  Pet: {
    bg: "bg-sky-50/80 dark:bg-sky-950/20",
    border: "border-sky-200/80 dark:border-sky-800/30",
    header: "bg-sky-100 dark:bg-sky-900/40 text-sky-900 dark:text-sky-200",
    accent: "bg-sky-500",
  },
};

const DEFAULT_COLORS = {
  bg: "bg-gray-50/80 dark:bg-gray-950/20",
  border: "border-gray-200/80 dark:border-gray-800/30",
  header: "bg-gray-100 dark:bg-gray-900/40 text-gray-900 dark:text-gray-200",
  accent: "bg-gray-500",
};

// ── Components ──

function CompanyTile({ company }: { company: PortfolioCompany }) {
  const basePath =
    company.portfolio === "technology"
      ? "/dashboard/portfolio/technology"
      : "/dashboard/portfolio/consumer";
  const initials = company.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const isRealized = company.status === "realized";

  return (
    <Link
      href={`${basePath}/${company.slug}`}
      className={cn(
        "group relative flex items-center gap-2 rounded-md border px-2.5 py-2 transition-all duration-150",
        "hover:shadow-sm hover:scale-[1.02]",
        isRealized
          ? "border-border/30 bg-background/40 opacity-60 hover:opacity-90"
          : "border-border/50 bg-background/90 hover:bg-background"
      )}
    >
      <div className="h-6 w-6 shrink-0 rounded border border-border/30 bg-background flex items-center justify-center overflow-hidden">
        {company.logoUrl ? (
          <Image
            src={company.logoUrl}
            alt={company.name}
            width={18}
            height={18}
            className="h-[18px] w-[18px] object-contain"
            unoptimized
          />
        ) : (
          <span className="text-[7px] font-bold text-muted-foreground">{initials}</span>
        )}
      </div>
      <span className={cn(
        "text-[11px] font-medium leading-tight truncate",
        isRealized ? "text-muted-foreground" : "text-foreground/90"
      )}>
        {company.name}
      </span>
      {isRealized && (
        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 dark:bg-amber-500" />
      )}
    </Link>
  );
}

interface ThemeGroup {
  theme: string;
  companies: PortfolioCompany[];
  activeCount: number;
  realizedCount: number;
}

export function PortfolioMarketMap({ companies }: { companies: PortfolioCompany[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, PortfolioCompany[]>();

    for (const company of companies) {
      const theme = resolveTheme(company);
      if (!map.has(theme)) map.set(theme, []);
      map.get(theme)!.push(company);
    }

    const result: ThemeGroup[] = [];
    for (const [theme, cos] of map) {
      // Sort: active first, then alphabetical
      cos.sort((a, b) => {
        if (a.status !== b.status) return a.status === "active" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      result.push({
        theme,
        companies: cos,
        activeCount: cos.filter((c) => c.status === "active").length,
        realizedCount: cos.filter((c) => c.status !== "active").length,
      });
    }

    // Sort by size descending
    result.sort((a, b) => b.companies.length - a.companies.length);
    return result;
  }, [companies]);

  const totalActive = companies.filter((c) => c.status === "active").length;
  const totalRealized = companies.length - totalActive;

  return (
    <div className="space-y-3">
      {/* Canvas header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">
          {groups.length} themes across {companies.length} companies
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-foreground/30" />
            {totalActive} active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            {totalRealized} realized
          </span>
        </div>
      </div>

      {/* Market map canvas */}
      <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
        {groups.map((group) => {
          const colors = THEME_COLORS[group.theme] || DEFAULT_COLORS;
          return (
            <div
              key={group.theme}
              className={cn(
                "rounded-lg border overflow-hidden",
                colors.border,
                colors.bg
              )}
            >
              {/* Theme header */}
              <div className={cn("flex items-center gap-3 px-3.5 py-2", colors.header)}>
                <div className={cn("h-2 w-2 rounded-full shrink-0", colors.accent)} />
                <span className="text-[11px] font-semibold tracking-wide flex-1">{group.theme}</span>
                <span className="text-[10px] opacity-60">
                  {group.activeCount}A{group.realizedCount > 0 ? ` / ${group.realizedCount}R` : ""}
                </span>
              </div>

              {/* Company tiles in a flow grid */}
              <div className="flex flex-wrap gap-1.5 p-2.5">
                {group.companies.map((company) => (
                  <CompanyTile key={company.id} company={company} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
