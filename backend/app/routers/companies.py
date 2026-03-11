from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.database import get_db
from app.models import Company, Leader
from app.schemas import (
    CompanyCreate,
    CompanyUpdate,
    CompanyResponse,
    CompanyListResponse,
    LeaderCreate,
    LeaderResponse,
)

router = APIRouter()


@router.get("", response_model=CompanyListResponse)
def list_companies(
    portfolio: Optional[str] = None,
    sector: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Company).options(joinedload(Company.leaders))

    if portfolio:
        query = query.filter(Company.portfolio == portfolio)
    if sector:
        query = query.filter(Company.sector == sector)
    if status:
        query = query.filter(Company.status == status)
    if search:
        query = query.filter(
            Company.name.ilike(f"%{search}%")
            | Company.description.ilike(f"%{search}%")
        )

    total = query.count()
    companies = query.order_by(Company.name).offset(skip).limit(limit).all()

    return CompanyListResponse(
        companies=[CompanyResponse.model_validate(c) for c in companies],
        total=total,
    )


@router.get("/{slug}", response_model=CompanyResponse)
def get_company(slug: str, db: Session = Depends(get_db)):
    company = (
        db.query(Company)
        .options(joinedload(Company.leaders))
        .filter(Company.slug == slug)
        .first()
    )
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse.model_validate(company)


@router.post("", response_model=CompanyResponse, status_code=201)
def create_company(data: CompanyCreate, db: Session = Depends(get_db)):
    leaders_data = data.leaders
    company_dict = data.model_dump(exclude={"leaders"})
    company = Company(**company_dict)
    db.add(company)
    db.flush()

    for leader_data in leaders_data:
        leader = Leader(**leader_data.model_dump(), company_id=company.id)
        db.add(leader)

    db.commit()
    db.refresh(company)
    return CompanyResponse.model_validate(company)


@router.patch("/{slug}", response_model=CompanyResponse)
def update_company(slug: str, data: CompanyUpdate, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.slug == slug).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(company, key, value)

    db.commit()
    db.refresh(company)
    return CompanyResponse.model_validate(company)


@router.delete("/{slug}", status_code=204)
def delete_company(slug: str, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.slug == slug).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(company)
    db.commit()


@router.post("/{slug}/leaders", response_model=LeaderResponse, status_code=201)
def add_leader(slug: str, data: LeaderCreate, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.slug == slug).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    leader = Leader(**data.model_dump(), company_id=company.id)
    db.add(leader)
    db.commit()
    db.refresh(leader)
    return LeaderResponse.model_validate(leader)
