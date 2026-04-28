"""add ai usage events

Revision ID: 20260428_0004
Revises: 20260425_0003
Create Date: 2026-04-28 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260428_0004"
down_revision = "20260425_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_usage_events",
        sa.Column("clinic_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("entity_type", sa.String(length=64), nullable=True),
        sa.Column("entity_id", sa.String(length=128), nullable=True),
        sa.Column("actor_id", sa.String(length=128), nullable=True),
        sa.Column("actor_role", sa.String(length=32), nullable=True),
        sa.Column("workflow", sa.String(length=64), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("model", sa.String(length=128), nullable=False),
        sa.Column("request_count", sa.Integer(), nullable=False),
        sa.Column("input_tokens", sa.Integer(), nullable=False),
        sa.Column("output_tokens", sa.Integer(), nullable=False),
        sa.Column("total_tokens", sa.Integer(), nullable=False),
        sa.Column("cached_input_tokens", sa.Integer(), nullable=False),
        sa.Column("reasoning_tokens", sa.Integer(), nullable=False),
        sa.Column("estimated_cost_usd", sa.Float(), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["clinic_id"], ["clinics.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_usage_events_actor_id"), "ai_usage_events", ["actor_id"], unique=False)
    op.create_index(op.f("ix_ai_usage_events_clinic_id"), "ai_usage_events", ["clinic_id"], unique=False)
    op.create_index(op.f("ix_ai_usage_events_entity_id"), "ai_usage_events", ["entity_id"], unique=False)
    op.create_index(op.f("ix_ai_usage_events_patient_id"), "ai_usage_events", ["patient_id"], unique=False)
    op.create_index(op.f("ix_ai_usage_events_workflow"), "ai_usage_events", ["workflow"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_usage_events_workflow"), table_name="ai_usage_events")
    op.drop_index(op.f("ix_ai_usage_events_patient_id"), table_name="ai_usage_events")
    op.drop_index(op.f("ix_ai_usage_events_entity_id"), table_name="ai_usage_events")
    op.drop_index(op.f("ix_ai_usage_events_clinic_id"), table_name="ai_usage_events")
    op.drop_index(op.f("ix_ai_usage_events_actor_id"), table_name="ai_usage_events")
    op.drop_table("ai_usage_events")