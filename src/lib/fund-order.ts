import type { FundDetail, FundStatus } from "@/types";

function fundStatusRank(status: FundStatus) {
  if (status === "active") return 0;
  if (status === "harvesting") return 1;
  return 2;
}

function fundFamilyRank(name: string) {
  if (name.includes("VMG Partners")) return 0;
  if (name.includes("VMG Catalyst")) return 1;
  return 2;
}

export function sortFunds<T extends Pick<FundDetail, "name" | "vintageYear" | "status">>(funds: T[]) {
  return [...funds].sort((left, right) => {
    const statusDelta = fundStatusRank(left.status) - fundStatusRank(right.status);
    if (statusDelta !== 0) return statusDelta;

    const familyDelta = fundFamilyRank(left.name) - fundFamilyRank(right.name);
    if (familyDelta !== 0) return familyDelta;

    const vintageDelta = left.vintageYear - right.vintageYear;
    if (vintageDelta !== 0) return vintageDelta;

    return left.name.localeCompare(right.name);
  });
}
