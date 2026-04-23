from __future__ import annotations

import datetime as dt
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pgvector.sqlalchemy import Vector

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.clinic import Clinic
    from app.models.patient import Patient


class Record(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "records"

    clinic_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clinics.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    record_type: Mapped[str] = mapped_column(String(64), nullable=False)
    source: Mapped[str] = mapped_column(String(32), default="manual", nullable=False)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    structured_data: Mapped[dict[str, object] | None] = mapped_column(JSONB, nullable=True)
    provenance: Mapped[dict[str, object] | None] = mapped_column(JSONB, nullable=True)
    review_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    reviewed_by: Mapped[str | None] = mapped_column(String(128), nullable=True)
    reviewed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(1536), nullable=True)

    clinic: Mapped[Clinic | None] = relationship(back_populates="records")
    patient: Mapped[Patient] = relationship(back_populates="records")
