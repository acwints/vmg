"""add pipeline_deals table

Revision ID: d4e6f0a52b9c
Revises: c3d5e9f41a8b
Create Date: 2026-03-11 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'd4e6f0a52b9c'
down_revision: Union[str, None] = 'c3d5e9f41a8b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'pipeline_deals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('company_name', sa.String(255), nullable=False),
        sa.Column('sector', sa.String(100), nullable=False),
        sa.Column('stage', sa.String(50), nullable=False),
        sa.Column('strategy', sa.String(50), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('deal_size', sa.Float()),
        sa.Column('valuation', sa.Float()),
        sa.Column('revenue', sa.Float()),
        sa.Column('growth_rate', sa.Float()),
        sa.Column('source', sa.String(255)),
        sa.Column('lead_contact', sa.String(255)),
        sa.Column('priority', sa.String(50), default='medium'),
        sa.Column('notes', sa.Text()),
        sa.Column('entered_pipeline', sa.DateTime()),
        sa.Column('last_activity', sa.DateTime()),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime()),
    )


def downgrade() -> None:
    op.drop_table('pipeline_deals')
