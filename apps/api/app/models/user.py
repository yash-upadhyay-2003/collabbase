from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    is_superuser: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    # ── relationships ────────────────────────────────────────────
    project_memberships: Mapped[list["ProjectMember"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    assigned_tasks: Mapped[list["Task"]] = relationship(  # noqa: F821
        back_populates="assignee", foreign_keys="Task.assigned_to"
    )
    created_tasks: Mapped[list["Task"]] = relationship(  # noqa: F821
        back_populates="creator", foreign_keys="Task.created_by"
    )
    created_projects: Mapped[list["Project"]] = relationship(  # noqa: F821
        back_populates="owner", foreign_keys="Project.created_by"
    )

    def __init__(self, **kw: object) -> None:
        if "email" in kw and isinstance(kw["email"], str):
            kw["email"] = kw["email"].strip().lower()
        super().__init__(**kw)
