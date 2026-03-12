import * as XLSX from "xlsx";
import type {
  FundDetail,
  FundOverview,
  DeploymentModel,
  InvestmentRecord,
} from "@/types";

// ── Helpers ──

function pct(n: number) {
  return Math.round(n * 10000) / 10000; // keep as decimal for Excel % format
}

function usd(n: number) {
  return Math.round(n * 100) / 100;
}

function dateStr(v: string | null) {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toISOString().split("T")[0];
}

function applyColumnWidths(ws: XLSX.WorkSheet, data: Record<string, unknown>[]) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  ws["!cols"] = keys.map((k) => {
    const maxLen = Math.max(
      k.length,
      ...data.map((row) => String(row[k] ?? "").length)
    );
    return { wch: Math.min(maxLen + 2, 30) };
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Fund Detail Export (single fund with multiple sheets) ──

function buildHoldingsRows(investments: InvestmentRecord[]) {
  return investments.map((inv) => ({
    Company: inv.companyName,
    Sector: inv.companySector,
    "Round Type": inv.roundType,
    Status: inv.isRealized ? "Realized" : "Active",
    "Investment Date": dateStr(inv.investmentDate),
    "Invested Capital ($)": usd(inv.investedCapital),
    "Entry Valuation ($)": usd(inv.entryValuation),
    "Ownership (%)": pct(inv.ownershipPct),
    "Current Valuation ($)": usd(inv.currentValuation),
    "Current MOIC (x)": Math.round(inv.currentMoic * 100) / 100,
    "Reserved Capital ($)": usd(inv.reservedCapital),
    "Exit Date": dateStr(inv.exitDate),
    "Exit Proceeds ($)": inv.exitProceeds != null ? usd(inv.exitProceeds) : "",
    "Realized MOIC (x)": inv.realizedMoic != null ? Math.round(inv.realizedMoic * 100) / 100 : "",
    "Realized IRR (%)": inv.realizedIrr != null ? pct(inv.realizedIrr) : "",
  }));
}

function buildFundSummaryRows(fund: FundDetail) {
  const s = fund.snapshot;
  return [
    { Metric: "Fund Name", Value: fund.name },
    { Metric: "Vintage Year", Value: fund.vintageYear },
    { Metric: "Strategy", Value: fund.strategy },
    { Metric: "Status", Value: fund.status },
    { Metric: "Committed Capital ($)", Value: usd(fund.committedCapital) },
    { Metric: "Management Fee Rate", Value: fund.managementFeeRate },
    { Metric: "Carry Rate", Value: fund.carryRate },
    ...(s
      ? [
          { Metric: "Invested Capital ($)", Value: usd(s.investedCapital) },
          { Metric: "Realized Value ($)", Value: usd(s.realizedValue) },
          { Metric: "Unrealized Value ($)", Value: usd(s.unrealizedValue) },
          { Metric: "Total Value ($)", Value: usd(s.totalValue) },
          { Metric: "Dry Powder ($)", Value: usd(s.dryPowder) },
          { Metric: "Reserved Capital ($)", Value: usd(s.reservedCapital) },
          { Metric: "TVPI (x)", Value: Math.round(s.tvpi * 100) / 100 },
          { Metric: "DPI (x)", Value: Math.round(s.dpi * 100) / 100 },
          { Metric: "RVPI (x)", Value: Math.round(s.rvpi * 100) / 100 },
          { Metric: "Gross IRR (%)", Value: pct(s.grossIrr) },
          { Metric: "Net IRR (%)", Value: pct(s.netIrr) },
          { Metric: "# Investments", Value: s.numInvestments },
          { Metric: "# Realized", Value: s.numRealized },
        ]
      : []),
  ];
}

function buildDeploymentRows(deployment: DeploymentModel) {
  return [
    { Metric: "Committed ($)", Value: usd(deployment.committed) },
    { Metric: "Invested ($)", Value: usd(deployment.invested) },
    { Metric: "Reserved ($)", Value: usd(deployment.reserved) },
    { Metric: "Dry Powder ($)", Value: usd(deployment.dryPowder) },
    { Metric: "Deployment (%)", Value: pct(deployment.deploymentPct) },
    { Metric: "Months Since Close", Value: deployment.monthsSinceClose },
    { Metric: "", Value: "" },
    { Metric: "QUARTERLY PROJECTIONS", Value: "" },
    ...deployment.projectedQuarters.map((q) => ({
      Metric: q.quarter,
      Value: usd(q.projectedDeploy),
    })),
  ];
}

export function exportFundDetailToExcel(
  fund: FundDetail,
  deployment: DeploymentModel | null
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Fund Summary
  const summaryData = buildFundSummaryRows(fund);
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  applyColumnWidths(summaryWs, summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Fund Summary");

  // Sheet 2: Holdings
  const holdingsData = buildHoldingsRows(fund.investments);
  if (holdingsData.length) {
    const holdingsWs = XLSX.utils.json_to_sheet(holdingsData);
    applyColumnWidths(holdingsWs, holdingsData);
    XLSX.utils.book_append_sheet(wb, holdingsWs, "Holdings");
  }

  // Sheet 3: Deployment Model
  if (deployment) {
    const deployData = buildDeploymentRows(deployment);
    const deployWs = XLSX.utils.json_to_sheet(deployData);
    applyColumnWidths(deployWs, deployData);
    XLSX.utils.book_append_sheet(wb, deployWs, "Deployment Model");
  }

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const safeName = fund.slug || fund.name.replace(/\s+/g, "-").toLowerCase();
  downloadBlob(blob, `${safeName}-fund-model.xlsx`);
}

// ── Fund Overview Export (all funds in one workbook) ──

export function exportFundOverviewToExcel(overview: FundOverview) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Overview Summary
  const overviewData = [
    { Metric: "Total AUM ($)", Value: usd(overview.totalAum) },
    { Metric: "Total Invested ($)", Value: usd(overview.totalInvested) },
    { Metric: "Total Dry Powder ($)", Value: usd(overview.totalDryPowder) },
    { Metric: "Total Realized ($)", Value: usd(overview.totalRealized) },
    { Metric: "Total Unrealized ($)", Value: usd(overview.totalUnrealized) },
    { Metric: "Weighted TVPI (x)", Value: Math.round(overview.weightedTvpi * 100) / 100 },
    { Metric: "Weighted Net IRR (%)", Value: pct(overview.weightedNetIrr) },
  ];
  const overviewWs = XLSX.utils.json_to_sheet(overviewData);
  applyColumnWidths(overviewWs, overviewData);
  XLSX.utils.book_append_sheet(wb, overviewWs, "Portfolio Summary");

  // Sheet 2: All Funds
  const fundsData = overview.funds.map((f) => ({
    "Fund Name": f.name,
    "Vintage Year": f.vintageYear,
    Strategy: f.strategy,
    Status: f.status,
    "Committed ($)": usd(f.committedCapital),
    "Mgmt Fee Rate": f.managementFeeRate,
    "Carry Rate": f.carryRate,
    "Invested ($)": f.snapshot ? usd(f.snapshot.investedCapital) : "",
    "Dry Powder ($)": f.snapshot ? usd(f.snapshot.dryPowder) : "",
    "TVPI (x)": f.snapshot ? Math.round(f.snapshot.tvpi * 100) / 100 : "",
    "DPI (x)": f.snapshot ? Math.round(f.snapshot.dpi * 100) / 100 : "",
    "Net IRR (%)": f.snapshot ? pct(f.snapshot.netIrr) : "",
    "Gross IRR (%)": f.snapshot ? pct(f.snapshot.grossIrr) : "",
    "# Investments": f.snapshot?.numInvestments ?? "",
    "# Realized": f.snapshot?.numRealized ?? "",
    "Realized Value ($)": f.snapshot ? usd(f.snapshot.realizedValue) : "",
    "Unrealized Value ($)": f.snapshot ? usd(f.snapshot.unrealizedValue) : "",
    "Total Value ($)": f.snapshot ? usd(f.snapshot.totalValue) : "",
  }));
  const fundsWs = XLSX.utils.json_to_sheet(fundsData);
  applyColumnWidths(fundsWs, fundsData);
  XLSX.utils.book_append_sheet(wb, fundsWs, "Funds");

  // Sheet 3: All Holdings (across all funds)
  const allHoldings = overview.funds.flatMap((f) =>
    f.investments.map((inv) => ({
      Fund: f.name,
      ...buildHoldingsRows([inv])[0],
    }))
  );
  if (allHoldings.length) {
    const holdingsWs = XLSX.utils.json_to_sheet(allHoldings);
    applyColumnWidths(holdingsWs, allHoldings);
    XLSX.utils.book_append_sheet(wb, holdingsWs, "All Holdings");
  }

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, "vmg-fund-overview.xlsx");
}

// ── Google Sheets API ──

interface SheetPayload {
  title: string;
  headers: string[];
  rows: (string | number | boolean | null)[][];
}

function rowsToSheetData(
  rows: Record<string, unknown>[]
): { headers: string[]; values: (string | number | null)[][] } {
  if (!rows.length) return { headers: [], values: [] };
  const headers = Object.keys(rows[0]);
  const values = rows.map((r) =>
    headers.map((k) => {
      const v = r[k];
      if (v === "" || v === undefined || v === null) return null;
      if (typeof v === "number") return v;
      return String(v);
    })
  );
  return { headers, values };
}

export interface SheetsExportResult {
  url?: string;
  needsScope?: boolean;
  error?: string;
}

async function createGoogleSheet(
  title: string,
  sheets: SheetPayload[]
): Promise<SheetsExportResult> {
  const res = await fetch("/api/google/sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, sheets }),
  });

  const data = await res.json();

  if (res.status === 403 && data.error === "needs_scope") {
    return { needsScope: true };
  }

  if (!res.ok) {
    return { error: data.error || "Failed to create spreadsheet" };
  }

  return { url: data.spreadsheetUrl };
}

