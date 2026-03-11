"use client";

import { useState, useMemo } from "react";
import { SectionHeader } from "@/components/shared/section-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useFundOverview,
  usePortfolioConstruction,
  useFundReturns,
  useDeploymentModel,
} from "@/hooks/use-api";
import {
  Loader2,
  DollarSign,
  TrendingUp,
  Landmark,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import type { FundDetail, InvestmentRecord } from "@/types";

const CHART_COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#8b5cf6", "#0891b2", "#be185d", "#84cc16"];

function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return sign + "$" + (abs / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return sign + "$" + (abs / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return sign + "$" + (abs / 1e3).toFixed(0) + "K";
  return sign + "$" + abs.toFixed(0);
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "active":
      return "active" as const;
    case "harvesting":
      return "warning" as const;
    case "closed":
      return "secondary" as const;
    default:
      return "secondary" as const;
  }
}

// --- Tab Components ---

function OverviewTab() {
  const { overview, loading, error } = useFundOverview();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Failed to load fund data.</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total AUM"
          value={fmtUSD(overview.totalAum)}
          icon={Landmark}
        />
        <StatsCard
          title="Total Invested"
          value={fmtUSD(overview.totalInvested)}
          icon={DollarSign}
        />
        <StatsCard
          title="Dry Powder"
          value={fmtUSD(overview.totalDryPowder)}
          icon={Target}
        />
        <StatsCard
          title="Weighted TVPI"
          titleAttr="Total Value to Paid-In: total value / invested capital"
          value={overview.weightedTvpi.toFixed(2) + "x"}
          icon={TrendingUp}
        />
      </div>

      {/* Fund Cards */}
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
          Funds
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {overview.funds.map((fund) => (
            <FundCard key={fund.id} fund={fund} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FundCard({ fund }: { fund: FundDetail }) {
  const snap = fund.snapshot;
  return (
    <Card className="glass-card glass-card-hover">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-foreground">{fund.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">
                {fund.vintageYear}
              </Badge>
              <Badge variant={statusBadgeVariant(fund.status)} className="text-[10px] capitalize">
                {fund.status}
              </Badge>
            </div>
          </div>
          <span className="text-xs text-muted-foreground capitalize">{fund.strategy}</span>
        </div>

        {snap ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Committed</p>
              <p className="font-medium text-foreground">{fmtUSD(fund.committedCapital)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Invested</p>
              <p className="font-medium text-foreground">{fmtUSD(snap.investedCapital)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dry Powder</p>
              <p className="font-medium text-foreground">{fmtUSD(snap.dryPowder)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground" title="Total Value to Paid-In: total value / invested capital">TVPI</p>
              <p className="font-medium text-foreground">{snap.numInvestments === 0 ? "\u2014" : snap.tvpi.toFixed(2) + "x"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground" title="Internal Rate of Return: annualized return">Net IRR</p>
              <p className="font-medium text-foreground">{snap.numInvestments === 0 ? "\u2014" : fmtPct(snap.netIrr)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Investments</p>
              <p className="font-medium text-foreground">{snap.numInvestments}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No snapshot available</p>
        )}
      </CardContent>
    </Card>
  );
}

function DealEconomicsTab() {
  const { overview, loading, error } = useFundOverview();
  const [sortField, setSortField] = useState<"investedCapital" | "currentMoic" | "companyName">("investedCapital");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const allInvestments = useMemo(() => {
    if (!overview) return [];
    const investments: (InvestmentRecord & { fundName: string })[] = [];
    for (const fund of overview.funds) {
      for (const inv of fund.investments) {
        investments.push({ ...inv, fundName: fund.name });
      }
    }
    return investments;
  }, [overview]);

  const sorted = useMemo(() => {
    return [...allInvestments].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [allInvestments, sortField, sortDir]);

  function handleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Failed to load investment data.</p>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>No investments found.</p>
      </div>
    );
  }

  const SortIndicator = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ArrowUpRight className="inline h-3 w-3 ml-0.5" />
    ) : (
      <ArrowDownRight className="inline h-3 w-3 ml-0.5" />
    );
  };

  return (
    <Card className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
              <th
                className="px-4 py-3 text-left cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("companyName")}
              >
                Company <SortIndicator field="companyName" />
              </th>
              <th className="px-4 py-3 text-left">Fund</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("investedCapital")}
              >
                Invested <SortIndicator field="investedCapital" />
              </th>
              <th className="px-4 py-3 text-right">Entry Val</th>
              <th className="px-4 py-3 text-right">Own%</th>
              <th className="px-4 py-3 text-right">Current Val</th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("currentMoic")}
              >
                <span title="Multiple on Invested Capital">MOIC</span> <SortIndicator field="currentMoic" />
              </th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {sorted.map((inv) => (
              <tr key={inv.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{inv.companyName}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.fundName}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(inv.investmentDate)}</td>
                <td className="px-4 py-3 text-right font-medium">{fmtUSD(inv.investedCapital)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{fmtUSD(inv.entryValuation)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{fmtPct(inv.ownershipPct)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{fmtUSD(inv.currentValuation)}</td>
                <td className="px-4 py-3 text-right font-medium">
                  <span className={inv.currentMoic >= 1 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                    {inv.currentMoic.toFixed(2)}x
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={inv.isRealized ? "realized" : "active"} className="text-[10px]">
                    {inv.isRealized ? "Realized" : "Active"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PortfolioConstructionTab() {
  const { construction, loading, error } = usePortfolioConstruction();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !construction) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Failed to load portfolio construction data.</p>
      </div>
    );
  }

  const strategyData = construction.byStrategy.map((s, i) => ({
    ...s,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const sectorData = construction.bySector;
  const top10 = construction.concentration.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy Allocation Pie */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Strategy Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={strategyData}
                    dataKey="invested"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={55}
                    paddingAngle={2}
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {strategyData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => fmtUSD(Number(value))}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sector Breakdown */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Sector Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorData} layout="vertical" margin={{ left: 60, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={(v) => fmtUSD(v)} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={55} />
                  <Tooltip
                    formatter={(value) => fmtUSD(Number(value))}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="invested" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Concentration */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Top 10 Concentration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical" margin={{ left: 100, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => fmtPct(v)}
                  tick={{ fontSize: 11 }}
                  domain={[0, "auto"]}
                />
                <YAxis type="category" dataKey="company" tick={{ fontSize: 11 }} width={95} />
                <Tooltip
                  formatter={(value) => fmtPct(Number(value))}
                  labelFormatter={(label) => label}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="pctOfFund" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="% of Fund" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Reserve Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Reserved"
          value={fmtUSD(construction.reserveSummary.totalReserved)}
          icon={Target}
        />
        <StatsCard
          title="Total Deployed"
          value={fmtUSD(construction.reserveSummary.totalDeployed)}
          icon={DollarSign}
        />
        <StatsCard
          title="Adequacy Ratio"
          value={construction.reserveSummary.adequacyRatio.toFixed(2) + "x"}
          icon={BarChart3}
        />
      </div>
    </div>
  );
}

function ReturnsTab() {
  const { returns, loading, error } = useFundReturns();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !returns) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Failed to load returns data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Returns Table */}
      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left">Fund</th>
                <th className="px-4 py-3 text-center">Vintage</th>
                <th className="px-4 py-3 text-center">Strategy</th>
                <th className="px-4 py-3 text-right" title="Total Value to Paid-In: total value / invested capital">TVPI</th>
                <th className="px-4 py-3 text-right" title="Distributions to Paid-In: realized value / invested capital">DPI</th>
                <th className="px-4 py-3 text-right" title="Residual Value to Paid-In: unrealized value / invested capital">RVPI</th>
                <th className="px-4 py-3 text-right" title="Internal Rate of Return: annualized return">Gross IRR</th>
                <th className="px-4 py-3 text-right" title="Internal Rate of Return: annualized return">Net IRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {returns.funds.map((f) => (
                <tr key={f.fundSlug} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{f.fundName}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{f.vintageYear}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px] capitalize">{f.strategy}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{f.tvpi === 0 && f.netIrr === 0 ? "\u2014" : f.tvpi.toFixed(2) + "x"}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{f.tvpi === 0 && f.netIrr === 0 ? "\u2014" : f.dpi.toFixed(2) + "x"}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{f.tvpi === 0 && f.netIrr === 0 ? "\u2014" : f.rvpi.toFixed(2) + "x"}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {f.tvpi === 0 && f.netIrr === 0 ? "\u2014" : (
                      <span className={f.grossIrr >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                        {fmtPct(f.grossIrr)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {f.tvpi === 0 && f.netIrr === 0 ? "\u2014" : (
                      <span className={f.netIrr >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                        {fmtPct(f.netIrr)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MOIC Distribution */}
      {returns.moicDistribution.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground" title="Multiple on Invested Capital">
              MOIC Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={returns.moicDistribution} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Investments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DeploymentTab() {
  const { overview } = useFundOverview();
  const activeFunds = useMemo(() => {
    if (!overview) return [];
    return overview.funds.filter(f => f.status === "active");
  }, [overview]);

  const [selectedSlug, setSelectedSlug] = useState<string>("");

  // Set default selection when data loads
  const fundSlug = selectedSlug || (activeFunds.length > 0 ? activeFunds[0].slug : "");

  const { deployment, loading, error } = useDeploymentModel(fundSlug);

  if (!overview) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activeFunds.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>No active funds available for deployment modeling.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fund Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground">Select Fund:</label>
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          value={fundSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
        >
          {activeFunds.map(f => (
            <option key={f.slug} value={f.slug}>{f.name}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="text-center py-16 text-muted-foreground">
          <p>Failed to load deployment model.</p>
        </div>
      )}

      {deployment && (
        <>
          {/* Deployment Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Committed"
              value={fmtUSD(deployment.committed)}
              icon={Landmark}
            />
            <StatsCard
              title="Invested"
              value={fmtUSD(deployment.invested)}
              description={fmtPct(deployment.deploymentPct) + " deployed"}
              icon={DollarSign}
            />
            <StatsCard
              title="Reserved"
              value={fmtUSD(deployment.reserved)}
              icon={Target}
            />
            <StatsCard
              title="Dry Powder"
              value={fmtUSD(deployment.dryPowder)}
              description={deployment.monthsSinceClose + " months since close"}
              icon={BarChart3}
            />
          </div>

          {/* Projected Deployment Chart */}
          {deployment.projectedQuarters.length > 0 && (
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Projected Quarterly Deployment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={deployment.projectedQuarters} margin={{ bottom: 20, left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => fmtUSD(v)} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value, name) => [
                          fmtUSD(Number(value)),
                          name === "cumulative" ? "Cumulative" : "Quarterly",
                        ]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.1}
                        strokeWidth={2}
                        name="cumulative"
                      />
                      <Area
                        type="monotone"
                        dataKey="projectedDeploy"
                        stroke="#16a34a"
                        fill="#16a34a"
                        fillOpacity={0.1}
                        strokeWidth={2}
                        name="quarterly"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// --- Main Page ---

export default function FundModelPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Fund Model"
        description="Consolidated view of fund performance, portfolio construction, and deployment"
      />

      <div className="flex items-center gap-3 rounded-lg border border-amber-600/30 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
        <p className="text-xs text-amber-800 dark:text-amber-200/90">
          <span className="font-medium text-amber-700 dark:text-amber-400">Simulated data.</span>{" "}
          Fund economics, deal terms, and performance metrics shown here are illustrative mock data for platform demonstration purposes. They do not reflect actual VMG Partners fund performance or investment terms.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deals">Deal Economics</TabsTrigger>
          <TabsTrigger value="construction">Construction</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="deals" className="mt-6">
          <DealEconomicsTab />
        </TabsContent>

        <TabsContent value="construction" className="mt-6">
          <PortfolioConstructionTab />
        </TabsContent>

        <TabsContent value="returns" className="mt-6">
          <ReturnsTab />
        </TabsContent>

        <TabsContent value="deployment" className="mt-6">
          <DeploymentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
