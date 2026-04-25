"""add record chunks

Revision ID: 20260425_0003
Revises: 20260423_0002
Create Date: 2026-04-25 00:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260425_0003"
down_revision = "20260423_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "record_chunks",
        sa.Column("clinic_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("record_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("content_hash", sa.String(length=128), nullable=True),
        sa.Column("chunk_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("embedding", postgresql.ARRAY(sa.Float()), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["clinic_id"], ["clinics.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["record_id"], ["records.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_record_chunks_clinic_id"), "record_chunks", ["clinic_id"], unique=False)
    op.create_index(op.f("ix_record_chunks_patient_id"), "record_chunks", ["patient_id"], unique=False)
    op.create_index(op.f("ix_record_chunks_record_id"), "record_chunks", ["record_id"], unique=False)
    op.create_index(
        "ix_record_chunks_record_id_chunk_index",
        "record_chunks",
        ["record_id", "chunk_index"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_record_chunks_record_id_chunk_index", table_name="record_chunks")
    op.drop_index(op.f("ix_record_chunks_record_id"), table_name="record_chunks")
    op.drop_index(op.f("ix_record_chunks_patient_id"), table_name="record_chunks")
    op.drop_index(op.f("ix_record_chunks_clinic_id"), table_name="record_chunks")
    op.drop_table("record_chunks")