export async function exportFundDetailToSheets(
  fund: FundDetail,
  deployment: DeploymentModel | null
): Promise<SheetsExportResult> {
  const sheets: SheetPayload[] = [];

  // Sheet 1: Fund Summary
  const summaryData = rowsToSheetData(buildFundSummaryRows(fund));
  sheets.push({
    title: "Fund Summary",
    headers: summaryData.headers,
    rows: summaryData.values,
  });

  // Sheet 2: Holdings
  const holdingsData = rowsToSheetData(buildHoldingsRows(fund.investments));
  if (holdingsData.headers.length) {
    sheets.push({
      title: "Holdings",
      headers: holdingsData.headers,
      rows: holdingsData.values,
    });
  }

  // Sheet 3: Deployment Model
  if (deployment) {
    const deployData = rowsToSheetData(buildDeploymentRows(deployment));
    sheets.push({
      title: "Deployment Model",
      headers: deployData.headers,
      rows: deployData.values,
    });
  }

  const safeName = fund.name || fund.slug;
  const result = await createGoogleSheet(`${safeName} — Fund Model`, sheets);

  if (result.url) {
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return result;
}

export async function exportFundOverviewToSheets(
  overview: FundOverview
): Promise<SheetsExportResult> {
  const sheets: SheetPayload[] = [];

  // Sheet 1: Portfolio Summary
  const overviewRows = [
    { Metric: "Total AUM ($)", Value: usd(overview.totalAum) },
    { Metric: "Total Invested ($)", Value: usd(overview.totalInvested) },
    { Metric: "Total Dry Powder ($)", Value: usd(overview.totalDryPowder) },
    { Metric: "Total Realized ($)", Value: usd(overview.totalRealized) },
    { Metric: "Total Unrealized ($)", Value: usd(overview.totalUnrealized) },
    { Metric: "Weighted TVPI (x)", Value: Math.round(overview.weightedTvpi * 100) / 100 },
    { Metric: "Weighted Net IRR (%)", Value: pct(overview.weightedNetIrr) },
  ];
  const summaryData = rowsToSheetData(overviewRows);
  sheets.push({
    title: "Portfolio Summary",
    headers: summaryData.headers,
    rows: summaryData.values,
  });

  // Sheet 2: All Funds
  const fundsRows = overview.funds.map((f) => ({
    "Fund Name": f.name,
    "Vintage Year": f.vintageYear,
    Strategy: f.strategy,
    Status: f.status,
    "Committed ($)": usd(f.committedCapital),
    "Mgmt Fee Rate": f.managementFeeRate,
    "Carry Rate": f.carryRate,
    "Invested ($)": f.snapshot ? usd(f.snapshot.investedCapital) : "",
    "Dry Powder ($)": f.snapshot ? usd(f.snapshot.dryPowder) : "",
    "TVPI (x)": f.snapshot ? Math.round(f.snapshot.tvpi * 100) / 100 : "",
    "DPI (x)": f.snapshot ? Math.round(f.snapshot.dpi * 100) / 100 : "",
    "Net IRR (%)": f.snapshot ? pct(f.snapshot.netIrr) : "",
    "Gross IRR (%)": f.snapshot ? pct(f.snapshot.grossIrr) : "",
    "# Investments": f.snapshot?.numInvestments ?? "",
    "# Realized": f.snapshot?.numRealized ?? "",
    "Total Value ($)": f.snapshot ? usd(f.snapshot.totalValue) : "",
  }));
  const fundsData = rowsToSheetData(fundsRows);
  sheets.push({
    title: "Funds",
    headers: fundsData.headers,
    rows: fundsData.values,
  });

  // Sheet 3: All Holdings
  const allHoldings = overview.funds.flatMap((f) =>
    f.investments.map((inv) => ({
      Fund: f.name,
      ...buildHoldingsRows([inv])[0],
    }))
  );
  if (allHoldings.length) {
    const holdingsData = rowsToSheetData(allHoldings);
    sheets.push({
      title: "All Holdings",
      headers: holdingsData.headers,
      rows: holdingsData.values,
    });
  }

  const result = await createGoogleSheet("VMG Fund Overview", sheets);

  if (result.url) {
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return result;
}
