/**
 * Shared formatting utilities.
 *
 * Consolidates fmtUSD, fmtPct, fmtDate (and their variants) that were
 * previously duplicated across many component files.
 */

/**
 * Format a number as a compact USD string.
 *
 * Handles negative numbers via Math.abs for threshold checks.
 * Decimals follow the most common pattern found in the codebase:
 *   >= 1 B  ->  $X.XB   (1 decimal)
 *   >= 1 M  ->  $XM     (0 decimals)
 *   >= 1 K  ->  $XK     (0 decimals)
 *   < 1 K   ->  $X      (0 decimals)
 */
export function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

/**
 * Format a number as a compact USD string with extra decimal precision.
 *
 * Used by fund-detail-page for values >= 1 B (2 decimals) and >= 1 M (1 decimal).
 */
export function fmtUSDPrecise(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

/**
 * Format a decimal ratio as a percentage string, e.g. 0.185 -> "18.5%".
 */
export function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/**
 * Format an ISO date string to a short human-readable form.
 *
 * @param value  ISO date string
 * @returns e.g. "Mar 11, 2026"
 */
export function fmtDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format an ISO date string to month + year only.
 *
 * @param value  ISO date string, or null (returns "Ongoing")
 * @returns e.g. "Mar 2026" or "Ongoing"
 */
export function fmtDateShort(value: string | null): string {
  if (!value) return "Ongoing";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}
