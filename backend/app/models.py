import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class Portfolio(str, enum.Enum):
    technology = "technology"
    consumer = "consumer"


class Sector(str, enum.Enum):
    beauty = "beauty"
    food_bev = "food-bev"
    wellness = "wellness"
    pet = "pet"
    software = "software"
    marketplace = "marketplace"


class CompanyStatus(str, enum.Enum):
    active = "active"
    realized = "realized"


class FundStrategy(str, enum.Enum):
    consumer = "consumer"
    technology = "technology"


class FundStatus(str, enum.Enum):
    active = "active"
    harvesting = "harvesting"
    closed = "closed"


class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    portfolio = Column(SAEnum(Portfolio), nullable=False)
    sector = Column(SAEnum(Sector), nullable=False)
    status = Column(SAEnum(CompanyStatus), nullable=False)
    description = Column(Text, nullable=False)
    website = Column(String(500))
    logo_url = Column(String(500))
    domain = Column(String(255))
    investment_year = Column(Integer)
    exit_year = Column(Integer)
    acquirer = Column(String(255))
    founded_year = Column(Integer)
    hq_location = Column(String(255))
    category = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    leaders = relationship("Leader", back_populates="company", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="company", cascade="all, delete-orphan")


class Leader(Base):
    __tablename__ = "leaders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    linkedin_url = Column(String(500))
    headshot_url = Column(String(500))

    company = relationship("Company", back_populates="leaders")


class Memo(Base):
    __tablename__ = "memos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    content = Column(Text)
    status = Column(String(50), default="draft")  # draft, review, final
    author = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    memo_companies = relationship("MemoCompany", back_populates="memo", cascade="all, delete-orphan")


class MemoCompany(Base):
    __tablename__ = "memo_companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    memo_id = Column(UUID(as_uuid=True), ForeignKey("memos.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)

    memo = relationship("Memo", back_populates="memo_companies")
    company = relationship("Company")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)  # investment, exit, thesis_update, note, milestone
    title = Column(String(500), nullable=False)
    description = Column(Text)
    author = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="activity_logs")


# ── Fund Model ──

class Fund(Base):
    __tablename__ = "funds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    strategy = Column(SAEnum(FundStrategy), nullable=False)
    vintage_year = Column(Integer, nullable=False)
    committed_capital = Column(Float, nullable=False)
    management_fee_rate = Column(Float, default=0.02)
    carry_rate = Column(Float, default=0.20)
    status = Column(SAEnum(FundStatus), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    investments = relationship("Investment", back_populates="fund", cascade="all, delete-orphan")
    snapshots = relationship("FundSnapshot", back_populates="fund", cascade="all, delete-orphan")


class Investment(Base):
    __tablename__ = "investments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fund_id = Column(UUID(as_uuid=True), ForeignKey("funds.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    investment_date = Column(DateTime, nullable=False)
    round_type = Column(String(100), nullable=False)
    invested_capital = Column(Float, nullable=False)
    entry_valuation = Column(Float, nullable=False)
    ownership_pct = Column(Float, nullable=False)
    current_valuation = Column(Float, nullable=False)
    current_moic = Column(Float, nullable=False)
    is_realized = Column(Boolean, default=False)
    exit_date = Column(DateTime)
    exit_proceeds = Column(Float)
    realized_moic = Column(Float)
    realized_irr = Column(Float)
    reserved_capital = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    fund = relationship("Fund", back_populates="investments")
    company = relationship("Company")


class FundSnapshot(Base):
    __tablename__ = "fund_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fund_id = Column(UUID(as_uuid=True), ForeignKey("funds.id", ondelete="CASCADE"), nullable=False, index=True)
    as_of_date = Column(DateTime, nullable=False)
    invested_capital = Column(Float, nullable=False)
    realized_value = Column(Float, nullable=False)
    unrealized_value = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)
    dry_powder = Column(Float, nullable=False)
    reserved_capital = Column(Float, nullable=False)
    tvpi = Column(Float, nullable=False)
    dpi = Column(Float, nullable=False)
    rvpi = Column(Float, nullable=False)
    gross_irr = Column(Float, nullable=False)
    net_irr = Column(Float, nullable=False)
    num_investments = Column(Integer, nullable=False)
    num_realized = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    fund = relationship("Fund", back_populates="snapshots")


class FundingRound(Base):
    __tablename__ = "funding_rounds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    round_name = Column(String(100))  # "Series A", "Series B", etc.
    amount = Column(Float)
    date = Column(DateTime)
    lead_investor = Column(String(255))
    investors = Column(String(1000))  # comma-separated
    pre_money_valuation = Column(Float, nullable=True)
    source = Column(String(50), default="internal")  # "crunchbase", "internal", "manual"
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", backref="funding_rounds")


class DealStage(str, enum.Enum):
    screening = "screening"
    diligence = "diligence"
    ic_review = "ic_review"
    term_sheet = "term_sheet"
    closed = "closed"
    passed = "passed"


class PipelineDeal(Base):
    __tablename__ = "pipeline_deals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(255), nullable=False)
    sector = Column(String(100), nullable=False)
    stage = Column(String(50), nullable=False, default="screening")
    strategy = Column(String(50), nullable=False)
    description = Column(Text)
    deal_size = Column(Float)  # target check size
    valuation = Column(Float)  # estimated valuation
    revenue = Column(Float)  # LTM revenue
    growth_rate = Column(Float)  # YoY growth %
    source = Column(String(255))  # e.g. "Banker referral", "Proprietary", "Conference"
    lead_contact = Column(String(255))
    priority = Column(String(50), default="medium")  # low, medium, high
    notes = Column(Text)
    entered_pipeline = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
