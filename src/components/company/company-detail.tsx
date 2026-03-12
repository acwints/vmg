"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LeaderCard } from "@/components/shared/leader-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FundingTimeline } from "@/components/company/funding-timeline";
import { CompanyIntegrations } from "@/components/company/company-integrations";
import { CompanySocials } from "@/components/company/company-socials";
import { SECTOR_BADGE_VARIANT, SECTOR_LABELS_LONG } from "@/lib/constants";
import type { PortfolioCompany } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Globe,
  Target,
  Award,
  FileText,
  Briefcase,
  Layers,
  Clock,
} from "lucide-react";

interface CompanyDetailProps {
  company: PortfolioCompany;
  backHref: string;
  backLabel: string;
}

export function CompanyDetail({ company, backHref, backLabel }: CompanyDetailProps) {
  const initials = company.name
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w[0]))
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isConsumer = company.portfolio === "consumer";

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Breadcrumb */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {backLabel}
      </Link>

      {/* ── Company Header ── */}
      <div className="flex items-start gap-5">
        <div className="h-16 w-16 shrink-0 rounded-xl border border-border/50 bg-muted/30 flex items-center justify-center overflow-hidden">
          {company.logoUrl ? (
            <Image
              src={company.logoUrl}
              alt={`${company.name} logo`}
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              unoptimized
            />
          ) : (
            <span className="text-lg font-semibold text-muted-foreground">
              {initials}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {company.name}
            </h1>
            <Badge variant={SECTOR_BADGE_VARIANT[company.sector] || "secondary"}>
              {SECTOR_LABELS_LONG[company.sector] || company.sector}
            </Badge>
            <Badge variant={company.status === "active" ? "active" : "realized"}>
              {company.status === "active" ? "Active" : "Realized"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {company.description}
          </p>

          {/* Metadata row */}
          <div className="flex items-center gap-5 mt-3 flex-wrap">
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Globe className="h-3 w-3" />
                {company.domain || "Website"}
              </a>
            )}
            {company.foundedYear && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Founded {company.foundedYear}
              </span>
            )}
            {company.investmentYear && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                VMG invested {company.investmentYear}
              </span>
            )}
            {company.exitYear && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Award className="h-3 w-3" />
                Exited {company.exitYear}
              </span>
            )}
            {company.acquirer && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <Target className="h-3 w-3" />
                Acquired by {company.acquirer}
              </span>
            )}
            {company.category && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Layers className="h-3 w-3" />
                {company.category}
              </span>
            )}
          </div>
        </div>
      </div>

      <Separator className="opacity-30" />

      {/* ── Leadership ── */}
      {company.leaders.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Leadership
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {company.leaders.map((leader) => (
              <LeaderCard key={leader.name} leader={leader} />
            ))}
          </div>
        </section>
      )}

      {/* ── Integrations ── */}
      <CompanyIntegrations companyName={company.name} isConsumer={isConsumer} />

      {/* ── Funding History ── */}
      <FundingTimeline companyId={company.id} />

      {/* ── Social Accounts ── */}
      <CompanySocials companyName={company.name} isConsumer={isConsumer} />

      {/* Activity Log */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Activity Log
        </h2>
        <Card className="glass-card">
          <CardContent className="p-6">
            <EmptyState
              icon={Clock}
              title="No activity recorded"
              description="Investment activity, thesis updates, and key events will appear here."
            />
          </CardContent>
        </Card>
      </section>

      {/* Team Notes */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Team Notes
        </h2>
        <Card className="glass-card">
          <CardContent className="p-6">
            <EmptyState
              icon={FileText}
              title="No team notes yet"
              description="Notes and annotations from the investment team will appear here."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
