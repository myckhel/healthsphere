from __future__ import annotations

import datetime as dt
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.clinic import Clinic
    from app.models.consultation_session import ConsultationSession
    from app.models.patient import Patient


class TriageCase(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "triage_cases"

    clinic_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clinics.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    patient_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    source: Mapped[str] = mapped_column(String(32), default="intake", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="open", nullable=False)
    urgency_level: Mapped[str] = mapped_column(String(32), default="routine", nullable=False)
    presenting_complaint: Mapped[str] = mapped_column(Text, nullable=False)
    symptoms: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    recommended_queue: Mapped[str | None] = mapped_column(String(64), nullable=True)
    recommended_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_output: Mapped[dict[str, object] | None] = mapped_column(JSONB, nullable=True)
    review_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    reviewed_by: Mapped[str | None] = mapped_column(String(128), nullable=True)
    reviewed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    clinic: Mapped[Clinic | None] = relationship(back_populates="triage_cases")
    consultation_sessions: Mapped[list[ConsultationSession]] = relationship(
        back_populates="triage_case"
    )
    patient: Mapped[Patient | None] = relationship(back_populates="triage_cases")
