from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Memo, MemoCompany, Company
from app.schemas import MemoCreate, MemoResponse, MemoListResponse, CompanyResponse

router = APIRouter()


@router.get("", response_model=MemoListResponse)
def list_memos(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Memo)
    if status:
        query = query.filter(Memo.status == status)

    total = query.count()
    memos = query.order_by(Memo.updated_at.desc()).offset(skip).limit(limit).all()

    results = []
    for memo in memos:
        mc_rows = db.query(MemoCompany).filter(MemoCompany.memo_id == memo.id).all()
        company_ids = [mc.company_id for mc in mc_rows]
        companies = db.query(Company).filter(Company.id.in_(company_ids)).all() if company_ids else []
        memo_resp = MemoResponse(
            id=memo.id,
            title=memo.title,
            content=memo.content,
            status=memo.status,
            author=memo.author,
            created_at=memo.created_at,
            updated_at=memo.updated_at,
            companies=[CompanyResponse.model_validate(c) for c in companies],
        )
        results.append(memo_resp)

    return MemoListResponse(memos=results, total=total)


@router.get("/{memo_id}", response_model=MemoResponse)
def get_memo(memo_id: str, db: Session = Depends(get_db)):
    memo = db.query(Memo).filter(Memo.id == memo_id).first()
    if not memo:
        raise HTTPException(status_code=404, detail="Memo not found")

    mc_rows = db.query(MemoCompany).filter(MemoCompany.memo_id == memo.id).all()
    company_ids = [mc.company_id for mc in mc_rows]
    companies = db.query(Company).filter(Company.id.in_(company_ids)).all() if company_ids else []

    return MemoResponse(
        id=memo.id,
        title=memo.title,
        content=memo.content,
        status=memo.status,
        author=memo.author,
        created_at=memo.created_at,
        updated_at=memo.updated_at,
        companies=[CompanyResponse.model_validate(c) for c in companies],
    )


@router.post("", response_model=MemoResponse, status_code=201)
def create_memo(data: MemoCreate, db: Session = Depends(get_db)):
    memo = Memo(
        title=data.title,
        content=data.content,
        status=data.status,
        author=data.author,
    )
    db.add(memo)
    db.flush()

    for company_id in data.company_ids:
        mc = MemoCompany(memo_id=memo.id, company_id=company_id)
        db.add(mc)

    db.commit()
    db.refresh(memo)

    mc_rows = db.query(MemoCompany).filter(MemoCompany.memo_id == memo.id).all()
    company_ids = [mc.company_id for mc in mc_rows]
    companies = db.query(Company).filter(Company.id.in_(company_ids)).all() if company_ids else []

    return MemoResponse(
        id=memo.id,
        title=memo.title,
        content=memo.content,
        status=memo.status,
        author=memo.author,
        created_at=memo.created_at,
        updated_at=memo.updated_at,
        companies=[CompanyResponse.model_validate(c) for c in companies],
    )
