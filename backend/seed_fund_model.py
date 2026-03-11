"""
Seed script to populate Fund, Investment, and FundSnapshot tables with realistic mock data.

Usage:
    python seed_fund_model.py

Requires DATABASE_URL environment variable (or uses default from app.config).
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models import (
    Company, Fund, Investment, FundSnapshot,
    Portfolio, FundStrategy, FundStatus, CompanyStatus,
)


# ---------------------------------------------------------------------------
# Deterministic hash helpers (matches frontend mock-metrics.ts)
# ---------------------------------------------------------------------------

def hash_str(s, salt=0):
    h = 0
    s = s + str(salt)
    for c in s:
        h = ((h << 5) - h + ord(c)) & 0xFFFFFFFF
    return h


def in_range(name, salt, min_val, max_val):
    return min_val + (hash_str(name, salt) % (max_val - min_val + 1))


def in_range_float(name, salt, min_val, max_val, precision=100):
    """Return a deterministic float in [min_val, max_val]."""
    raw = hash_str(name, salt) % (precision + 1)
    return min_val + (max_val - min_val) * raw / precision


# ---------------------------------------------------------------------------
# Fund definitions
# ---------------------------------------------------------------------------

FUNDS = [
    {
        "name": "VMG Partners I",
        "slug": "vmg-i",
        "strategy": FundStrategy.consumer,
        "vintage_year": 2007,
        "committed_capital": 175_000_000,
        "status": FundStatus.closed,
    },
    {
        "name": "VMG Partners II",
        "slug": "vmg-ii",
        "strategy": FundStrategy.consumer,
        "vintage_year": 2010,
        "committed_capital": 375_000_000,
        "status": FundStatus.closed,
    },
    {
        "name": "VMG Partners III",
        "slug": "vmg-iii",
        "strategy": FundStrategy.consumer,
        "vintage_year": 2014,
        "committed_capital": 550_000_000,
        "status": FundStatus.closed,
    },
    {
        "name": "VMG Partners IV",
        "slug": "vmg-iv",
        "strategy": FundStrategy.consumer,
        "vintage_year": 2017,
        "committed_capital": 700_000_000,
        "status": FundStatus.harvesting,
    },
    {
        "name": "VMG Partners V",
        "slug": "vmg-v",
        "strategy": FundStrategy.consumer,
        "vintage_year": 2021,
        "committed_capital": 850_000_000,
        "status": FundStatus.active,
    },
    {
        "name": "VMG Partners VI",
        "slug": "vmg-vi",
        "strategy": FundStrategy.consumer,
        "vintage_year": 2025,
        "committed_capital": 1_000_000_000,
        "status": FundStatus.active,
    },
    {
        "name": "VMG Catalyst I",
        "slug": "catalyst-i",
        "strategy": FundStrategy.technology,
        "vintage_year": 2019,
        "committed_capital": 250_000_000,
        "status": FundStatus.harvesting,
    },
    {
        "name": "VMG Catalyst II",
        "slug": "catalyst-ii",
        "strategy": FundStrategy.technology,
        "vintage_year": 2022,
        "committed_capital": 400_000_000,
        "status": FundStatus.active,
    },
]


# ---------------------------------------------------------------------------
# Fund assignment logic
# ---------------------------------------------------------------------------

# slug -> Fund ORM object (populated at runtime)
FUND_BY_SLUG = {}

CONSUMER_FUND_RANGES = [
    (2009, "vmg-i"),
    (2013, "vmg-ii"),
    (2016, "vmg-iii"),
    (2020, "vmg-iv"),
    (2024, "vmg-v"),
    (9999, "vmg-vi"),
]

TECH_FUND_RANGES = [
    (2021, "catalyst-i"),
    (9999, "catalyst-ii"),
]

# For realized companies with no investment_year, distribute across older funds
CONSUMER_REALIZED_FUNDS = ["vmg-i", "vmg-ii", "vmg-iii", "vmg-iv"]
TECH_REALIZED_FUNDS = ["catalyst-i"]


def assign_fund(portfolio: Portfolio, investment_year, company_name: str = "", is_realized: bool = False):
    """Pick the right fund slug for a company given portfolio and investment_year."""
    if portfolio == Portfolio.consumer:
        ranges = CONSUMER_FUND_RANGES
        default_slug = "vmg-v"
        # Realized companies with no year get distributed across older funds
        if investment_year is None and is_realized:
            idx = hash_str(company_name, 99) % len(CONSUMER_REALIZED_FUNDS)
            return FUND_BY_SLUG[CONSUMER_REALIZED_FUNDS[idx]]
    else:
        ranges = TECH_FUND_RANGES
        default_slug = "catalyst-ii"
        if investment_year is None and is_realized:
            idx = hash_str(company_name, 99) % len(TECH_REALIZED_FUNDS)
            return FUND_BY_SLUG[TECH_REALIZED_FUNDS[idx]]

    if investment_year is None:
        return FUND_BY_SLUG[default_slug]

    for max_year, slug in ranges:
        if investment_year <= max_year:
            return FUND_BY_SLUG[slug]

    return FUND_BY_SLUG[default_slug]


# ---------------------------------------------------------------------------
# Seed logic
# ---------------------------------------------------------------------------

ROUND_TYPES = ["Series A", "Series B", "Series C", "Growth Equity", "Late Stage"]


def seed():
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    funds_created = 0
    funds_skipped = 0
    investments_created = 0
    snapshots_created = 0

    try:
        # ── 1. Create Funds ──
        for fdata in FUNDS:
            existing = db.query(Fund).filter(Fund.slug == fdata["slug"]).first()
            if existing:
                FUND_BY_SLUG[fdata["slug"]] = existing
                funds_skipped += 1
                continue

            fund = Fund(
                management_fee_rate=0.02,
                carry_rate=0.20,
                **fdata,
            )
            db.add(fund)
            db.flush()
            FUND_BY_SLUG[fdata["slug"]] = fund
            funds_created += 1

        # ── 2. Create Investments ──
        # First pass: assign companies to funds and compute raw weights
        companies = db.query(Company).all()

        # Skip companies that already have investments
        new_companies = []
        for company in companies:
            existing_inv = (
                db.query(Investment)
                .filter(Investment.company_id == company.id)
                .first()
            )
            if not existing_inv:
                new_companies.append(company)

        # Group companies by fund
        fund_companies: dict = {}  # fund_id -> list of (company, raw_weight)
        for company in new_companies:
            name = company.name
            is_consumer = company.portfolio == Portfolio.consumer
            is_realized = company.status == CompanyStatus.realized
            fund = assign_fund(company.portfolio, company.investment_year, name, is_realized)

            # Raw weight: deterministic relative sizing (larger = bigger check)
            if is_consumer:
                raw_weight = in_range(name, 10, 30, 150)
            else:
                raw_weight = in_range(name, 10, 20, 80)

            if fund.id not in fund_companies:
                fund_companies[fund.id] = []
            fund_companies[fund.id].append((company, fund, raw_weight))

        # Second pass: size investments proportionally within each fund's budget
        for fund_id, company_list in fund_companies.items():
            fund_obj = company_list[0][1]
            committed = fund_obj.committed_capital

            # Target deployment: closed funds fully deployed, active 55-75%, harvesting 80-90%
            if fund_obj.status == FundStatus.closed:
                # Closed funds: all capital deployed (no reserves left, all realized)
                deploy_pct = in_range_float(fund_obj.name, 300, 0.92, 0.98)
                invest_budget = committed * deploy_pct
                reserve_budget = 0  # reserves consumed in closed funds
            elif fund_obj.status == FundStatus.harvesting:
                deploy_pct = in_range_float(fund_obj.name, 300, 0.82, 0.92)
                total_investable = committed * deploy_pct
                invest_budget = total_investable * 0.88
                reserve_budget = total_investable * 0.12
            else:
                deploy_pct = in_range_float(fund_obj.name, 300, 0.55, 0.75)
                total_investable = committed * deploy_pct
                invest_budget = total_investable * 0.82
                reserve_budget = total_investable * 0.18

            total_weight = sum(w for _, _, w in company_list)

            for company, fund, raw_weight in company_list:
                name = company.name
                is_consumer = company.portfolio == Portfolio.consumer
                is_realized = company.status == CompanyStatus.realized

                # Proportional check size
                invested_capital = round((raw_weight / total_weight) * invest_budget, -3)

                # Entry valuation
                entry_mult = in_range(name, 20, 3, 8)
                entry_valuation = invested_capital * entry_mult

                # Ownership
                ownership_pct = invested_capital / entry_valuation if entry_valuation > 0 else 0.15

                # Round type
                round_idx = hash_str(name, 30) % len(ROUND_TYPES)
                round_type = ROUND_TYPES[round_idx]

                # Investment date
                inv_year = company.investment_year
                if inv_year is None:
                    inv_year = (company.founded_year or fund.vintage_year) + 2
                inv_month = in_range(name, 40, 1, 12)
                investment_date = datetime(inv_year, inv_month, 15)

                # Reserved capital: proportional share of reserve budget
                reserved_capital = round((raw_weight / total_weight) * reserve_budget, -3)

                if is_realized:
                    raw_moic = in_range_float(name, 60, 0.4, 8.0)
                    biased_moic = in_range_float(name, 61, 1.5, 4.0)
                    realized_moic = round(0.3 * raw_moic + 0.7 * biased_moic, 2)

                    exit_proceeds = invested_capital * realized_moic
                    current_valuation = exit_proceeds / ownership_pct if ownership_pct > 0 else exit_proceeds
                    current_moic = realized_moic

                    realized_irr = round(in_range_float(name, 70, 0.08, 0.55), 4)

                    exit_yr = company.exit_year
                    if exit_yr is None:
                        exit_yr = inv_year + in_range(name, 80, 3, 8)
                    exit_date = datetime(exit_yr, 6, 15)

                    reserved_capital = 0.0
                else:
                    current_moic = round(in_range_float(name, 90, 0.8, 4.5), 2)
                    current_valuation = entry_valuation * current_moic
                    exit_proceeds = None
                    exit_date = None
                    realized_moic = None
                    realized_irr = None

                investment = Investment(
                    fund_id=fund.id,
                    company_id=company.id,
                    investment_date=investment_date,
                    round_type=round_type,
                    invested_capital=invested_capital,
                    entry_valuation=entry_valuation,
                    ownership_pct=round(ownership_pct, 4),
                    current_valuation=current_valuation,
                    current_moic=current_moic,
                    is_realized=is_realized,
                    exit_date=exit_date,
                    exit_proceeds=exit_proceeds,
                    realized_moic=realized_moic,
                    realized_irr=realized_irr,
                    reserved_capital=round(reserved_capital, 2),
                )
                db.add(investment)
                investments_created += 1

        db.flush()

        # ── 3. Compute FundSnapshots ──
        for slug, fund in FUND_BY_SLUG.items():
            # Skip if snapshot already exists
            existing_snap = (
                db.query(FundSnapshot)
                .filter(FundSnapshot.fund_id == fund.id)
                .first()
            )
            if existing_snap:
                continue

            investments = (
                db.query(Investment)
                .filter(Investment.fund_id == fund.id)
                .all()
            )

            if not investments:
                # Create a minimal snapshot even for empty funds
                snapshot = FundSnapshot(
                    fund_id=fund.id,
                    as_of_date=datetime(2026, 3, 1),
                    invested_capital=0,
                    realized_value=0,
                    unrealized_value=0,
                    total_value=0,
                    dry_powder=fund.committed_capital,
                    reserved_capital=0,
                    tvpi=0,
                    dpi=0,
                    rvpi=0,
                    gross_irr=0,
                    net_irr=0,
                    num_investments=0,
                    num_realized=0,
                )
                db.add(snapshot)
                snapshots_created += 1
                continue

            invested_capital = sum(inv.invested_capital for inv in investments)
            realized_value = sum(
                (inv.exit_proceeds or 0) for inv in investments if inv.is_realized
            )
            unrealized_value = sum(
                inv.current_valuation * inv.ownership_pct
                for inv in investments
                if not inv.is_realized
            )
            total_value = realized_value + unrealized_value
            total_reserved = sum(inv.reserved_capital for inv in investments)
            dry_powder = fund.committed_capital - invested_capital - total_reserved

            tvpi = total_value / invested_capital if invested_capital > 0 else 0
            dpi = realized_value / invested_capital if invested_capital > 0 else 0
            rvpi = unrealized_value / invested_capital if invested_capital > 0 else 0

            num_investments = len(investments)
            num_realized = sum(1 for inv in investments if inv.is_realized)

            # Deterministic IRR
            is_closed = fund.status == FundStatus.closed
            if is_closed:
                gross_irr = round(in_range_float(fund.name, 100, 0.18, 0.45), 4)
            else:
                gross_irr = round(in_range_float(fund.name, 100, 0.15, 0.35), 4)

            irr_spread = in_range_float(fund.name, 110, 0.03, 0.05)
            net_irr = round(gross_irr - irr_spread, 4)

            snapshot = FundSnapshot(
                fund_id=fund.id,
                as_of_date=datetime(2026, 3, 1),
                invested_capital=round(invested_capital, 2),
                realized_value=round(realized_value, 2),
                unrealized_value=round(unrealized_value, 2),
                total_value=round(total_value, 2),
                dry_powder=round(dry_powder, 2),
                reserved_capital=round(total_reserved, 2),
                tvpi=round(tvpi, 2),
                dpi=round(dpi, 2),
                rvpi=round(rvpi, 2),
                gross_irr=gross_irr,
                net_irr=net_irr,
                num_investments=num_investments,
                num_realized=num_realized,
            )
            db.add(snapshot)
            snapshots_created += 1

        db.commit()

        print(f"Seed complete:")
        print(f"  Funds:       {funds_created} created, {funds_skipped} skipped")
        print(f"  Investments: {investments_created} created")
        print(f"  Snapshots:   {snapshots_created} created")
        print(f"  Totals: {db.query(Fund).count()} funds, "
              f"{db.query(Investment).count()} investments, "
              f"{db.query(FundSnapshot).count()} snapshots")
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
