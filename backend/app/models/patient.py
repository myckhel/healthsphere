from __future__ import annotations

import datetime as dt
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.appointment import Appointment
    from app.models.clinic import Clinic
    from app.models.consultation_session import ConsultationSession
    from app.models.record import Record
    from app.models.triage_case import TriageCase


class Patient(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "patients"

    clinic_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clinics.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    clerk_user_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    external_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[dt.date | None] = mapped_column(Date, nullable=True)
    sex_at_birth: Mapped[str | None] = mapped_column(String(32), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    consent_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    clinic: Mapped[Clinic | None] = relationship(back_populates="patients")
    appointments: Mapped[list[Appointment]] = relationship(back_populates="patient")
    consultation_sessions: Mapped[list[ConsultationSession]] = relationship(
        back_populates="patient"
    )
    records: Mapped[list[Record]] = relationship(back_populates="patient")
    triage_cases: Mapped[list[TriageCase]] = relationship(back_populates="patient")
