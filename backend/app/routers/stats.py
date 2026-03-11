from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Company
from app.schemas import PortfolioStatsResponse

router = APIRouter()


@router.get("", response_model=dict[str, PortfolioStatsResponse])
def get_stats(db: Session = Depends(get_db)):
    def compute_stats(portfolio_filter=None):
        query = db.query(Company)
        if portfolio_filter:
            query = query.filter(Company.portfolio == portfolio_filter)

        total = query.count()
        active = query.filter(Company.status == "active").count()
        realized = total - active
        sectors = db.query(func.count(func.distinct(Company.sector))).filter(
            Company.portfolio == portfolio_filter if portfolio_filter else True
        ).scalar()

        return PortfolioStatsResponse(
            total_companies=total,
            active_companies=active,
            realized_companies=realized,
            sectors=sectors or 0,
        )

    return {
        "overall": compute_stats(),
        "technology": compute_stats("technology"),
        "consumer": compute_stats("consumer"),
    }
