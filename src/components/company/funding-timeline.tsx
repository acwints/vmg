"use client";

import { useFundingRounds } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, TrendingUp, Users, Database } from "lucide-react";

function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const roundColors: Record<string, string> = {
  "Seed": "bg-emerald-500",
  "Series A": "bg-blue-500",
  "Series B": "bg-violet-500",
  "Series C": "bg-amber-500",
  "Series D": "bg-rose-500",
  "Series E": "bg-pink-500",
  "Growth": "bg-indigo-500",
  "Strategic": "bg-cyan-500",
};

interface FundingTimelineProps {
  companyId: string;
}

export function FundingTimeline({ companyId }: FundingTimelineProps) {
  const { rounds, loading, error } = useFundingRounds(companyId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || rounds.length === 0) {
    return null;
  }

  const totalRaised = rounds.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Funding History
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Database className="h-3 w-3" />
          <span>{rounds.length} rounds</span>
          <span className="mx-1 text-border">·</span>
          <span className="font-semibold text-foreground">{fmtUSD(totalRaised)} total</span>
        </div>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            {rounds.map((round, idx) => {
              const dotColor = roundColors[round.roundName] || "bg-gray-400";
              const isLast = idx === rounds.length - 1;
              const isVMG = round.leadInvestor?.includes("VMG") || round.investors?.includes("VMG");
              const investorList = round.investors?.split(",").map(s => s.trim()).filter(Boolean) || [];

              return (
                <div key={round.id} className="relative flex gap-4 px-5">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center pt-5">
                    <div className={`h-3 w-3 rounded-full ${dotColor} ring-4 ring-card shrink-0 z-10`} />
                    {!isLast && (
                      <div className="w-px flex-1 bg-border/50 -mb-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-5 pt-3 ${!isLast ? "border-b border-border/30" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {round.roundName}
                          </span>
                          {isVMG && (
                            <Badge variant="active" className="text-[10px] px-1.5 py-0">
                              VMG Led
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {fmtDate(round.date)}
                          </span>
                        </div>

                        {/* Lead investor */}
                        {round.leadInvestor && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Users className="h-3 w-3 text-muted-foreground/70" />
                            <span className="text-xs text-muted-foreground">
                              Led by <span className="text-foreground font-medium">{round.leadInvestor}</span>
                            </span>
                          </div>
                        )}

                        {/* Other investors */}
                        {investorList.length > 1 && (
                          <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-1">
                            {investorList.filter(i => i !== round.leadInvestor).join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Amount + valuation */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <DollarSign className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-bold text-foreground">
                            {fmtUSD(round.amount)}
                          </span>
                        </div>
                        {round.preMoneyValuation && (
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            <TrendingUp className="h-2.5 w-2.5 text-muted-foreground/70" />
                            <span className="text-[11px] text-muted-foreground">
                              {fmtUSD(round.preMoneyValuation)} pre
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground/60 text-center">
        Data sourced from internal records and Crunchbase
      </p>
    </section>
  );
}
