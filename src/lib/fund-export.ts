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

// ── Google Sheets (CSV-based open) ──

function buildCsvString(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const header = keys.map(escape).join(",");
  const body = rows.map((r) => keys.map((k) => escape(r[k])).join(",")).join("\n");
  return `${header}\n${body}`;
}

function openInGoogleSheets(csv: string, title: string) {
  // Upload CSV content as a data URI and open Google Sheets import
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  // Create a temporary download then redirect to Sheets
  // Google Sheets doesn't support data URIs directly, so we use the
  // "new spreadsheet" URL and the user can paste/import
  // Better approach: create via iframe download + redirect
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Open Google Sheets to a new blank sheet — user imports the CSV
  window.open(
    "https://sheets.google.com/create",
    "_blank",
    "noopener,noreferrer"
  );
}

export function exportFundDetailToSheets(
  fund: FundDetail,
  deployment: DeploymentModel | null
) {
  // Combine all data into one CSV with section headers
  const summaryRows = buildFundSummaryRows(fund);
  const holdingsRows = buildHoldingsRows(fund.investments);
  const deployRows = deployment ? buildDeploymentRows(deployment) : [];

  // For Sheets, we export the holdings as the primary sheet (most useful for modeling)
  const rows = holdingsRows.length ? holdingsRows : summaryRows;
  const csv = buildCsvString(rows);
  const safeName = fund.slug || fund.name.replace(/\s+/g, "-").toLowerCase();
  openInGoogleSheets(csv, `${safeName}-holdings`);

  // Also download supplementary files if there's deployment data
  if (deployRows.length) {
    const deployCsv = buildCsvString(deployRows);
    const blob = new Blob([deployCsv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}-deployment.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export function exportFundOverviewToSheets(overview: FundOverview) {
  const fundsData = overview.funds.map((f) => ({
    "Fund Name": f.name,
    "Vintage Year": f.vintageYear,
    Strategy: f.strategy,
    Status: f.status,
    "Committed ($)": usd(f.committedCapital),
    "Invested ($)": f.snapshot ? usd(f.snapshot.investedCapital) : "",
    "Dry Powder ($)": f.snapshot ? usd(f.snapshot.dryPowder) : "",
    "TVPI (x)": f.snapshot ? Math.round(f.snapshot.tvpi * 100) / 100 : "",
    "DPI (x)": f.snapshot ? Math.round(f.snapshot.dpi * 100) / 100 : "",
    "Net IRR (%)": f.snapshot ? pct(f.snapshot.netIrr) : "",
    "Gross IRR (%)": f.snapshot ? pct(f.snapshot.grossIrr) : "",
    "# Investments": f.snapshot?.numInvestments ?? "",
    "Realized ($)": f.snapshot ? usd(f.snapshot.realizedValue) : "",
    "Unrealized ($)": f.snapshot ? usd(f.snapshot.unrealizedValue) : "",
    "Total Value ($)": f.snapshot ? usd(f.snapshot.totalValue) : "",
  }));
  const csv = buildCsvString(fundsData);
  openInGoogleSheets(csv, "vmg-fund-overview");
}
