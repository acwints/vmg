"""add users table

Revision ID: e5f7a1b63c0d
Revises: d4e6f0a52b9c
Create Date: 2026-03-12 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'e5f7a1b63c0d'
down_revision: Union[str, None] = 'd4e6f0a52b9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('name', sa.String(255)),
        sa.Column('avatar_url', sa.String(500)),
        sa.Column('google_id', sa.String(255), unique=True),
        sa.Column('google_access_token', sa.Text()),
        sa.Column('google_refresh_token', sa.Text()),
        sa.Column('google_token_expiry', sa.DateTime()),
        sa.Column('google_scopes', sa.Text()),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime()),
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_google_id', 'users', ['google_id'])


def downgrade() -> None:
    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
