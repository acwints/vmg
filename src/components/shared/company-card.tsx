"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExternalLink, Calendar } from "lucide-react";
import type { PortfolioCompany } from "@/types";

interface CompanyCardProps {
  company: PortfolioCompany;
  className?: string;
}

const sectorBadgeVariant: Record<string, "beauty" | "food-bev" | "wellness" | "pet" | "tech"> = {
  beauty: "beauty",
  "food-bev": "food-bev",
  wellness: "wellness",
  pet: "pet",
  software: "tech",
  marketplace: "tech",
};

const sectorLabels: Record<string, string> = {
  beauty: "Beauty",
  "food-bev": "Food & Bev",
  wellness: "Wellness",
  pet: "Pet",
  software: "Software",
  marketplace: "Marketplace",
};

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

  const primaryLeader = company.leaders[0];

  return (
    <Link href={`${basePath}/${company.slug}`}>
      <Card
        className={cn(
          "glass-card glass-card-hover cursor-pointer group transition-all duration-300",
          "hover:translate-y-[-2px]",
          className
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-3.5">
            {/* Logo */}
            <div className="h-10 w-10 shrink-0 rounded-lg border border-border/50 bg-muted/30 flex items-center justify-center overflow-hidden">
              {company.logoUrl ? (
                <Image
                  src={company.logoUrl}
                  alt={`${company.name} logo`}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                  unoptimized
                />
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">
                  {initials}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary/70 transition-colors">
                  {company.name}
                </h3>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>

              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {company.description}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <Badge variant={sectorBadgeVariant[company.sector] || "secondary"}>
                  {sectorLabels[company.sector] || company.sector}
                </Badge>
                <Badge variant={company.status === "active" ? "active" : "realized"}>
                  {company.status === "active" ? "Active" : "Realized"}
                </Badge>
              </div>

              {/* Real metadata only */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                {primaryLeader && (
                  <span className="truncate">{primaryLeader.name}, {primaryLeader.title}</span>
                )}
                {!primaryLeader && company.foundedYear && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Founded {company.foundedYear}
                  </span>
                )}
                {company.acquirer && (
                  <span className="ml-auto shrink-0 text-amber-600 dark:text-amber-400 font-medium">
                    Acquired by {company.acquirer}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
