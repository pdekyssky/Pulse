from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.audit_log import AuditLog
    from app.models.incident import Incident
    from app.models.incident_comment import IncidentComment
    from app.models.incident_event import IncidentEvent
    from app.models.notification import Notification
    from app.models.service import Service


class User(Base):
    """Application user stored in the database."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
    )
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
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

    services: Mapped[list["Service"]] = relationship(
        back_populates="owner",
    )
    created_incidents: Mapped[list["Incident"]] = relationship(
        back_populates="created_by",
        foreign_keys="Incident.created_by_id",
    )
    assigned_incidents: Mapped[list["Incident"]] = relationship(
        back_populates="assigned_to",
        foreign_keys="Incident.assigned_to_id",
    )
    incident_events: Mapped[list["IncidentEvent"]] = relationship(
        back_populates="author",
    )
    incident_comments: Mapped[list["IncidentComment"]] = relationship(
        back_populates="author",
    )
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="user",
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        back_populates="user",
    )
