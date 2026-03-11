"""add funding_rounds table

Revision ID: c3d5e9f41a8b
Revises: b2f4a8e31c7d
Create Date: 2026-03-11 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'c3d5e9f41a8b'
down_revision: Union[str, None] = 'b2f4a8e31c7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'funding_rounds',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='CASCADE')),
        sa.Column('round_name', sa.String(100)),
        sa.Column('amount', sa.Float()),
        sa.Column('date', sa.DateTime()),
        sa.Column('lead_investor', sa.String(255)),
        sa.Column('investors', sa.String(1000)),
        sa.Column('pre_money_valuation', sa.Float(), nullable=True),
        sa.Column('source', sa.String(50), default='internal'),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('funding_rounds')
