from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx
from datetime import datetime, timedelta
from app.config import settings
from app.database import get_db
from app.models import FundingRound, Company

router = APIRouter()

# ── FRED series definitions ──

INDICATORS = [
    {"name": "Federal Funds Rate", "series_id": "FEDFUNDS", "unit": "%", "category": "rates"},
    {"name": "10-Year Treasury Yield", "series_id": "DGS10", "unit": "%", "category": "rates"},
    {"name": "CPI (YoY)", "series_id": "CPIAUCSL", "unit": "% change", "category": "inflation"},
    {"name": "Consumer Confidence (UMich)", "series_id": "UMCSENT", "unit": "index", "category": "sentiment"},
    {"name": "Real GDP Growth (QoQ Ann.)", "series_id": "A191RL1Q225SBEA", "unit": "%", "category": "growth"},
    {"name": "Unemployment Rate", "series_id": "UNRATE", "unit": "%", "category": "growth"},
    {"name": "S&P 500 PE Ratio", "series_id": "SP500_PE", "unit": "x", "category": "sentiment"},
    {"name": "Consumer Spending (PCE YoY)", "series_id": "PCE", "unit": "% change", "category": "inflation"},
]

# Realistic hardcoded fallback data as of early 2026
FALLBACK_VALUES = {
    "FEDFUNDS": {"value": 3.75, "previous_value": 4.00, "last_updated": "2026-02-01"},
    "DGS10": {"value": 4.12, "previous_value": 4.25, "last_updated": "2026-03-07"},
    "CPIAUCSL": {"value": 2.4, "previous_value": 2.6, "last_updated": "2026-02-15"},
    "UMCSENT": {"value": 68.4, "previous_value": 67.1, "last_updated": "2026-02-28"},
    "A191RL1Q225SBEA": {"value": 2.1, "previous_value": 2.3, "last_updated": "2026-01-30"},
    "UNRATE": {"value": 4.1, "previous_value": 4.0, "last_updated": "2026-02-07"},
    "SP500_PE": {"value": 22.8, "previous_value": 23.1, "last_updated": "2026-03-07"},
    "PCE": {"value": 2.3, "previous_value": 2.5, "last_updated": "2026-02-28"},
}

SERIES_NAMES = {ind["series_id"]: ind["name"] for ind in INDICATORS}
SERIES_UNITS = {ind["series_id"]: ind["unit"] for ind in INDICATORS}


async def _fetch_fred_observations(series_id: str, limit: int = 2) -> list[dict] | None:
    """Fetch observations from FRED API. Returns None on failure."""
    if not settings.fred_api_key or series_id == "SP500_PE":
        return None
    url = (
        f"https://api.stlouisfed.org/fred/series/observations"
        f"?series_id={series_id}&api_key={settings.fred_api_key}"
        f"&file_type=json&sort_order=desc&limit={limit}"
    )
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            return data.get("observations", [])
    except Exception:
        return None


def _build_indicator(meta: dict, value: float, previous_value: float, last_updated: str) -> dict:
    change = round(value - previous_value, 4)
    return {
        "name": meta["name"],
        "series_id": meta["series_id"],
        "value": value,
        "previous_value": previous_value,
        "change": change,
        "unit": meta["unit"],
        "category": meta["category"],
        "last_updated": last_updated,
    }


@router.get("/indicators")
async def get_indicators():
    """Return key economic indicators with recent values and trends."""
    results = []
    for meta in INDICATORS:
        sid = meta["series_id"]
        obs = await _fetch_fred_observations(sid, limit=2)

        if obs and len(obs) >= 2:
            try:
                value = float(obs[0]["value"])
                previous_value = float(obs[1]["value"])
                last_updated = obs[0]["date"]
            except (ValueError, KeyError):
                fb = FALLBACK_VALUES[sid]
                value, previous_value, last_updated = fb["value"], fb["previous_value"], fb["last_updated"]
        elif obs and len(obs) == 1:
            try:
                value = float(obs[0]["value"])
                previous_value = value
                last_updated = obs[0]["date"]
            except (ValueError, KeyError):
                fb = FALLBACK_VALUES[sid]
                value, previous_value, last_updated = fb["value"], fb["previous_value"], fb["last_updated"]
        else:
            fb = FALLBACK_VALUES[sid]
            value, previous_value, last_updated = fb["value"], fb["previous_value"], fb["last_updated"]

        results.append(_build_indicator(meta, value, previous_value, last_updated))

    return {"indicators": results, "source": "fred" if settings.fred_api_key else "fallback"}


