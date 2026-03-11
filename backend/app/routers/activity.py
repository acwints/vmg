from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ActivityLog
from app.schemas import ActivityLogCreate, ActivityLogResponse

router = APIRouter()


@router.get("", response_model=list[ActivityLogResponse])
def list_activity(
    company_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(ActivityLog)
    if company_id:
        query = query.filter(ActivityLog.company_id == company_id)

    return (
        query.order_by(ActivityLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("", response_model=ActivityLogResponse, status_code=201)
def create_activity(data: ActivityLogCreate, db: Session = Depends(get_db)):
    log = ActivityLog(**data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
