from __future__ import annotations

import datetime as dt
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.clinic import Clinic
    from app.models.patient import Patient
    from app.models.triage_case import TriageCase


class ConsultationSession(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "consultation_sessions"

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
    triage_case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("triage_cases.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(32), default="ready", nullable=False)
    clinician_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    clinician_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    next_action: Mapped[str | None] = mapped_column(String(64), nullable=True)
    draft_note: Mapped[dict[str, object] | None] = mapped_column(JSONB, nullable=True)
    started_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    clinic: Mapped[Clinic | None] = relationship(back_populates="consultation_sessions")
    patient: Mapped[Patient] = relationship(back_populates="consultation_sessions")
    triage_case: Mapped[TriageCase | None] = relationship(back_populates="consultation_sessions")
