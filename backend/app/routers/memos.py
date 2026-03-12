from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Memo, MemoCompany, Company
from app.schemas import MemoCreate, MemoResponse, MemoListResponse, CompanyResponse

router = APIRouter()


def build_memo_response(memo, companies):
    """Build a MemoResponse from a Memo and its associated Company list."""
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
    memos = (
        query.options(joinedload(Memo.memo_companies).joinedload(MemoCompany.company))
        .order_by(Memo.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []
    for memo in memos:
        companies = [mc.company for mc in memo.memo_companies]
        results.append(build_memo_response(memo, companies))

    return MemoListResponse(memos=results, total=total)


@router.get("/{memo_id}", response_model=MemoResponse)
def get_memo(memo_id: str, db: Session = Depends(get_db)):
    memo = (
        db.query(Memo)
        .options(joinedload(Memo.memo_companies).joinedload(MemoCompany.company))
        .filter(Memo.id == memo_id)
        .first()
    )
    if not memo:
        raise HTTPException(status_code=404, detail="Memo not found")

    companies = [mc.company for mc in memo.memo_companies]
    return build_memo_response(memo, companies)


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

    companies = (
        db.query(Company).filter(Company.id.in_(data.company_ids)).all()
        if data.company_ids else []
    )
    return build_memo_response(memo, companies)
