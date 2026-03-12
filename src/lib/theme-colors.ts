/**
 * Shared color tokens for sectors, platforms, priorities, and funding rounds.
 *
 * Tailwind class strings — consumed by pipeline-board, company-detail,
 * and funding-timeline components.
 */

import type { ElementType } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Filter,
  Search,
  Target,
  XCircle,
} from "lucide-react";
import type { DealStage } from "@/types";

// ── Sector colors (pipeline-board) ─────────────────────────────────────────

export const SECTOR_COLORS: Record<string, string> = {
  beauty: "text-pink-600 dark:text-pink-400 bg-pink-500/10",
  "food-bev": "text-orange-600 dark:text-orange-400 bg-orange-500/10",
  wellness: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  pet: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  software: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
  marketplace: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
};

// ── Priority config (pipeline-board) ───────────────────────────────────────

export const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  high: { color: "text-red-600 dark:text-red-400", label: "High" },
  medium: { color: "text-amber-600 dark:text-amber-400", label: "Med" },
  low: { color: "text-muted-foreground", label: "Low" },
};

// ── Deal-stage definitions (pipeline-board) ────────────────────────────────

export const DEAL_STAGES: {
  id: DealStage;
  label: string;
  color: string;
  icon: ElementType;
}[] = [
  { id: "screening", label: "Screening", color: "bg-slate-500", icon: Search },
  { id: "diligence", label: "Diligence", color: "bg-blue-500", icon: Filter },
  { id: "ic_review", label: "IC Review", color: "bg-amber-500", icon: Target },
  { id: "term_sheet", label: "Term Sheet", color: "bg-violet-500", icon: ArrowRight },
  { id: "closed", label: "Closed", color: "bg-emerald-500", icon: CheckCircle2 },
  { id: "passed", label: "Passed", color: "bg-red-400", icon: XCircle },
];

// ── Platform brand colors (company-detail social section) ──────────────────

export const PLATFORM_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  LinkedIn: { bg: "bg-[#0A66C2]/10", text: "text-[#0A66C2]", icon: "text-[#0A66C2]" },
  X: { bg: "bg-foreground/5", text: "text-foreground", icon: "text-foreground" },
  Instagram: { bg: "bg-[#E4405F]/10", text: "text-[#E4405F]", icon: "text-[#E4405F]" },
  TikTok: { bg: "bg-[#00F2EA]/10", text: "text-[#00897B]", icon: "text-[#00897B]" },
};

// ── Funding round colors (funding-timeline) ────────────────────────────────

export const ROUND_COLORS: Record<string, string> = {
  "Seed": "bg-emerald-500",
  "Series A": "bg-blue-500",
  "Series B": "bg-violet-500",
  "Series C": "bg-amber-500",
  "Series D": "bg-rose-500",
  "Series E": "bg-pink-500",
  "Growth": "bg-indigo-500",
  "Strategic": "bg-cyan-500",
};
