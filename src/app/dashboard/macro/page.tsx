"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMacroIndicators, useMacroSeries } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

// Category metadata for icons and color logic
const CATEGORY_META: Record<string, { icon: React.ElementType; positiveIsGood: boolean }> = {
  rates: { icon: TrendingUp, positiveIsGood: false },
  inflation: { icon: DollarSign, positiveIsGood: false },
  growth: { icon: BarChart3, positiveIsGood: true },
  sentiment: { icon: Activity, positiveIsGood: true },
};

// Formatting helpers
function fmtValue(value: number, unit: string): string {
  if (unit === "%") return value.toFixed(1) + "%";
  if (unit === "index") return value.toFixed(1);
  if (unit === "$") {
    if (Math.abs(value) >= 1e12) return "$" + (value / 1e12).toFixed(2) + "T";
    if (Math.abs(value) >= 1e9) return "$" + (value / 1e9).toFixed(1) + "B";
    if (Math.abs(value) >= 1e6) return "$" + (value / 1e6).toFixed(1) + "M";
    return "$" + value.toLocaleString();
  }
  return value.toFixed(1) + (unit ? " " + unit : "");
}

function fmtChange(change: number): string {
  const sign = change > 0 ? "+" : "";
  return sign + change.toFixed(2);
}

// Skeleton loaders
function IndicatorCardSkeleton() {
  return (
    <Card className="glass-card">
      <CardContent className="p-5">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function MacroDashboardPage() {
  const { indicators, loading: indicatorsLoading } = useMacroIndicators();
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

  // Fetch selected series data (or null)
  const { series: selectedSeriesData, loading: seriesLoading } = useMacroSeries(selectedSeries);

  // Separate indicators into rows
  const topRow = ["FEDFUNDS", "DGS10", "CPIAUCSL", "UMCSENT"];
  const bottomRow = ["A191RL1Q225SBEA", "UNRATE", "SP500_PE", "PCE"];

  const topIndicators = topRow.map((id) => indicators.find((ind) => ind.series_id === id)).filter(Boolean);
  const bottomIndicators = bottomRow.map((id) => indicators.find((ind) => ind.series_id === id)).filter(Boolean);

  // If we have more indicators than expected, show them all
  const allTopIndicators = indicatorsLoading ? [] : (topIndicators.length > 0 ? topIndicators : indicators.slice(0, 4));
  const allBottomIndicators = indicatorsLoading ? [] : (bottomIndicators.length > 0 ? bottomIndicators : indicators.slice(4, 8));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Economic Indicators</h1>
        <p className="text-muted-foreground mt-1">
          Macro context for portfolio decisions
        </p>
      </div>

      {/* Top Row - Key Indicators */}
      {indicatorsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <IndicatorCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {allTopIndicators.map((indicator) => indicator && (
            <IndicatorCard
              key={indicator.series_id}
              indicator={indicator}
              isSelected={selectedSeries === indicator.series_id}
              onSelect={() =>
                setSelectedSeries(
                  selectedSeries === indicator.series_id ? null : indicator.series_id
                )
              }
            />
          ))}
        </div>
      )}

      {/* Second Row - More Indicators */}
      {indicatorsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <IndicatorCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {allBottomIndicators.map((indicator) => indicator && (
            <IndicatorCard
              key={indicator.series_id}
              indicator={indicator}
              isSelected={selectedSeries === indicator.series_id}
              onSelect={() =>
                setSelectedSeries(
                  selectedSeries === indicator.series_id ? null : indicator.series_id
                )
              }
            />
          ))}
        </div>
      )}

      {/* Selected Series Detail Chart */}
      {selectedSeries && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">
              {seriesLoading
                ? "Loading..."
                : selectedSeriesData?.name || selectedSeries}
              {selectedSeriesData?.unit && (
                <span className="text-muted-foreground font-normal ml-2 text-sm">
                  ({selectedSeriesData.unit})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {seriesLoading ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : selectedSeriesData?.observations?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={selectedSeriesData.observations}>
                  <defs>
                    <linearGradient id="selectedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={selectedSeriesData.name}
                    stroke="hsl(var(--primary))"
                    fill="url(#selectedGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interest Rates Chart */}
        <RatesChart indicators={indicators} />

        {/* Right: Inflation & Growth Chart */}
        <GrowthChart indicators={indicators} />
      </div>

      {/* Market Context Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Market Context</CardTitle>
        </CardHeader>
        <CardContent>
          <MarketContextSummary indicators={indicators} loading={indicatorsLoading} />
        </CardContent>
      </Card>
    </div>
  );
}

// --- Sub-components ---

interface IndicatorCardProps {
  indicator: {
    name: string;
    series_id: string;
    value: number;
    previous_value: number;
    change: number;
    unit: string;
    category: string;
    last_updated: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}

function IndicatorCard({ indicator, isSelected, onSelect }: IndicatorCardProps) {
  const meta = CATEGORY_META[indicator.category] || CATEGORY_META.growth;
  const Icon = meta.icon;
  const isPositive = indicator.change > 0;
  const isNeutral = indicator.change === 0;

  // Determine if this change is "good" or "bad"
  const isGoodChange = meta.positiveIsGood ? isPositive : !isPositive;
  const changeColorClass = isNeutral
    ? "text-muted-foreground"
    : isGoodChange
    ? "text-emerald-500"
    : "text-red-500";

  return (
    <Card
      className={cn(
        "glass-card cursor-pointer transition-all duration-200 hover:border-primary/50",
        isSelected && "border-primary ring-1 ring-primary/30"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {indicator.name}
          </span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold tracking-tight">
          {fmtValue(indicator.value, indicator.unit)}
        </div>
        <div className={cn("flex items-center gap-1 mt-1 text-sm", changeColorClass)}>
          {isNeutral ? (
            <Minus className="h-3.5 w-3.5" />
          ) : isPositive ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          <span>{fmtChange(indicator.change)}</span>
          <span className="text-muted-foreground text-xs ml-1">
            vs prior
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function RatesChart({ indicators }: { indicators: { series_id: string }[] }) {
  const hasFed = indicators.some((i) => i.series_id === "FEDFUNDS");
  const has10Y = indicators.some((i) => i.series_id === "DGS10");

  const { series: fedSeries } = useMacroSeries(hasFed ? "FEDFUNDS" : null);
  const { series: treasurySeries } = useMacroSeries(has10Y ? "DGS10" : null);

  // Merge the two series by date
  const mergedData = mergeSeriesData(
    fedSeries?.observations || [],
    treasurySeries?.observations || [],
    "Fed Funds",
    "10Y Treasury"
  );

  const hasData = mergedData.length > 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-base">Interest Rates (5Y)</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            {indicators.length === 0 ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : (
              "Rate data loading..."
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mergedData}>
              <defs>
                <linearGradient id="fedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="treasuryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => v.toFixed(1) + "%"}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="Fed Funds"
                stroke="#2563eb"
                fill="url(#fedGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="10Y Treasury"
                stroke="#16a34a"
                fill="url(#treasuryGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function GrowthChart({ indicators }: { indicators: { series_id: string }[] }) {
  const hasGDP = indicators.some((i) => i.series_id === "A191RL1Q225SBEA");
  const hasCPI = indicators.some((i) => i.series_id === "CPIAUCSL");

  const { series: gdpSeries } = useMacroSeries(hasGDP ? "A191RL1Q225SBEA" : null);
  const { series: cpiSeries } = useMacroSeries(hasCPI ? "CPIAUCSL" : null);

  const mergedData = mergeSeriesData(
    cpiSeries?.observations || [],
    gdpSeries?.observations || [],
    "CPI YoY",
    "GDP Growth"
  );

  const hasData = mergedData.length > 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-base">Inflation & Growth (5Y)</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            {indicators.length === 0 ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : (
              "Growth data loading..."
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => v.toFixed(1) + "%"}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="CPI YoY"
                stroke="#d97706"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="GDP Growth"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function MarketContextSummary({
  indicators,
  loading,
}: {
  indicators: { series_id: string; value: number; change: number; category: string; name: string }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (indicators.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Macro indicator data is not yet available. Once the backend macro endpoints are live,
        this section will provide a contextual summary of what current economic conditions
        mean for VMG&apos;s consumer and technology portfolio strategies.
      </p>
    );
  }

  // Build dynamic summary from indicators
  const fedFunds = indicators.find((i) => i.series_id === "FEDFUNDS");
  const cpi = indicators.find((i) => i.series_id === "CPIAUCSL");
  const gdp = indicators.find((i) => i.series_id === "A191RL1Q225SBEA");
  const confidence = indicators.find((i) => i.series_id === "UMCSENT");

  const bullets: string[] = [];

  if (fedFunds) {
    const direction = fedFunds.change > 0 ? "rising" : fedFunds.change < 0 ? "easing" : "stable";
    bullets.push(
      `The Fed Funds rate stands at ${fedFunds.value.toFixed(2)}%, ${direction} from prior readings. ` +
      `${direction === "easing" ? "Lower rates generally support higher valuations for growth-stage consumer and tech companies." : "Elevated rates continue to pressure valuations and increase the cost of capital for portfolio companies."}`
    );
  }

  if (cpi) {
    bullets.push(
      `CPI YoY inflation is at ${cpi.value.toFixed(1)}%. ` +
      `${cpi.value > 3 ? "Persistent inflation may compress consumer spending power, relevant for VMG Consumer portfolio brands." : "Moderating inflation is constructive for consumer purchasing power and brand growth."}`
    );
  }

  if (gdp) {
    bullets.push(
      `GDP growth is ${gdp.value.toFixed(1)}%. ` +
      `${gdp.value > 2 ? "Solid economic growth supports both consumer demand and B2B software spending." : "Sluggish growth warrants a more defensive portfolio positioning."}`
    );
  }

  if (confidence) {
    bullets.push(
      `Consumer confidence sits at ${confidence.value.toFixed(1)}, ` +
      `${confidence.change > 0 ? "trending upward" : "softening"} -- a key leading indicator for VMG's consumer brand portfolio.`
    );
  }

  return (
    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
      {bullets.map((bullet, i) => (
        <p key={i}>{bullet}</p>
      ))}
      {bullets.length === 0 && (
        <p>Economic data is available but no key indicators matched expected series IDs. Review the raw indicator data above for portfolio context.</p>
      )}
    </div>
  );
}

// --- Utility: merge two observation arrays by date ---

function mergeSeriesData(
  seriesA: { date: string; value: number }[],
  seriesB: { date: string; value: number }[],
  nameA: string,
  nameB: string
): Record<string, string | number>[] {
  const map = new Map<string, Record<string, string | number>>();

  for (const obs of seriesA) {
    const entry = map.get(obs.date) || { date: obs.date };
    entry[nameA] = obs.value;
    map.set(obs.date, entry);
  }

  for (const obs of seriesB) {
    const entry = map.get(obs.date) || { date: obs.date };
    entry[nameB] = obs.value;
    map.set(obs.date, entry);
  }

  return Array.from(map.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );
}
