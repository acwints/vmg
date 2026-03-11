from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


# --- Leader ---
class LeaderBase(BaseModel):
    name: str
    title: str
    linkedin_url: Optional[str] = None
    headshot_url: Optional[str] = None

class LeaderCreate(LeaderBase):
    pass

class LeaderResponse(LeaderBase):
    id: UUID

    class Config:
        from_attributes = True


# --- Company ---
class CompanyBase(BaseModel):
    name: str
    slug: str
    portfolio: str
    sector: str
    status: str
    description: str
    website: Optional[str] = None
    logo_url: Optional[str] = None
    domain: Optional[str] = None
    investment_year: Optional[int] = None
    exit_year: Optional[int] = None
    acquirer: Optional[str] = None
    founded_year: Optional[int] = None
    hq_location: Optional[str] = None
    category: Optional[str] = None

class CompanyCreate(CompanyBase):
    leaders: list[LeaderCreate] = []

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    domain: Optional[str] = None
    status: Optional[str] = None
    investment_year: Optional[int] = None
    exit_year: Optional[int] = None
    acquirer: Optional[str] = None
    founded_year: Optional[int] = None
    hq_location: Optional[str] = None
    category: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    leaders: list[LeaderResponse] = []

    class Config:
        from_attributes = True

class CompanyListResponse(BaseModel):
    companies: list[CompanyResponse]
    total: int


# --- Portfolio Stats ---
class PortfolioStatsResponse(BaseModel):
    total_companies: int
    active_companies: int
    realized_companies: int
    sectors: int


# --- Memo ---
class MemoBase(BaseModel):
    title: str
    content: Optional[str] = None
    status: str = "draft"
    author: str

class MemoCreate(MemoBase):
    company_ids: list[UUID] = []

class MemoResponse(MemoBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    companies: list[CompanyResponse] = []

    class Config:
        from_attributes = True

class MemoListResponse(BaseModel):
    memos: list[MemoResponse]
    total: int


# --- Activity Log ---
class ActivityLogBase(BaseModel):
    event_type: str
    title: str
    description: Optional[str] = None
    author: Optional[str] = None

class ActivityLogCreate(ActivityLogBase):
    company_id: UUID

class ActivityLogResponse(ActivityLogBase):
    id: UUID
    company_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ── Fund Model ──

class FundResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    strategy: str
    vintage_year: int
    committed_capital: float
    management_fee_rate: float
    carry_rate: float
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FundSnapshotResponse(BaseModel):
    fund_id: UUID
    as_of_date: datetime
    invested_capital: float
    realized_value: float
    unrealized_value: float
    total_value: float
    dry_powder: float
    reserved_capital: float
    tvpi: float
    dpi: float
    rvpi: float
    gross_irr: float
    net_irr: float
    num_investments: int
    num_realized: int

    class Config:
        from_attributes = True

class InvestmentResponse(BaseModel):
    id: UUID
    fund_id: UUID
    company_id: UUID
    company_name: str
    company_slug: str
    company_sector: str
    investment_date: datetime
    round_type: str
    invested_capital: float
    entry_valuation: float
    ownership_pct: float
    current_valuation: float
    current_moic: float
    is_realized: bool
    exit_date: Optional[datetime] = None
    exit_proceeds: Optional[float] = None
    realized_moic: Optional[float] = None
    realized_irr: Optional[float] = None
    reserved_capital: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FundDetailResponse(FundResponse):
    snapshot: Optional[FundSnapshotResponse] = None
    investments: list[InvestmentResponse] = []

class FundOverviewResponse(BaseModel):
    funds: list[FundDetailResponse]
    total_aum: float
    total_invested: float
    total_dry_powder: float
    total_realized: float
    total_unrealized: float
    weighted_tvpi: float
    weighted_net_irr: float

class ConstructionItem(BaseModel):
    label: str
    invested: float
    pct: float
    count: int

class ConcentrationItem(BaseModel):
    company: str
    invested: float
    pct_of_fund: float

class ReserveSummary(BaseModel):
    total_reserved: float
    total_deployed: float
    adequacy_ratio: float

class PortfolioConstructionResponse(BaseModel):
    by_strategy: list[ConstructionItem]
    by_sector: list[ConstructionItem]
    by_vintage: list[ConstructionItem]
    concentration: list[ConcentrationItem]
    reserve_summary: ReserveSummary

class DeploymentQuarter(BaseModel):
    quarter: str
    projected_deploy: float
    cumulative: float

class DeploymentModelResponse(BaseModel):
    fund_id: str
    fund_name: str
    committed: float
    invested: float
    reserved: float
    dry_powder: float
    months_since_close: int
    deployment_pct: float
    projected_quarters: list[DeploymentQuarter]

class MoicBucket(BaseModel):
    label: str
    count: int

class FundReturnRow(BaseModel):
    fund_name: str
    fund_slug: str
    vintage_year: int
    strategy: str
    tvpi: float
    dpi: float
    rvpi: float
    gross_irr: float
    net_irr: float

class FundReturnsResponse(BaseModel):
    funds: list[FundReturnRow]
    moic_distribution: list[MoicBucket]
