import type { FundDetail } from "@/types";

function fundFamilyRank(name: string) {
  if (name.includes("VMG Partners")) return 0;
  if (name.includes("VMG Catalyst")) return 1;
  return 2;
}

export function sortFunds<T extends Pick<FundDetail, "name" | "vintageYear">>(funds: T[]) {
  return [...funds].sort((left, right) => {
    const familyDelta = fundFamilyRank(left.name) - fundFamilyRank(right.name);
    if (familyDelta !== 0) return familyDelta;

    const vintageDelta = left.vintageYear - right.vintageYear;
    if (vintageDelta !== 0) return vintageDelta;

    return left.name.localeCompare(right.name);
  });
}
