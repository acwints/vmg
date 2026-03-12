"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { SECTOR_BADGE_VARIANT, SECTOR_LABELS_SHORT } from "@/lib/constants";
import type { PortfolioCompany } from "@/types";

interface CompanyCardProps {
  company: PortfolioCompany;
  className?: string;
}

const sectorBadgeVariant = SECTOR_BADGE_VARIANT;
const sectorLabels = SECTOR_LABELS_SHORT;

export function CompanyCard({ company, className }: CompanyCardProps) {
  const initials = company.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const basePath =
    company.portfolio === "technology"
      ? "/dashboard/portfolio/technology"
      : "/dashboard/portfolio/consumer";

  const isRealized = company.status !== "active";

  return (
    <Link href={`${basePath}/${company.slug}`}>
      <Card
        className={cn(
          "glass-card glass-card-hover cursor-pointer group transition-all duration-300",
          "hover:translate-y-[-2px] h-full",
          className
        )}
      >
        <CardContent className="flex h-full flex-col p-3 sm:p-5">
          {/* Header row: logo + name */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg border border-border/50 bg-muted/30 flex items-center justify-center overflow-hidden">
              {company.logoUrl ? (
                <Image
                  src={company.logoUrl}
                  alt={`${company.name} logo`}
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                  unoptimized
                />
              ) : (
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {initials}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary/70 transition-colors">
                  {company.name}
                </h3>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
              {company.foundedYear && (
                <p className="text-[11px] text-muted-foreground/70">
                  Est. {company.foundedYear}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {company.description}
          </p>

          {/* Badges */}
          <div className="mt-auto flex items-center gap-1.5 pt-3">
            <Badge variant={sectorBadgeVariant[company.sector] || "secondary"} className="whitespace-nowrap text-[10px]">
              {sectorLabels[company.sector] || company.sector}
            </Badge>
            <Badge variant={isRealized ? "realized" : "active"} className="text-[10px]">
              {isRealized ? "Realized" : "Active"}
            </Badge>
            {isRealized && company.acquirer && (
              <span className="ml-auto truncate text-[10px] font-medium text-amber-600 dark:text-amber-400">
                {company.acquirer}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
