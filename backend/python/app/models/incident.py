from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.alert import Alert
    from app.models.incident_comment import IncidentComment
    from app.models.incident_event import IncidentEvent
    from app.models.service import Service
    from app.models.user import User


class Incident(Base):
    """Operational incident linked to a service and creating user."""

    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False, index=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    assigned_to_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    service: Mapped["Service"] = relationship(back_populates="incidents")
    created_by: Mapped["User"] = relationship(
        back_populates="created_incidents",
        foreign_keys=[created_by_id],
    )
    assigned_to: Mapped["User | None"] = relationship(
        back_populates="assigned_incidents",
        foreign_keys=[assigned_to_id],
    )
    alerts: Mapped[list["Alert"]] = relationship(
        back_populates="incident",
    )
    events: Mapped[list["IncidentEvent"]] = relationship(
        back_populates="incident",
    )
    comments: Mapped[list["IncidentComment"]] = relationship(
        back_populates="incident",
    )
