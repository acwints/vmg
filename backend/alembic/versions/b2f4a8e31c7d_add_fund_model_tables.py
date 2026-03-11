"""add fund model tables

Revision ID: b2f4a8e31c7d
Revises: 0163ab087390
Create Date: 2026-03-10 17:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'b2f4a8e31c7d'
down_revision: Union[str, None] = '0163ab087390'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enums
    fund_strategy = postgresql.ENUM('consumer', 'technology', name='fundstrategy', create_type=False)
    fund_status = postgresql.ENUM('active', 'harvesting', 'closed', name='fundstatus', create_type=False)
    fund_strategy.create(op.get_bind(), checkfirst=True)
    fund_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'funds',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('strategy', fund_strategy, nullable=False),
        sa.Column('vintage_year', sa.Integer(), nullable=False),
        sa.Column('committed_capital', sa.Float(), nullable=False),
        sa.Column('management_fee_rate', sa.Float(), default=0.02),
        sa.Column('carry_rate', sa.Float(), default=0.20),
        sa.Column('status', fund_status, nullable=False),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now()),
    )

    op.create_table(
        'investments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('fund_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('funds.id', ondelete='CASCADE'), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('investment_date', sa.DateTime(), nullable=False),
        sa.Column('round_type', sa.String(100), nullable=False),
        sa.Column('invested_capital', sa.Float(), nullable=False),
        sa.Column('entry_valuation', sa.Float(), nullable=False),
        sa.Column('ownership_pct', sa.Float(), nullable=False),
        sa.Column('current_valuation', sa.Float(), nullable=False),
        sa.Column('current_moic', sa.Float(), nullable=False),
        sa.Column('is_realized', sa.Boolean(), default=False),
        sa.Column('exit_date', sa.DateTime()),
        sa.Column('exit_proceeds', sa.Float()),
        sa.Column('realized_moic', sa.Float()),
        sa.Column('realized_irr', sa.Float()),
        sa.Column('reserved_capital', sa.Float(), default=0.0),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now()),
    )

    op.create_table(
        'fund_snapshots',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('fund_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('funds.id', ondelete='CASCADE'), nullable=False),
        sa.Column('as_of_date', sa.DateTime(), nullable=False),
        sa.Column('invested_capital', sa.Float(), nullable=False),
        sa.Column('realized_value', sa.Float(), nullable=False),
        sa.Column('unrealized_value', sa.Float(), nullable=False),
        sa.Column('total_value', sa.Float(), nullable=False),
        sa.Column('dry_powder', sa.Float(), nullable=False),
        sa.Column('reserved_capital', sa.Float(), nullable=False),
        sa.Column('tvpi', sa.Float(), nullable=False),
        sa.Column('dpi', sa.Float(), nullable=False),
        sa.Column('rvpi', sa.Float(), nullable=False),
        sa.Column('gross_irr', sa.Float(), nullable=False),
        sa.Column('net_irr', sa.Float(), nullable=False),
        sa.Column('num_investments', sa.Integer(), nullable=False),
        sa.Column('num_realized', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('fund_snapshots')
    op.drop_table('investments')
    op.drop_table('funds')
    op.execute("DROP TYPE IF EXISTS fundstrategy")
    op.execute("DROP TYPE IF EXISTS fundstatus")
