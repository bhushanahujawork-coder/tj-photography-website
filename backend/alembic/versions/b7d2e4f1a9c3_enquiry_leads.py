"""enquiry leads + otp attempts

Revision ID: b7d2e4f1a9c3
Revises: 5f3a9c1e7b02
Create Date: 2026-09-25 10:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b7d2e4f1a9c3'
down_revision: Union[str, None] = '5f3a9c1e7b02'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'enquirylead',
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('phone_verified', sa.Boolean(), nullable=False),
        sa.Column('event_type', sa.String(length=20), nullable=True),
        sa.Column('couple_name', sa.String(length=255), nullable=True),
        sa.Column('event_date', sa.String(length=10), nullable=True),
        sa.Column('venues', sa.JSON(), nullable=True),
        sa.Column('package_id', sa.String(length=100), nullable=True),
        sa.Column('package_name', sa.String(length=100), nullable=True),
        sa.Column('package_price', sa.Integer(), nullable=True),
        sa.Column('add_ons', sa.JSON(), nullable=True),
        sa.Column('quotation_total', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_enquirylead_phone', 'enquirylead', ['phone'], unique=False)
    op.create_index('ix_enquirylead_status', 'enquirylead', ['status'], unique=False)
    op.add_column(
        'otpcode',
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
    )


def downgrade() -> None:
    op.drop_column('otpcode', 'attempts')
    op.drop_index('ix_enquirylead_status', table_name='enquirylead')
    op.drop_index('ix_enquirylead_phone', table_name='enquirylead')
    op.drop_table('enquirylead')
