from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from datetime import datetime
from app.database import get_db
from app.models import Company, Fund, Investment, FundSnapshot, FundingRound
from app.reference_date import REFERENCE_DATE, REFERENCE_DATE_LABEL, REFERENCE_DAY

router = APIRouter()


@router.get("/context")
async def get_assistant_context(db: Session = Depends(get_db)):
    """Build a comprehensive data context string for the AI assistant."""

    # ── Portfolio Summary ──
    companies = db.query(Company).all()
    total_companies = len(companies)
    active_companies = sum(1 for c in companies if c.status.value == "active")
    realized_companies = total_companies - active_companies

    # Sector breakdown with status detail
    sector_detail: dict[str, dict] = {}
    for c in companies:
        sector = c.sector.value if c.sector else "unknown"
        portfolio = c.portfolio.value if c.portfolio else "unknown"
        key = f"{portfolio}/{sector}"
        if key not in sector_detail:
            sector_detail[key] = {"active": 0, "realized": 0, "companies": []}
        status = c.status.value if c.status else "unknown"
        if status == "active":
            sector_detail[key]["active"] += 1
        else:
            sector_detail[key]["realized"] += 1
        sector_detail[key]["companies"].append(c.name)

    sector_lines = []
    for key, info in sorted(sector_detail.items()):
        sector_lines.append(
            f"  {key}: {info['active']} active, {info['realized']} realized — "
            f"{', '.join(info['companies'])}"
        )

    # Category breakdown (sub-sectors)
    category_detail: dict[str, list[str]] = {}
    for c in companies:
        cat = c.category or "Uncategorized"
        if cat not in category_detail:
            category_detail[cat] = []
        status_label = "active" if c.status.value == "active" else "realized"
        category_detail[cat].append(f"{c.name} ({status_label})")

    category_lines = []
    for cat, cos in sorted(category_detail.items(), key=lambda x: -len(x[1])):
        category_lines.append(f"  {cat} ({len(cos)}): {', '.join(cos)}")

    portfolio_summary = (
        f"PORTFOLIO OVERVIEW (as of {REFERENCE_DATE_LABEL}):\n"
        f"Total: {total_companies} companies ({active_companies} active, {realized_companies} realized)\n\n"
        f"BY SECTOR AND PORTFOLIO:\n" + "\n".join(sector_lines) + "\n\n"
        f"BY CATEGORY (sub-sector):\n" + "\n".join(category_lines)
    )

    # ── Company Details (all companies with key data) ──
    company_lines = []
    for c in companies:
        parts = [c.name]
        parts.append(f"portfolio={c.portfolio.value}" if c.portfolio else "")
        parts.append(f"sector={c.sector.value}" if c.sector else "")
        parts.append(f"status={c.status.value}" if c.status else "")
        if c.category:
            parts.append(f"category={c.category}")
        if c.founded_year:
            parts.append(f"founded={c.founded_year}")
        if c.investment_year:
            parts.append(f"invested={c.investment_year}")
        if c.exit_year:
            parts.append(f"exited={c.exit_year}")
        if c.acquirer:
            parts.append(f"acquirer={c.acquirer}")
        if c.description:
            parts.append(f"desc='{c.description[:100]}'")
        company_lines.append(" | ".join(p for p in parts if p))

    company_data = "COMPANY DETAIL:\n" + "\n".join(company_lines)

    # ── Fund Performance ──
    funds = db.query(Fund).all()
    fund_lines = []
    for fund in funds:
        latest_snapshot = (
            db.query(FundSnapshot)
            .filter(FundSnapshot.fund_id == fund.id)
            .order_by(FundSnapshot.as_of_date.desc())
            .first()
        )

        if latest_snapshot:
            deployed_pct = (
                latest_snapshot.invested_capital / fund.committed_capital * 100
                if fund.committed_capital > 0
                else 0
            )
            fund_lines.append(
                f"{fund.name} (vintage {fund.vintage_year}, {fund.strategy.value}, {fund.status.value}):\n"
                f"  Committed: ${fund.committed_capital:,.0f}\n"
                f"  Invested: ${latest_snapshot.invested_capital:,.0f} ({deployed_pct:.0f}% deployed)\n"
                f"  Dry Powder: ${latest_snapshot.dry_powder:,.0f}\n"
                f"  Reserved: ${latest_snapshot.reserved_capital:,.0f}\n"
                f"  TVPI: {latest_snapshot.tvpi:.2f}x, DPI: {latest_snapshot.dpi:.2f}x, RVPI: {latest_snapshot.rvpi:.2f}x\n"
                f"  Gross IRR: {latest_snapshot.gross_irr*100:.1f}%, Net IRR: {latest_snapshot.net_irr*100:.1f}%\n"
                f"  Investments: {latest_snapshot.num_investments} ({latest_snapshot.num_realized} realized)"
            )
        else:
            fund_lines.append(
                f"{fund.name} (vintage {fund.vintage_year}, {fund.strategy.value}, {fund.status.value}):\n"
                f"  Committed: ${fund.committed_capital:,.0f}\n"
                f"  No snapshot data."
            )

    fund_performance = "FUND PERFORMANCE:\n" + "\n\n".join(fund_lines) if fund_lines else "No fund data."

    # ── Macro Context ──
    from app.routers.macro import FALLBACK_VALUES, INDICATORS

    macro_lines = []
    for ind in INDICATORS:
        sid = ind["series_id"]
        fb = FALLBACK_VALUES.get(sid, {})
        value = fb.get("value", "N/A")
        prev = fb.get("previous_value", "N/A")
        if isinstance(value, (int, float)) and isinstance(prev, (int, float)):
            change = round(value - prev, 2)
            direction = "up" if change > 0 else "down" if change < 0 else "flat"
            macro_lines.append(
                f"{ind['name']}: {value}{ind['unit']} ({direction} {abs(change)} from prior)"
            )
        else:
            macro_lines.append(f"{ind['name']}: {value}{ind['unit']}")

    macro_context = (
        f"MACRO ENVIRONMENT (as of {REFERENCE_DATE_LABEL}):\n"
        + "\n".join(f"  {l}" for l in macro_lines)
    )

    # ── Funding Data ──
    recent_rounds = (
        db.query(FundingRound)
        .join(Company, FundingRound.company_id == Company.id)
        .filter(FundingRound.date <= REFERENCE_DAY)
        .order_by(FundingRound.date.desc())
        .limit(30)
        .all()
    )

    if recent_rounds:
        funding_lines = []
        for r in recent_rounds:
            company_name = r.company.name if r.company else "Unknown"
            amount_str = f"${r.amount:,.0f}" if r.amount else "undisclosed"
            date_str = r.date.strftime("%Y-%m-%d") if r.date else "N/A"
            lead = r.lead_investor or "undisclosed"
            funding_lines.append(
                f"  {company_name} — {r.round_name}: {amount_str} (led by {lead}, {date_str})"
            )
        funding_data = "RECENT FUNDING ROUNDS:\n" + "\n".join(funding_lines)
    else:
        funding_data = "No funding round data available."

    # ── Top Holdings ──
    top_investments = (
        db.query(Investment, Company.name, Company.sector, Company.category)
        .join(Company, Investment.company_id == Company.id)
        .filter(Investment.is_realized == False)  # noqa: E712
        .order_by(Investment.current_valuation.desc())
        .limit(15)
        .all()
    )

    if top_investments:
        holdings_lines = []
        for inv, company_name, sector, category in top_investments:
            holdings_lines.append(
                f"  {company_name} ({category or sector}): "
                f"invested ${inv.invested_capital:,.0f}, "
                f"current val ${inv.current_valuation:,.0f}, "
                f"MOIC {inv.current_moic:.2f}x, "
                f"ownership {inv.ownership_pct*100:.1f}%"
            )
        top_holdings = "TOP UNREALIZED HOLDINGS (by valuation):\n" + "\n".join(holdings_lines)
    else:
        top_holdings = "No active investment holdings."

    # ── Realized Exits ──
    realized_investments = (
        db.query(Investment, Company.name, Company.acquirer, Company.exit_year)
        .join(Company, Investment.company_id == Company.id)
        .filter(Investment.is_realized == True)  # noqa: E712
        .order_by(Investment.exit_proceeds.desc().nullslast())
        .limit(20)
        .all()
    )

    if realized_investments:
        exit_lines = []
        for inv, company_name, acquirer, exit_year in realized_investments:
            proceeds = f"${inv.exit_proceeds:,.0f}" if inv.exit_proceeds else "N/A"
            moic = f"{inv.realized_moic:.2f}x" if inv.realized_moic else "N/A"
            irr = f"{inv.realized_irr*100:.1f}%" if inv.realized_irr else "N/A"
            acq = f"→ {acquirer}" if acquirer else ""
            exit_lines.append(
                f"  {company_name} {acq} ({exit_year or 'N/A'}): "
                f"invested ${inv.invested_capital:,.0f}, proceeds {proceeds}, "
                f"MOIC {moic}, IRR {irr}"
            )
        exit_data = "REALIZED EXITS:\n" + "\n".join(exit_lines)
    else:
        exit_data = "No realized investment data."

    return {
        "portfolio_summary": portfolio_summary,
        "company_data": company_data,
        "fund_performance": fund_performance,
        "macro_context": macro_context,
        "funding_data": funding_data,
        "top_holdings": top_holdings,
        "exit_data": exit_data,
        "timestamp": REFERENCE_DATE.isoformat(),
    }
