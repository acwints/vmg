"""
Seed funding rounds for portfolio companies with realistic Crunchbase-style data.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models import Company, FundingRound


def hash_str(s, salt=0):
    h = 0
    s = s + str(salt)
    for c in s:
        h = ((h << 5) - h + ord(c)) & 0xFFFFFFFF
    return h


def in_range(name, salt, min_val, max_val):
    return min_val + (hash_str(name, salt) % (max_val - min_val + 1))


def in_range_float(name, salt, min_val, max_val, precision=100):
    raw = hash_str(name, salt) % (precision + 1)
    return min_val + (max_val - min_val) * raw / precision


LEAD_INVESTORS = [
    "VMG Partners", "VMG Catalyst", "Sequoia Capital", "Andreessen Horowitz",
    "General Atlantic", "L Catterton", "Stripes", "Imaginary Ventures",
    "Forerunner Ventures", "CircleUp", "Khosla Ventures", "Tiger Global",
    "Insight Partners", "Accel", "Lightspeed Venture Partners",
    "GGV Capital", "Bessemer Venture Partners", "Index Ventures",
    "Founders Fund", "Greylock Partners", "NEA", "Battery Ventures",
]

CO_INVESTORS = [
    "Meritech Capital", "Coatue Management", "DST Global", "SoftBank Vision Fund",
    "Thrive Capital", "Spark Capital", "Redpoint Ventures", "Bain Capital Ventures",
    "Summit Partners", "TA Associates", "Providence Equity", "Warburg Pincus",
    "KKR", "TPG Growth", "Kayne Anderson", "Catterton Partners",
]

ROUND_PROGRESSION = [
    ("Seed", 1_000_000, 5_000_000),
    ("Series A", 5_000_000, 25_000_000),
    ("Series B", 15_000_000, 75_000_000),
    ("Series C", 40_000_000, 150_000_000),
    ("Series D", 80_000_000, 300_000_000),
    ("Growth", 100_000_000, 500_000_000),
]


def seed():
    db: Session = SessionLocal()
    created = 0
    skipped = 0

    try:
        companies = db.query(Company).all()

        for company in companies:
            # Skip if already has funding rounds
            existing = db.query(FundingRound).filter(FundingRound.company_id == company.id).first()
            if existing:
                skipped += 1
                continue

            name = company.name
            founded = company.founded_year or 2018
            inv_year = company.investment_year or founded + 2

            # Determine how many rounds (2-5 based on company age and status)
            age = 2026 - founded
            if company.status.value == "realized":
                num_rounds = min(in_range(name, 200, 3, 5), len(ROUND_PROGRESSION))
            else:
                num_rounds = min(in_range(name, 200, 2, 4), len(ROUND_PROGRESSION))

            is_consumer = company.portfolio.value == "consumer"

            for i in range(num_rounds):
                round_name, min_amt, max_amt = ROUND_PROGRESSION[i]

                # Consumer companies tend to raise larger later rounds
                if is_consumer and i >= 2:
                    min_amt = int(min_amt * 1.3)
                    max_amt = int(max_amt * 1.5)

                amount = in_range(name, 210 + i * 10, min_amt, max_amt)

                # Round date: spread from founded year
                round_year = founded + i + in_range(name, 220 + i, 0, 1)
                round_month = in_range(name, 230 + i, 1, 12)
                if round_year > 2025:
                    round_year = 2025
                round_date = datetime(round_year, round_month, 15)

                # Lead investor: VMG leads the round matching their investment year
                if abs(round_year - inv_year) <= 1 and i >= 1:
                    lead = "VMG Partners" if is_consumer else "VMG Catalyst"
                else:
                    lead_idx = hash_str(name, 240 + i) % len(LEAD_INVESTORS)
                    lead = LEAD_INVESTORS[lead_idx]

                # Co-investors (1-3)
                num_co = in_range(name, 250 + i, 1, 3)
                co_start = hash_str(name, 260 + i) % len(CO_INVESTORS)
                co_investors = [CO_INVESTORS[(co_start + j) % len(CO_INVESTORS)] for j in range(num_co)]
                all_investors = ", ".join([lead] + co_investors)

                # Pre-money valuation: roughly 3-6x the round size
                val_mult = in_range_float(name, 270 + i, 3.0, 6.0)
                pre_money = amount * val_mult

                funding_round = FundingRound(
                    company_id=company.id,
                    round_name=round_name,
                    amount=round(amount, -3),  # round to nearest thousand
                    date=round_date,
                    lead_investor=lead,
                    investors=all_investors,
                    pre_money_valuation=round(pre_money, -3),
                    source="crunchbase",
                )
                db.add(funding_round)
                created += 1

        db.commit()
        print(f"Funding rounds seed complete:")
        print(f"  Created: {created}")
        print(f"  Skipped: {skipped} companies (already had rounds)")
        print(f"  Total rounds: {db.query(FundingRound).count()}")
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
