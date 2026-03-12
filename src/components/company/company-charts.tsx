"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Target,
  Users,
  Activity,
  Megaphone,
} from "lucide-react";
import { ChartCard } from "./chart-card";
import {
  shopifyTimeSeries,
  amazonTimeSeries,
  netsuiteTimeSeries,
  tripleWhaleTimeSeries,
  stripeTimeSeries,
  hubspotTimeSeries,
} from "@/lib/mock-metrics";

interface CompanyChartsProps {
  companyName: string;
  isConsumer: boolean;
}

// ── Shared chart styling ─────────────────────────────────────
const GRID_PROPS = { strokeDasharray: "3 3", stroke: "hsl(220 10% 30% / 0.2)" };
const AXIS_STYLE = { fontSize: 10, fill: "hsl(220 10% 50%)" };
const TOOLTIP_STYLE = {
  contentStyle: {
    background: "hsl(220 15% 10%)",
    border: "1px solid hsl(220 15% 20%)",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "hsl(220 10% 60%)", marginBottom: 4 },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
// Recharts Tooltip formatter has a loose signature; we cast through `any`
// to keep our formatting functions concise.
type Fmt = (value: any, name: any) => [string, string];

const COLORS = {
  primary: "#10b981",    // emerald-500
  secondary: "#6366f1",  // indigo-500
  tertiary: "#f59e0b",   // amber-500
  muted: "#64748b",      // slate-500
  danger: "#ef4444",     // red-500
};

function fmtAxis(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

function fmtNum(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

// ── Consumer Charts ──────────────────────────────────────────

function ShopifyCharts({ name }: { name: string }) {
  const data = useMemo(() => shopifyTimeSeries(name), [name]);

  return (
    <>
      <ChartCard title="Revenue Trend" icon={DollarSign} subtitle="Shopify · 12 mo">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={fmtAxis} />
            <Tooltip {...TOOLTIP_STYLE} formatter={((v: number) => [fmtAxis(v), "Revenue"]) as Fmt} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={COLORS.primary}
              strokeWidth={2}
              fill="url(#revGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Orders & AOV" icon={ShoppingCart} subtitle="Shopify · 12 mo">
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={fmtNum} />
            <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={((v: number, n: string) => [n === "aov" ? `$${v}` : fmtNum(v), n === "aov" ? "AOV" : "Orders"]) as Fmt} />
            <Bar yAxisId="left" dataKey="orders" fill={COLORS.secondary} opacity={0.6} radius={[2, 2, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="aov" stroke={COLORS.tertiary} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
}

function AmazonCharts({ name }: { name: string }) {
  const data = useMemo(() => amazonTimeSeries(name), [name]);

  return (
    <>
      <ChartCard title="Units Sold" icon={BarChart3} subtitle="Amazon · 12 mo">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={fmtNum} />
            <Tooltip {...TOOLTIP_STYLE} formatter={((v: number) => [fmtNum(v), "Units"]) as Fmt} />
            <Bar dataKey="units" fill={COLORS.tertiary} opacity={0.75} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Ad Spend vs BSR" icon={Megaphone} subtitle="Amazon · 12 mo">
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={fmtAxis} />
            <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE} tickLine={false} axisLine={false} reversed tickFormatter={(v: number) => `#${v}`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={((v: number, n: string) => [n === "bsr" ? `#${v}` : fmtAxis(v), n === "bsr" ? "BSR" : "Ad Spend"]) as Fmt} />
            <Bar yAxisId="left" dataKey="adSpend" fill={COLORS.secondary} opacity={0.5} radius={[2, 2, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="bsr" stroke={COLORS.primary} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
}

function NetsuiteCharts({ name }: { name: string }) {
  const data = useMemo(() => netsuiteTimeSeries(name), [name]);

  return (
    <ChartCard title="Revenue & Gross Margin" icon={TrendingUp} subtitle="NetSuite · 12 mo">
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="nsRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.25} />
              <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="month" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={fmtAxis} />
          <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip {...TOOLTIP_STYLE} formatter={((v: number, n: string) => [n === "grossMargin" ? `${v}%` : fmtAxis(v), n === "grossMargin" ? "Gross Margin" : n === "cogs" ? "COGS" : "Revenue"]) as Fmt} />
          <Area yAxisId="left" type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2} fill="url(#nsRevGrad)" />
          <Bar yAxisId="left" dataKey="cogs" fill={COLORS.danger} opacity={0.35} radius={[2, 2, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="grossMargin" stroke={COLORS.tertiary} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function TripleWhaleCharts({ name }: { name: string }) {
  const data = useMemo(() => tripleWhaleTimeSeries(name), [name]);

  return (
    <ChartCard title="ROAS & CAC" icon={Activity} subtitle="Triple Whale · 12 mo">
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="month" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}x`} />
          <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} />
          <Tooltip {...TOOLTIP_STYLE} formatter={((v: number, n: string) => [n === "roas" ? `${v}x` : n === "cac" ? `$${v}` : fmtAxis(v), n === "roas" ? "ROAS" : n === "cac" ? "CAC" : "Ad Spend"]) as Fmt} />
          <Area yAxisId="left" type="monotone" dataKey="roas" stroke={COLORS.primary} strokeWidth={2} fill="none" />
          <Line yAxisId="right" type="monotone" dataKey="cac" stroke={COLORS.danger} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Technology Charts ────────────────────────────────────────

function StripeCharts({ name }: { name: string }) {
  const data = useMemo(() => stripeTimeSeries(name), [name]);

  return (
    <>
      <ChartCard title="MRR Growth" icon={DollarSign} subtitle="Stripe · 12 mo">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={fmtAxis} />
            <Tooltip {...TOOLTIP_STYLE} formatter={((v: number) => [fmtAxis(v), "MRR"]) as Fmt} />
            <Area
              type="monotone"
              dataKey="mrr"
              stroke={COLORS.primary}
              strokeWidth={2}
              fill="url(#mrrGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Customers & Churn" icon={Users} subtitle="Stripe · 12 mo">
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={fmtNum} />
            <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={((v: number, n: string) => [n === "churn" ? `${v}%` : fmtNum(v), n === "churn" ? "Churn Rate" : "Customers"]) as Fmt} />
            <Bar yAxisId="left" dataKey="customers" fill={COLORS.secondary} opacity={0.6} radius={[3, 3, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="churn" stroke={COLORS.danger} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
}

function HubSpotCharts({ name }: { name: string }) {
  const data = useMemo(() => hubspotTimeSeries(name), [name]);

  return (
    <>
      <ChartCard title="Pipeline Value" icon={DollarSign} subtitle="HubSpot · 12 mo">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="pipeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.secondary} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.secondary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={fmtAxis} />
            <Tooltip {...TOOLTIP_STYLE} formatter={((v: number) => [fmtAxis(v), "Pipeline Value"]) as Fmt} />
            <Area
              type="monotone"
              dataKey="pipelineValue"
              stroke={COLORS.secondary}
              strokeWidth={2}
              fill="url(#pipeGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Deals & Win Rate" icon={Target} subtitle="HubSpot · 12 mo">
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={((v: number, n: string) => [n === "winRate" ? `${v}%` : String(v), n === "winRate" ? "Win Rate" : "Deals"]) as Fmt} />
            <Bar yAxisId="left" dataKey="deals" fill={COLORS.tertiary} opacity={0.65} radius={[3, 3, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="winRate" stroke={COLORS.primary} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
}

// ── Main Export ───────────────────────────────────────────────

export function CompanyCharts({ companyName, isConsumer }: CompanyChartsProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Performance & Analytics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isConsumer ? (
          <>
            <ShopifyCharts name={companyName} />
            <AmazonCharts name={companyName} />
            <NetsuiteCharts name={companyName} />
            <TripleWhaleCharts name={companyName} />
          </>
        ) : (
          <>
            <StripeCharts name={companyName} />
            <HubSpotCharts name={companyName} />
          </>
        )}
      </div>
    </section>
  );
}
