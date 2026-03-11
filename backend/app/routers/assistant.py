from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from datetime import datetime
from app.database import get_db
from app.models import Company, Fund, Investment, FundSnapshot, FundingRound

router = APIRouter()


@router.get("/context")
async def get_assistant_context(db: Session = Depends(get_db)):
    """Build a comprehensive data context string for the AI assistant."""

    # ── Portfolio Summary ──
    total_companies = db.query(Company).count()
    active_companies = db.query(Company).filter(Company.status == "active").count()
    realized_companies = total_companies - active_companies

    sector_counts = (
        db.query(Company.sector, sqlfunc.count(Company.id))
        .group_by(Company.sector)
        .all()
    )
    sector_breakdown = {str(sector): count for sector, count in sector_counts}

    portfolio_counts = (
        db.query(Company.portfolio, sqlfunc.count(Company.id))
        .group_by(Company.portfolio)
        .all()
    )
    portfolio_breakdown = {str(portfolio): count for portfolio, count in portfolio_counts}

    portfolio_summary = (
        f"Total portfolio companies: {total_companies} "
        f"({active_companies} active, {realized_companies} realized). "
        f"By portfolio: {', '.join(f'{k}: {v}' for k, v in portfolio_breakdown.items())}. "
        f"By sector: {', '.join(f'{k}: {v}' for k, v in sector_breakdown.items())}."
    )

    # ── Fund Performance ──
    funds = db.query(Fund).all()
    fund_lines = []
    for fund in funds:
        # Get latest snapshot for each fund
        latest_snapshot = (
            db.query(FundSnapshot)
            .filter(FundSnapshot.fund_id == fund.id)
            .order_by(FundSnapshot.as_of_date.desc())
            .first()
        )

        total_invested = (
            db.query(sqlfunc.sum(Investment.invested_capital))
            .filter(Investment.fund_id == fund.id)
            .scalar()
        ) or 0.0

        num_investments = (
            db.query(Investment).filter(Investment.fund_id == fund.id).count()
        )

        if latest_snapshot:
            fund_lines.append(
                f"{fund.name} ({fund.vintage_year}, {fund.strategy.value if fund.strategy else 'N/A'}): "
                f"Committed ${fund.committed_capital:,.0f}, "
                f"Invested ${latest_snapshot.invested_capital:,.0f}, "
                f"Dry Powder ${latest_snapshot.dry_powder:,.0f}, "
                f"TVPI {latest_snapshot.tvpi:.2f}x, "
                f"Gross IRR {latest_snapshot.gross_irr:.1f}%, "
                f"Net IRR {latest_snapshot.net_irr:.1f}%, "
                f"DPI {latest_snapshot.dpi:.2f}x, "
                f"{latest_snapshot.num_investments} investments "
                f"({latest_snapshot.num_realized} realized). "
                f"Status: {fund.status.value if fund.status else 'N/A'}."
            )
        else:
            fund_lines.append(
                f"{fund.name} ({fund.vintage_year}, {fund.strategy.value if fund.strategy else 'N/A'}): "
                f"Committed ${fund.committed_capital:,.0f}, "
                f"Invested ${total_invested:,.0f}, "
                f"{num_investments} investments. "
                f"Status: {fund.status.value if fund.status else 'N/A'}. "
                f"No snapshot data available."
            )

    fund_performance = " | ".join(fund_lines) if fund_lines else "No fund data available."

    # ── Macro Context (from fallback values) ──
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

    macro_context = "Key economic indicators (early 2026): " + "; ".join(macro_lines) + "."

    # ── Funding Data ──
    recent_rounds = (
        db.query(FundingRound)
        .join(Company, FundingRound.company_id == Company.id)
        .order_by(FundingRound.date.desc())
        .limit(20)
        .all()
    )

    if recent_rounds:
        funding_lines = []
        for r in recent_rounds:
            company_name = r.company.name if r.company else "Unknown"
            amount_str = f"${r.amount:,.0f}" if r.amount else "undisclosed"
            date_str = r.date.strftime("%Y-%m-%d") if r.date else "N/A"
            lead = r.lead_investor or "undisclosed lead"
            funding_lines.append(
                f"{company_name} - {r.round_name}: {amount_str} "
                f"(led by {lead}, {date_str})"
            )
        funding_data = "Recent funding rounds: " + "; ".join(funding_lines) + "."
    else:
        funding_data = "No funding round data available for portfolio companies."

    # ── Top Holdings by Current Valuation ──
    top_investments = (
        db.query(Investment, Company.name)
        .join(Company, Investment.company_id == Company.id)
        .filter(Investment.is_realized == False)  # noqa: E712
        .order_by(Investment.current_valuation.desc())
        .limit(10)
        .all()
    )

    if top_investments:
        holdings_lines = []
        for inv, company_name in top_investments:
            holdings_lines.append(
                f"{company_name}: invested ${inv.invested_capital:,.0f}, "
                f"current val ${inv.current_valuation:,.0f}, "
                f"MOIC {inv.current_moic:.2f}x"
            )
        top_holdings = "Top unrealized holdings: " + "; ".join(holdings_lines) + "."
    else:
        top_holdings = "No active investment holdings data available."

    return {
        "portfolio_summary": portfolio_summary,
        "fund_performance": fund_performance,
        "macro_context": macro_context,
        "funding_data": funding_data,
        "top_holdings": top_holdings,
        "timestamp": datetime.utcnow().isoformat(),
    }
