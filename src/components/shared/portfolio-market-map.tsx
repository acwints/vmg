"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PortfolioCompany } from "@/types";

const sectorLabels: Record<string, string> = {
  beauty: "Beauty & Personal Care",
  "food-bev": "Food & Beverage",
  wellness: "Health & Wellness",
  pet: "Pet",
  software: "Software",
  marketplace: "Marketplace",
};

const sectorColors: Record<string, { bg: string; border: string; header: string; text: string }> = {
  beauty: {
    bg: "bg-pink-50 dark:bg-pink-950/20",
    border: "border-pink-200 dark:border-pink-800/40",
    header: "bg-pink-100 dark:bg-pink-900/30 text-pink-900 dark:text-pink-200",
    text: "text-pink-700 dark:text-pink-300",
  },
  "food-bev": {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800/40",
    header: "bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200",
    text: "text-orange-700 dark:text-orange-300",
  },
  wellness: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/40",
    header: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  pet: {
    bg: "bg-sky-50 dark:bg-sky-950/20",
    border: "border-sky-200 dark:border-sky-800/40",
    header: "bg-sky-100 dark:bg-sky-900/30 text-sky-900 dark:text-sky-200",
    text: "text-sky-700 dark:text-sky-300",
  },
  software: {
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800/40",
    header: "bg-violet-100 dark:bg-violet-900/30 text-violet-900 dark:text-violet-200",
    text: "text-violet-700 dark:text-violet-300",
  },
  marketplace: {
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    border: "border-indigo-200 dark:border-indigo-800/40",
    header: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200",
    text: "text-indigo-700 dark:text-indigo-300",
  },
};

const defaultColors = sectorColors.software;

interface CategoryGroup {
  category: string;
  sector: string;
  companies: PortfolioCompany[];
}

function CompanyCell({ company }: { company: PortfolioCompany }) {
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
        "group relative flex flex-col items-center justify-center gap-1.5 rounded-lg border p-3 transition-all duration-200",
        "hover:scale-[1.03] hover:shadow-md",
        isRealized
          ? "border-border/40 bg-muted/30 opacity-70 hover:opacity-100"
          : "border-border/50 bg-background/80 hover:bg-background"
      )}
    >
      <div className="h-7 w-7 shrink-0 rounded-md border border-border/30 bg-background flex items-center justify-center overflow-hidden">
        {company.logoUrl ? (
          <Image
            src={company.logoUrl}
            alt={company.name}
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
            unoptimized
          />
        ) : (
          <span className="text-[8px] font-bold text-muted-foreground">{initials}</span>
        )}
      </div>
      <span className="text-[10px] font-medium leading-tight text-center text-foreground/90 line-clamp-2">
        {company.name}
      </span>
      {isRealized && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 dark:bg-amber-500" title="Realized" />
      )}
    </Link>
  );
}

export function PortfolioMarketMap({ companies }: { companies: PortfolioCompany[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, CategoryGroup>();

    for (const company of companies) {
      const category = company.category || sectorLabels[company.sector] || company.sector;
      const key = `${company.sector}::${category}`;
      if (!map.has(key)) {
        map.set(key, { category, sector: company.sector, companies: [] });
      }
      map.get(key)!.companies.push(company);
    }

    // Sort: larger groups first, then alphabetically
    return Array.from(map.values()).sort(
      (a, b) => b.companies.length - a.companies.length || a.category.localeCompare(b.category)
    );
  }, [companies]);

  // Split into large (3+) and small (1-2) groups
  const largeGroups = groups.filter((g) => g.companies.length >= 3);
  const smallGroups = groups.filter((g) => g.companies.length < 3);

  return (
    <div className="space-y-4">
      {/* Large category groups */}
      <div className="grid gap-4 md:grid-cols-2">
        {largeGroups.map((group) => {
          const colors = sectorColors[group.sector] || defaultColors;
          return (
            <div
              key={group.category}
              className={cn(
                "rounded-xl border overflow-hidden",
                colors.border,
                colors.bg
              )}
            >
              <div className={cn("px-4 py-2.5 flex items-center justify-between", colors.header)}>
                <span className="text-xs font-semibold tracking-wide">{group.category}</span>
                <span className="text-[10px] font-medium opacity-70">{group.companies.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3">
                {group.companies
                  .sort((a, b) => (a.status === "active" ? 0 : 1) - (b.status === "active" ? 0 : 1))
                  .map((company) => (
                    <CompanyCell key={company.id} company={company} />
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Smaller categories in a denser grid */}
      {smallGroups.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {smallGroups.map((group) => {
            const colors = sectorColors[group.sector] || defaultColors;
            return (
              <div
                key={group.category}
                className={cn(
                  "rounded-xl border overflow-hidden",
                  colors.border,
                  colors.bg
                )}
              >
                <div className={cn("px-4 py-2 flex items-center justify-between", colors.header)}>
                  <span className="text-xs font-semibold tracking-wide">{group.category}</span>
                  <span className="text-[10px] font-medium opacity-70">{group.companies.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3">
                  {group.companies
                    .sort((a, b) => (a.status === "active" ? 0 : 1) - (b.status === "active" ? 0 : 1))
                    .map((company) => (
                      <CompanyCell key={company.id} company={company} />
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-foreground/20" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-amber-400" />
          <span>Realized</span>
        </div>
      </div>
    </div>
  );
}
