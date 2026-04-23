from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.appointment import Appointment
    from app.models.patient import Patient
    from app.models.record import Record
    from app.models.triage_case import TriageCase


class Clinic(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "clinics"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country_code: Mapped[str] = mapped_column(String(2), default="NG", nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), default="Africa/Lagos", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    patients: Mapped[list["Patient"]] = relationship(back_populates="clinic")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="clinic")
    records: Mapped[list["Record"]] = relationship(back_populates="clinic")
    triage_cases: Mapped[list["TriageCase"]] = relationship(back_populates="clinic")
