from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime
from app.database import get_db
from app.models import Fund, Investment, FundSnapshot, Company
from app import schemas
from app.reference_date import REFERENCE_DATE

router = APIRouter()


def build_investment_response(inv):
    """Build an InvestmentResponse from an Investment ORM object (with company loaded)."""
    return schemas.InvestmentResponse(
        id=inv.id, fund_id=inv.fund_id, company_id=inv.company_id,
        company_name=inv.company.name, company_slug=inv.company.slug,
        company_sector=inv.company.sector.value,
        investment_date=inv.investment_date, round_type=inv.round_type,
        invested_capital=inv.invested_capital, entry_valuation=inv.entry_valuation,
        ownership_pct=inv.ownership_pct, current_valuation=inv.current_valuation,
        current_moic=inv.current_moic, is_realized=inv.is_realized,
        exit_date=inv.exit_date, exit_proceeds=inv.exit_proceeds,
        realized_moic=inv.realized_moic, realized_irr=inv.realized_irr,
        reserved_capital=inv.reserved_capital,
        created_at=inv.created_at, updated_at=inv.updated_at,
    )


def build_snapshot_response(snap):
    """Build a FundSnapshotResponse from a FundSnapshot ORM object."""
    return schemas.FundSnapshotResponse(
        fund_id=snap.fund_id, as_of_date=snap.as_of_date,
        invested_capital=snap.invested_capital, realized_value=snap.realized_value,
        unrealized_value=snap.unrealized_value, total_value=snap.total_value,
        dry_powder=snap.dry_powder, reserved_capital=snap.reserved_capital,
        tvpi=snap.tvpi, dpi=snap.dpi, rvpi=snap.rvpi,
        gross_irr=snap.gross_irr, net_irr=snap.net_irr,
        num_investments=snap.num_investments, num_realized=snap.num_realized,
    )


def build_fund_detail(fund, snapshot, investments):
    """Build a FundDetailResponse from Fund, optional FundSnapshot, and Investment list."""
    snapshot_resp = build_snapshot_response(snapshot) if snapshot else None
    inv_responses = [build_investment_response(inv) for inv in investments]
    return schemas.FundDetailResponse(
        id=fund.id, name=fund.name, slug=fund.slug, strategy=fund.strategy.value,
        vintage_year=fund.vintage_year, committed_capital=fund.committed_capital,
        management_fee_rate=fund.management_fee_rate, carry_rate=fund.carry_rate,
        status=fund.status.value, created_at=fund.created_at, updated_at=fund.updated_at,
        snapshot=snapshot_resp, investments=inv_responses,
    )


@router.get("/overview", response_model=schemas.FundOverviewResponse)
def get_fund_overview(db: Session = Depends(get_db)):
    funds = db.query(Fund).options(
        joinedload(Fund.snapshots),
        joinedload(Fund.investments).joinedload(Investment.company)
    ).all()

    fund_details = []
    total_invested = 0.0
    total_dry_powder = 0.0
    total_realized = 0.0
    total_unrealized = 0.0
    weighted_tvpi_num = 0.0
    weighted_irr_num = 0.0
    total_aum = 0.0

    for f in funds:
        snap = f.snapshots[0] if f.snapshots else None

        fund_details.append(build_fund_detail(f, snap, f.investments))

        if snap:
            total_invested += snap.invested_capital
            total_dry_powder += snap.dry_powder
            total_realized += snap.realized_value
            total_unrealized += snap.unrealized_value
            weighted_tvpi_num += snap.tvpi * snap.invested_capital
            weighted_irr_num += snap.net_irr * snap.invested_capital

        total_aum += f.committed_capital

    weighted_tvpi = weighted_tvpi_num / total_invested if total_invested > 0 else 0
    weighted_irr = weighted_irr_num / total_invested if total_invested > 0 else 0

    return schemas.FundOverviewResponse(
        funds=fund_details, total_aum=total_aum, total_invested=total_invested,
        total_dry_powder=total_dry_powder, total_realized=total_realized,
        total_unrealized=total_unrealized, weighted_tvpi=weighted_tvpi,
        weighted_net_irr=weighted_irr,
    )


@router.get("/funds/{slug}", response_model=schemas.FundDetailResponse)
def get_fund_detail(slug: str, db: Session = Depends(get_db)):
    fund = db.query(Fund).options(
        joinedload(Fund.snapshots),
        joinedload(Fund.investments).joinedload(Investment.company)
    ).filter(Fund.slug == slug).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    snap = fund.snapshots[0] if fund.snapshots else None
    return build_fund_detail(fund, snap, fund.investments)


@router.get("/investments", response_model=list[schemas.InvestmentResponse])
def get_investments(fund_slug: str = None, realized: bool = None, db: Session = Depends(get_db)):
    q = db.query(Investment).options(joinedload(Investment.company), joinedload(Investment.fund))
    if fund_slug:
        q = q.join(Fund).filter(Fund.slug == fund_slug)
    if realized is not None:
        q = q.filter(Investment.is_realized == realized)
    investments = q.all()
    return [build_investment_response(inv) for inv in investments]


