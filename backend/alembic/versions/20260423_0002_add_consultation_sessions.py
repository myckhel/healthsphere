"""add consultation sessions

Revision ID: 20260423_0002
Revises: 20260422_0001
Create Date: 2026-04-23 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260423_0002"
down_revision = "20260422_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "consultation_sessions",
        sa.Column("clinic_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("triage_case_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("clinician_id", sa.String(length=128), nullable=False),
        sa.Column("clinician_name", sa.String(length=255), nullable=True),
        sa.Column("next_action", sa.String(length=64), nullable=True),
        sa.Column("draft_note", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["clinic_id"], ["clinics.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["triage_case_id"], ["triage_cases.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_consultation_sessions_clinic_id"), "consultation_sessions", ["clinic_id"], unique=False)
    op.create_index(op.f("ix_consultation_sessions_patient_id"), "consultation_sessions", ["patient_id"], unique=False)
    op.create_index(op.f("ix_consultation_sessions_triage_case_id"), "consultation_sessions", ["triage_case_id"], unique=False)
    op.create_index(op.f("ix_consultation_sessions_clinician_id"), "consultation_sessions", ["clinician_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_consultation_sessions_clinician_id"), table_name="consultation_sessions")
    op.drop_index(op.f("ix_consultation_sessions_triage_case_id"), table_name="consultation_sessions")
    op.drop_index(op.f("ix_consultation_sessions_patient_id"), table_name="consultation_sessions")
    op.drop_index(op.f("ix_consultation_sessions_clinic_id"), table_name="consultation_sessions")
    op.drop_table("consultation_sessions")
