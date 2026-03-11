"use client";

import { useState, useMemo } from "react";
import { usePipelineDeals } from "@/hooks/use-api";
import { updateDealStage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  User,
  GripVertical,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Kanban,
  ArrowRight,
  Target,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { PipelineDeal, DealStage } from "@/types";

const STAGES: { id: DealStage; label: string; color: string; icon: React.ElementType }[] = [
  { id: "screening", label: "Screening", color: "bg-slate-500", icon: Search },
  { id: "diligence", label: "Diligence", color: "bg-blue-500", icon: Filter },
  { id: "ic_review", label: "IC Review", color: "bg-amber-500", icon: Target },
  { id: "term_sheet", label: "Term Sheet", color: "bg-violet-500", icon: ArrowRight },
  { id: "closed", label: "Closed", color: "bg-emerald-500", icon: CheckCircle2 },
  { id: "passed", label: "Passed", color: "bg-red-400", icon: XCircle },
];

function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "1d ago";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

const sectorColors: Record<string, string> = {
  beauty: "text-pink-600 dark:text-pink-400 bg-pink-500/10",
  "food-bev": "text-orange-600 dark:text-orange-400 bg-orange-500/10",
  wellness: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  pet: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  software: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
  marketplace: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  high: { color: "text-red-600 dark:text-red-400", label: "High" },
  medium: { color: "text-amber-600 dark:text-amber-400", label: "Med" },
  low: { color: "text-muted-foreground", label: "Low" },
};

function DealCard({ deal, onMoveStage }: { deal: PipelineDeal; onMoveStage: (dealId: string, stage: DealStage) => void }) {
  const [expanded, setExpanded] = useState(false);
  const sectorStyle = sectorColors[deal.sector] || "text-muted-foreground bg-muted/30";
  const priority = priorityConfig[deal.priority] || priorityConfig.medium;
  const currentStageIdx = STAGES.findIndex(s => s.id === deal.stage);

  return (
    <Card
      className="glass-card cursor-pointer hover:border-border transition-all duration-200 group"
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h4 className="text-sm font-semibold text-foreground truncate">
                {deal.companyName}
              </h4>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sectorStyle}`}>
                {deal.sector.replace("-", " & ")}
              </span>
              <span className={`text-[10px] font-medium ${priority.color}`}>
                {priority.label}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-0.5">
              <DollarSign className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-foreground">{fmtUSD(deal.dealSize)}</span>
            </div>
            {expanded ? (
              <ChevronUp className="h-3 w-3 text-muted-foreground mt-1 ml-auto" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground mt-1 ml-auto" />
            )}
          </div>
        </div>

        {/* Summary line */}
        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
          {deal.description}
        </p>

        {/* Metrics row */}
        <div className="flex items-center gap-3 mt-2.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-2.5 w-2.5" />
            {deal.growthRate}% YoY
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-2.5 w-2.5" />
            {fmtUSD(deal.revenue)} rev
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="h-2.5 w-2.5" />
            {timeAgo(deal.lastActivity)}
          </span>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2.5 animate-fade-in">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted-foreground">Valuation</span>
                <p className="font-semibold text-foreground">{fmtUSD(deal.valuation)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Source</span>
                <p className="font-medium text-foreground">{deal.source}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Lead</span>
                <div className="flex items-center gap-1">
                  <User className="h-2.5 w-2.5 text-muted-foreground" />
                  <p className="font-medium text-foreground">{deal.leadContact}</p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Strategy</span>
                <p className="font-medium text-foreground capitalize">{deal.strategy}</p>
              </div>
            </div>

            {deal.notes && (
              <div className="text-[11px]">
                <span className="text-muted-foreground">Notes</span>
                <p className="text-foreground/90 mt-0.5 leading-relaxed">{deal.notes}</p>
              </div>
            )}

            {/* Stage movement buttons */}
            {deal.stage !== "closed" && deal.stage !== "passed" && (
              <div className="flex items-center gap-1.5 pt-1">
                {currentStageIdx > 0 && STAGES[currentStageIdx - 1].id !== "passed" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveStage(deal.id, STAGES[currentStageIdx - 1].id); }}
                    className="text-[10px] px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    ← {STAGES[currentStageIdx - 1].label}
                  </button>
                )}
                {currentStageIdx < STAGES.length - 2 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveStage(deal.id, STAGES[currentStageIdx + 1].id); }}
                    className="text-[10px] px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    {STAGES[currentStageIdx + 1].label} →
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveStage(deal.id, "passed"); }}
                  className="text-[10px] px-2 py-1 rounded border border-red-500/30 text-red-500/80 hover:text-red-500 hover:bg-red-500/10 transition-colors ml-auto"
                >
                  Pass
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PipelinePage() {
  const { deals, loading, error } = usePipelineDeals();
  const [filterStrategy, setFilterStrategy] = useState<string>("all");
  const [localDeals, setLocalDeals] = useState<PipelineDeal[] | null>(null);

  const activeDealsList = localDeals || deals;

  const filteredDeals = useMemo(() => {
    if (filterStrategy === "all") return activeDealsList;
    return activeDealsList.filter(d => d.strategy === filterStrategy);
  }, [activeDealsList, filterStrategy]);

  const handleMoveStage = async (dealId: string, newStage: DealStage) => {
    // Optimistic update
    const updated = activeDealsList.map(d =>
      d.id === dealId ? { ...d, stage: newStage, lastActivity: new Date().toISOString() } : d
    );
    setLocalDeals(updated);

    try {
      await updateDealStage(dealId, newStage);
    } catch {
      // Revert on failure
      setLocalDeals(null);
    }
  };

  // Summary stats
  const activeStages: DealStage[] = ["screening", "diligence", "ic_review", "term_sheet"];
  const activePipelineDeals = filteredDeals.filter(d => activeStages.includes(d.stage));
  const totalPipelineValue = activePipelineDeals.reduce((s, d) => s + (d.dealSize || 0), 0);
  const avgDealSize = activePipelineDeals.length > 0 ? totalPipelineValue / activePipelineDeals.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load pipeline data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Kanban className="h-6 w-6" />
            Deal Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track prospective investments from sourcing through close
          </p>
        </div>

        {/* Strategy filter */}
        <div className="flex items-center gap-2">
          {["all", "consumer", "technology"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStrategy(s)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                filterStrategy === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-3 rounded-lg border border-amber-600/30 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
        <p className="text-xs text-amber-800 dark:text-amber-200/90">
          <span className="font-medium text-amber-700 dark:text-amber-400">Simulated data.</span>{" "}
          Pipeline deals shown are illustrative. In production, this connects to your CRM and deal tracking system.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Active Deals</p>
            <p className="text-2xl font-bold text-foreground mt-1">{activePipelineDeals.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Pipeline Value</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmtUSD(totalPipelineValue)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Avg Deal Size</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmtUSD(avgDealSize)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">In Term Sheet</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {filteredDeals.filter(d => d.stage === "term_sheet").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="opacity-30" />

      {/* Kanban Board */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex gap-4 min-w-max pb-4">
          {STAGES.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
            const stageValue = stageDeals.reduce((s, d) => s + (d.dealSize || 0), 0);
            const StageIcon = stage.icon;

            return (
              <div key={stage.id} className="w-[300px] shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      {stage.label}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {stageDeals.length}
                    </Badge>
                  </div>
                  {stageValue > 0 && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {fmtUSD(stageValue)}
                    </span>
                  )}
                </div>

                {/* Cards */}
                <div className="space-y-2.5 min-h-[200px] rounded-lg bg-muted/20 border border-border/30 p-2.5">
                  {stageDeals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground/50">
                      <StageIcon className="h-5 w-5 mb-2" />
                      <span className="text-xs">No deals</span>
                    </div>
                  ) : (
                    stageDeals.map(deal => (
                      <DealCard key={deal.id} deal={deal} onMoveStage={handleMoveStage} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
