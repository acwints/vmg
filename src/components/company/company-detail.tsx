"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LeaderCard } from "@/components/shared/leader-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FundingTimeline } from "@/components/company/funding-timeline";
import {
  shopifyMetrics,
  amazonMetrics,
  netsuiteMetrics,
  stripeMetrics,
  socialMetrics,
} from "@/lib/mock-metrics";
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
  ExternalLink,
} from "lucide-react";

const sectorLabels: Record<string, string> = {
  beauty: "Beauty & Personal Care",
  "food-bev": "Food & Beverage",
  wellness: "Wellness & Fitness",
  pet: "Pet",
  software: "Software",
  marketplace: "Marketplace",
};

const sectorBadgeVariant: Record<string, "beauty" | "food-bev" | "wellness" | "pet" | "tech"> = {
  beauty: "beauty",
  "food-bev": "food-bev",
  wellness: "wellness",
  pet: "pet",
  software: "tech",
  marketplace: "tech",
};

// Platform brand colors
const platformColors: Record<string, { bg: string; text: string; icon: string }> = {
  LinkedIn: { bg: "bg-[#0A66C2]/10", text: "text-[#0A66C2]", icon: "text-[#0A66C2]" },
  X: { bg: "bg-foreground/5", text: "text-foreground", icon: "text-foreground" },
  Instagram: { bg: "bg-[#E4405F]/10", text: "text-[#E4405F]", icon: "text-[#E4405F]" },
  TikTok: { bg: "bg-[#00F2EA]/10", text: "text-[#00897B]", icon: "text-[#00897B]" },
};

function MetricRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${accent ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

function IntegrationCard({
  logo,
  name,
  status,
  children,
}: {
  logo: string;
  name: string;
  status: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <Image src={logo} alt={name} width={20} height={20} className="rounded" unoptimized />
          <span className="text-sm font-semibold text-foreground">{name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{status}</span>
        </div>
      </div>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

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

  // Generate deterministic mock data
  const shopify = isConsumer ? shopifyMetrics(company.name) : null;
  const amazon = isConsumer ? amazonMetrics(company.name) : null;
  const netsuite = isConsumer ? netsuiteMetrics(company.name) : null;
  const stripe = !isConsumer ? stripeMetrics(company.name) : null;
  const socials = socialMetrics(company.name, isConsumer);

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
            <Badge variant={sectorBadgeVariant[company.sector] || "secondary"}>
              {sectorLabels[company.sector] || company.sector}
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
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Integrations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Consumer: Shopify */}
          {shopify && (
            <IntegrationCard
              logo="https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-shopping-bag-full-color-66166b2e55d67988b56b4bd28b63c271e2b9713c48f43c9a22cabcbac4886abf.svg"
              name="Shopify"
              status="Connected"
            >
              <MetricRow label="Monthly Revenue" value={shopify.monthlyRevenue} accent />
              <MetricRow label="Orders" value={shopify.orders} />
              <MetricRow label="AOV" value={shopify.aov} />
              <MetricRow label="Conversion Rate" value={shopify.conversionRate} />
              <MetricRow label="Returning Customers" value={shopify.returningCustomers} />
              <MetricRow label="Top Channel" value={shopify.topChannel} />
            </IntegrationCard>
          )}

          {/* Consumer: Amazon */}
          {amazon && (
            <IntegrationCard
              logo="https://www.google.com/s2/favicons?domain=amazon.com&sz=128"
              name="Amazon Seller Central"
              status="Connected"
            >
              <MetricRow label="Best Seller Rank" value={amazon.bsr} />
              <MetricRow label="Monthly Units" value={amazon.monthlyUnits} />
              <MetricRow label="Rating" value={amazon.rating + " / 5.0"} />
              <MetricRow label="Reviews" value={amazon.reviews} />
              <MetricRow label="Buy Box %" value={amazon.buyBoxPct} />
              <MetricRow label="Ad Spend (mo)" value={amazon.adSpend} />
            </IntegrationCard>
          )}

          {/* Consumer: NetSuite */}
          {netsuite && (
            <IntegrationCard
              logo="https://www.google.com/s2/favicons?domain=netsuite.com&sz=128"
              name="NetSuite"
              status="Connected"
            >
              <MetricRow label="Net Revenue" value={netsuite.netRevenue} accent />
              <MetricRow label="YoY Growth" value={netsuite.yoyGrowth} accent />
              <MetricRow label="Gross Margin" value={netsuite.grossMargin} />
              <MetricRow label="COGS" value={netsuite.cogs} />
              <MetricRow label="Cash on Hand" value={netsuite.cashOnHand} />
              <MetricRow label="AR Days" value={netsuite.arDays} />
            </IntegrationCard>
          )}

          {/* Technology: Stripe */}
          {stripe && (
            <IntegrationCard
              logo="https://www.google.com/s2/favicons?domain=stripe.com&sz=128"
              name="Stripe"
              status="Connected"
            >
              <MetricRow label="MRR" value={stripe.mrr} accent />
              <MetricRow label="ARR" value={stripe.arr} accent />
              <MetricRow label="Customers" value={stripe.customers} />
              <MetricRow label="Churn Rate" value={stripe.churnRate} />
              <MetricRow label="ARPU" value={stripe.arpu} />
              <MetricRow label="Net Revenue Retention" value={stripe.nrr} />
            </IntegrationCard>
          )}
        </div>
      </section>

      {/* ── Funding History ── */}
      <FundingTimeline companyId={company.id} />

      {/* ── Social Accounts ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Social Accounts
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {socials.map((s) => {
            const colors = platformColors[s.platform] || platformColors.X;
            return (
              <Card key={s.platform} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}>
                      {s.platform}
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/70" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">{s.handle}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-muted-foreground">Followers</span>
                      <span className="text-sm font-bold text-foreground">{s.followers}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-muted-foreground">Engagement</span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{s.engagement}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-muted-foreground">Posts / wk</span>
                      <span className="text-sm font-medium text-foreground">{s.postsPerWeek}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

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
