export const REFERENCE_DATE_ISO = "2026-03-11T12:00:00Z";
export const REFERENCE_DATE = new Date(REFERENCE_DATE_ISO);

export function isOnOrBeforeReferenceDate(value: string | null | undefined) {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed <= REFERENCE_DATE;
}

export function isWithinReferenceWindow(
  value: string | null | undefined,
  lookbackDays: number
) {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const windowStart = new Date(REFERENCE_DATE);
  windowStart.setUTCDate(windowStart.getUTCDate() - lookbackDays);
  return parsed >= windowStart && parsed <= REFERENCE_DATE;
}