@router.get("/construction", response_model=schemas.PortfolioConstructionResponse)
def get_portfolio_construction(db: Session = Depends(get_db)):
    investments = db.query(Investment).options(
        joinedload(Investment.company), joinedload(Investment.fund)
    ).all()

    total_invested = sum(i.invested_capital for i in investments)

    # By strategy
    strategy_map = {}
    for inv in investments:
        s = inv.fund.strategy.value
        if s not in strategy_map:
            strategy_map[s] = {"invested": 0, "count": 0}
        strategy_map[s]["invested"] += inv.invested_capital
        strategy_map[s]["count"] += 1
    by_strategy = [
        schemas.ConstructionItem(label=k, invested=v["invested"], pct=v["invested"]/total_invested*100 if total_invested else 0, count=v["count"])
        for k, v in strategy_map.items()
    ]

    # By sector
    sector_map = {}
    for inv in investments:
        s = inv.company.sector.value
        if s not in sector_map:
            sector_map[s] = {"invested": 0, "count": 0}
        sector_map[s]["invested"] += inv.invested_capital
        sector_map[s]["count"] += 1
    by_sector = [
        schemas.ConstructionItem(label=k, invested=v["invested"], pct=v["invested"]/total_invested*100 if total_invested else 0, count=v["count"])
        for k, v in sorted(sector_map.items(), key=lambda x: -x[1]["invested"])
    ]

    # By vintage
    vintage_map = {}
    for inv in investments:
        y = str(inv.investment_date.year)
        if y not in vintage_map:
            vintage_map[y] = {"invested": 0, "count": 0}
        vintage_map[y]["invested"] += inv.invested_capital
        vintage_map[y]["count"] += 1
    by_vintage = [
        schemas.ConstructionItem(label=k, invested=v["invested"], pct=v["invested"]/total_invested*100 if total_invested else 0, count=v["count"])
        for k, v in sorted(vintage_map.items())
    ]

    # Top 10 concentration
    company_invested = {}
    for inv in investments:
        cn = inv.company.name
        company_invested[cn] = company_invested.get(cn, 0) + inv.invested_capital
    top10 = sorted(company_invested.items(), key=lambda x: -x[1])[:10]
    concentration = [
        schemas.ConcentrationItem(company=name, invested=amt, pct_of_fund=amt/total_invested*100 if total_invested else 0)
        for name, amt in top10
    ]

    # Reserve summary
    total_reserved = sum(i.reserved_capital for i in investments)
    total_deployed = sum(i.invested_capital for i in investments if i.reserved_capital > 0)
    reserve_summary = schemas.ReserveSummary(
        total_reserved=total_reserved,
        total_deployed=total_deployed,
        adequacy_ratio=total_reserved / total_invested if total_invested else 0,
    )

    return schemas.PortfolioConstructionResponse(
        by_strategy=by_strategy, by_sector=by_sector, by_vintage=by_vintage,
        concentration=concentration, reserve_summary=reserve_summary,
    )


@router.get("/deployment/{fund_slug}", response_model=schemas.DeploymentModelResponse)
def get_deployment_model(fund_slug: str, db: Session = Depends(get_db)):
    fund = db.query(Fund).options(joinedload(Fund.snapshots)).filter(Fund.slug == fund_slug).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    snap = fund.snapshots[0] if fund.snapshots else None
    invested = snap.invested_capital if snap else 0
    reserved = snap.reserved_capital if snap else 0
    dry_powder = snap.dry_powder if snap else fund.committed_capital

    now = REFERENCE_DATE
    fund_close = datetime(fund.vintage_year, 6, 1)
    months_since = max(1, (now.year - fund_close.year) * 12 + (now.month - fund_close.month))
    deployment_pct = invested / fund.committed_capital * 100 if fund.committed_capital else 0

    # Project 8 quarters of deployment
    quarterly_pace = invested / max(1, months_since / 3)
    remaining = dry_powder
    projected = []
    cumulative = invested
    for q in range(8):
        quarter_label = f"Q{((now.month - 1) // 3 + q) % 4 + 1} {now.year + (((now.month - 1) // 3 + q) // 4)}"
        deploy = min(remaining, quarterly_pace * (0.9 ** q))  # gradually slow
        cumulative += deploy
        remaining -= deploy
        projected.append(schemas.DeploymentQuarter(
            quarter=quarter_label, projected_deploy=round(deploy, 0), cumulative=round(cumulative, 0),
        ))

    return schemas.DeploymentModelResponse(
        fund_id=str(fund.id), fund_name=fund.name,
        committed=fund.committed_capital, invested=invested,
        reserved=reserved, dry_powder=dry_powder,
        months_since_close=months_since, deployment_pct=round(deployment_pct, 1),
        projected_quarters=projected,
    )


@router.get("/returns", response_model=schemas.FundReturnsResponse)
def get_fund_returns(db: Session = Depends(get_db)):
    funds = db.query(Fund).options(joinedload(Fund.snapshots)).all()
    investments = db.query(Investment).all()

    fund_rows = []
    for f in funds:
        snap = f.snapshots[0] if f.snapshots else None
        if snap:
            fund_rows.append(schemas.FundReturnRow(
                fund_name=f.name, fund_slug=f.slug, vintage_year=f.vintage_year,
                strategy=f.strategy.value, tvpi=snap.tvpi, dpi=snap.dpi, rvpi=snap.rvpi,
                gross_irr=snap.gross_irr, net_irr=snap.net_irr,
            ))

    # MOIC distribution
    moics = [inv.current_moic if not inv.is_realized else (inv.realized_moic or inv.current_moic) for inv in investments]
    buckets = [
        ("< 1.0x", sum(1 for m in moics if m < 1.0)),
        ("1.0-2.0x", sum(1 for m in moics if 1.0 <= m < 2.0)),
        ("2.0-3.0x", sum(1 for m in moics if 2.0 <= m < 3.0)),
        ("3.0-5.0x", sum(1 for m in moics if 3.0 <= m < 5.0)),
        ("5.0x+", sum(1 for m in moics if m >= 5.0)),
    ]
    moic_dist = [schemas.MoicBucket(label=label, count=count) for label, count in buckets]

    return schemas.FundReturnsResponse(funds=fund_rows, moic_distribution=moic_dist)
