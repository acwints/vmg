/**
 * Shared constants — sector mappings, deal stages, badge variants.
 *
 * Extracted from company-card.tsx, company-detail.tsx, pipeline-board.tsx,
 * and industry-strategy-page.tsx so every consumer uses a single source of truth.
 */

import type { Sector } from "@/types";

// ── Sector labels ──────────────────────────────────────────────────────────

/** Short labels used in cards / badges (company-card) */
export const SECTOR_LABELS_SHORT: Record<string, string> = {
  beauty: "Beauty",
  "food-bev": "Food & Bev",
  wellness: "Wellness",
  pet: "Pet",
  software: "Software",
  marketplace: "Marketplace",
};

/** Long labels used on detail pages (company-detail) */
export const SECTOR_LABELS_LONG: Record<string, string> = {
  beauty: "Beauty & Personal Care",
  "food-bev": "Food & Beverage",
  wellness: "Wellness & Fitness",
  pet: "Pet",
  software: "Software",
  marketplace: "Marketplace",
};

/** Industry-strategy page labels (include full "Food & Beverage") */
export const SECTOR_LABELS_STRATEGY: Record<Sector, string> = {
  beauty: "Beauty",
  "food-bev": "Food & Beverage",
  wellness: "Wellness",
  pet: "Pet",
  software: "Software",
  marketplace: "Marketplace",
};

// ── Sector badge variant mapping ───────────────────────────────────────────

export const SECTOR_BADGE_VARIANT: Record<
  string,
  "beauty" | "food-bev" | "wellness" | "pet" | "tech"
> = {
  beauty: "beauty",
  "food-bev": "food-bev",
  wellness: "wellness",
  pet: "pet",
  software: "tech",
  marketplace: "tech",
};