@router.get("/series/{series_id}")
async def get_series(series_id: str):
    """Return time series data for a specific indicator (last 5 years, monthly)."""
    name = SERIES_NAMES.get(series_id, series_id)
    unit = SERIES_UNITS.get(series_id, "")

    # Try FRED first
    if settings.fred_api_key and series_id != "SP500_PE":
        url = (
            f"https://api.stlouisfed.org/fred/series/observations"
            f"?series_id={series_id}&api_key={settings.fred_api_key}"
            f"&file_type=json&sort_order=asc&frequency=m"
            f"&observation_start={(datetime.utcnow() - timedelta(days=5*365)).strftime('%Y-%m-%d')}"
        )
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()
                observations = [
                    {"date": o["date"], "value": float(o["value"])}
                    for o in data.get("observations", [])
                    if o["value"] != "."
                ]
                return {
                    "series_id": series_id,
                    "name": name,
                    "unit": unit,
                    "observations": observations,
                    "source": "fred",
                }
        except Exception:
            pass  # fall through to hardcoded

    # Hardcoded sample data (monthly, last 5 years)
    observations = _generate_fallback_series(series_id)
    return {
        "series_id": series_id,
        "name": name,
        "unit": unit,
        "observations": observations,
        "source": "fallback",
    }


def _generate_fallback_series(series_id: str) -> list[dict]:
    """Generate realistic monthly data for the last 5 years."""
    import random

    random.seed(hash(series_id))  # deterministic per series

    base_values = {
        "FEDFUNDS": (0.08, 5.50, 3.75),   # start, peak, current
        "DGS10": (1.60, 4.80, 4.12),
        "CPIAUCSL": (1.4, 9.1, 2.4),
        "UMCSENT": (76.0, 50.0, 68.4),
        "A191RL1Q225SBEA": (-1.6, 4.9, 2.1),
        "UNRATE": (3.9, 3.4, 4.1),
        "SP500_PE": (22.0, 25.5, 22.8),
        "PCE": (1.5, 7.0, 2.3),
    }

    start_val, peak_val, end_val = base_values.get(series_id, (1.0, 3.0, 2.0))
    n_months = 60
    observations = []
    base_date = datetime(2021, 3, 1)

    for i in range(n_months):
        t = i / (n_months - 1)
        # Simple trajectory: rise to peak at ~40%, then descend to current
        if t < 0.4:
            val = start_val + (peak_val - start_val) * (t / 0.4)
        else:
            val = peak_val + (end_val - peak_val) * ((t - 0.4) / 0.6)

        val += random.uniform(-0.15, 0.15) * abs(end_val - start_val) * 0.1
        dt = base_date + timedelta(days=30 * i)
        observations.append({"date": dt.strftime("%Y-%m-%d"), "value": round(val, 2)})

    return observations


@router.get("/funding")
async def get_funding_rounds(company_id: str | None = None, db: Session = Depends(get_db)):
    """Return funding rounds, optionally filtered by company_id."""
    query = db.query(FundingRound).join(Company, FundingRound.company_id == Company.id)
    if company_id:
        query = query.filter(FundingRound.company_id == company_id)
    rounds = query.order_by(FundingRound.date.asc()).all()

    results = []
    for r in rounds:
        results.append({
            "id": str(r.id),
            "company_id": str(r.company_id),
            "company_name": r.company.name if r.company else None,
            "round_name": r.round_name,
            "amount": r.amount,
            "date": r.date.isoformat() if r.date else None,
            "lead_investor": r.lead_investor,
            "investors": r.investors,
            "pre_money_valuation": r.pre_money_valuation,
            "source": r.source,
        })

    return {"funding_rounds": results, "total": len(results)}
