"use client";

import { useMemo, useState } from "react";
import { usePipelineDeals } from "@/hooks/use-api";
import { updateDealStage } from "@/lib/api";
import { fmtUSD } from "@/lib/formatters";
import { DEAL_STAGES, SECTOR_COLORS, PRIORITY_CONFIG } from "@/lib/theme-colors";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  GripVertical,
  Loader2,
  TrendingUp,
  User,
} from "lucide-react";
import type { DealStage, PipelineDeal } from "@/types";

const STAGES = DEAL_STAGES;
const sectorColors = SECTOR_COLORS;
const priorityConfig = PRIORITY_CONFIG;

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "1d ago";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

function DealCard({
  deal,
  onMoveStage,
}: {
  deal: PipelineDeal;
  onMoveStage: (dealId: string, stage: DealStage) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sectorStyle = sectorColors[deal.sector] || "text-muted-foreground bg-muted/30";
  const priority = priorityConfig[deal.priority] || priorityConfig.medium;
  const currentStageIdx = STAGES.findIndex((stage) => stage.id === deal.stage);

  return (
    <Card
      className="glass-card cursor-pointer hover:border-border transition-all duration-200 group"
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-3.5">
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

        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
          {deal.description}
        </p>

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

            {deal.stage !== "closed" && deal.stage !== "passed" && (
              <div className="flex items-center gap-1.5 pt-1">
                {currentStageIdx > 0 && STAGES[currentStageIdx - 1].id !== "passed" && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onMoveStage(deal.id, STAGES[currentStageIdx - 1].id);
                    }}
                    className="text-[10px] px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    ← {STAGES[currentStageIdx - 1].label}
                  </button>
                )}
                {currentStageIdx < STAGES.length - 2 && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onMoveStage(deal.id, STAGES[currentStageIdx + 1].id);
                    }}
                    className="text-[10px] px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    {STAGES[currentStageIdx + 1].label} →
                  </button>
                )}
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onMoveStage(deal.id, "passed");
                  }}
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

export function PipelineBoard({
  strategy,
}: {
  strategy: "consumer" | "technology";
}) {
  const { deals, loading, error } = usePipelineDeals();
  const [localDeals, setLocalDeals] = useState<PipelineDeal[] | null>(null);
  const activeDealsList = localDeals || deals;

  const filteredDeals = useMemo(
    () => activeDealsList.filter((deal) => deal.strategy === strategy),
    [activeDealsList, strategy]
  );

  const activeStages: DealStage[] = ["screening", "diligence", "ic_review", "term_sheet"];
  const activePipelineDeals = filteredDeals.filter((deal) => activeStages.includes(deal.stage));
  const totalPipelineValue = activePipelineDeals.reduce(
    (sum, deal) => sum + (deal.dealSize || 0),
    0
  );
  const avgDealSize =
    activePipelineDeals.length > 0 ? totalPipelineValue / activePipelineDeals.length : 0;

  const handleMoveStage = async (dealId: string, newStage: DealStage) => {
    const updated = activeDealsList.map((deal) =>
      deal.id === dealId
        ? { ...deal, stage: newStage, lastActivity: new Date().toISOString() }
        : deal
    );
    setLocalDeals(updated);

    try {
      await updateDealStage(dealId, newStage);
    } catch {
      setLocalDeals(null);
    }
  };

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
      <SectionHeader
        title={`${strategy === "consumer" ? "Consumer" : "Technology"} Pipeline`}
        description="Detailed board view from sourcing through close"
      />

      <div className="flex items-center gap-3 rounded-lg border border-amber-600/30 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
        <p className="text-xs text-amber-800 dark:text-amber-200/90">
          <span className="font-medium text-amber-700 dark:text-amber-400">
            Closed won deals carry the memo objects.
          </span>{" "}
          The board remains the operating source of truth for stage changes and sourcing flow.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Active Deals</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {activePipelineDeals.length}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Pipeline Value
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {fmtUSD(totalPipelineValue)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Avg Deal Size
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmtUSD(avgDealSize)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              In Term Sheet
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {filteredDeals.filter((deal) => deal.stage === "term_sheet").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="opacity-30" />

      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex gap-4 min-w-max pb-4">
          {STAGES.map((stage) => {
            const stageDeals = filteredDeals.filter((deal) => deal.stage === stage.id);
            const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.dealSize || 0), 0);
            const StageIcon = stage.icon;

            return (
              <div key={stage.id} className="w-[280px] sm:w-[300px] shrink-0">
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

                <div className="space-y-2.5 min-h-[200px] rounded-lg bg-muted/20 border border-border/30 p-2.5">
                  {stageDeals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground/50">
                      <StageIcon className="h-5 w-5 mb-2" />
                      <span className="text-xs">No deals</span>
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
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
