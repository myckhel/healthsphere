from __future__ import annotations

import datetime as dt
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.clinic import Clinic
    from app.models.patient import Patient


class Appointment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "appointments"

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
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    scheduled_start_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    scheduled_end_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    visit_reason: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(32), default="manual", nullable=False)
    external_reference: Mapped[str | None] = mapped_column(String(128), nullable=True)

    clinic: Mapped[Clinic | None] = relationship(back_populates="appointments")
    patient: Mapped[Patient] = relationship(back_populates="appointments")
