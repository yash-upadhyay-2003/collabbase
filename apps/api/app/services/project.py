import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.project_member import ProjectMember, ProjectRole
from app.models.user import User
from app.schemas.project import AddMemberRequest, MemberWithUserRead, ProjectCreate, ProjectUpdate


class ProjectService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── queries ───────────────────────────────────────────────────

    async def get_by_id(self, project_id: uuid.UUID) -> Project | None:
        result = await self.db.execute(
            select(Project).where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id_or_404(self, project_id: uuid.UUID) -> Project:
        project = await self.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        return project

    async def get_membership(
        self, project_id: uuid.UUID, user_id: uuid.UUID
    ) -> ProjectMember | None:
        result = await self.db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_members(self, project_id: uuid.UUID) -> list[MemberWithUserRead]:
        rows = await self.db.execute(
            select(ProjectMember, User)
            .join(User, User.id == ProjectMember.user_id)
            .where(ProjectMember.project_id == project_id)
            .order_by(ProjectMember.joined_at)
        )
        return [
            MemberWithUserRead(
                user_id=pm.user_id,
                role=pm.role,
                joined_at=pm.joined_at,
                full_name=u.full_name,
                email=u.email,
            )
            for pm, u in rows.all()
        ]

    async def add_member_by_email(
        self, project_id: uuid.UUID, payload: AddMemberRequest, actor: User
    ) -> MemberWithUserRead:
        await self._require_role(project_id, actor.id, {ProjectRole.OWNER, ProjectRole.ADMIN})

        user_result = await self.db.execute(
            select(User).where(User.email == payload.email.strip().lower())
        )
        target = user_result.scalar_one_or_none()
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with that email address.",
            )
        existing = await self.get_membership(project_id, target.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already a member of this project.",
            )
        membership = ProjectMember(
            project_id=project_id,
            user_id=target.id,
            role=ProjectRole.MEMBER,
        )
        self.db.add(membership)
        await self.db.commit()
        await self.db.refresh(membership)
        return MemberWithUserRead(
            user_id=target.id,
            role=membership.role,
            joined_at=membership.joined_at,
            full_name=target.full_name,
            email=target.email,
        )

    async def list_for_user(
        self, user: User, limit: int, offset: int
    ) -> tuple[list[tuple[Project, int]], int]:
        """Returns list of (project, member_count) tuples and total count."""
        member_count_subq = (
            select(func.count(ProjectMember.id))
            .where(ProjectMember.project_id == Project.id)
            .correlate(Project)
            .scalar_subquery()
        )
        base = (
            select(Project, member_count_subq.label("member_count"))
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .where(ProjectMember.user_id == user.id)
        )
        total_result = await self.db.execute(
            select(func.count()).select_from(
                select(Project)
                .join(ProjectMember, ProjectMember.project_id == Project.id)
                .where(ProjectMember.user_id == user.id)
                .subquery()
            )
        )
        total = total_result.scalar_one()

        items_result = await self.db.execute(
            base.order_by(Project.created_at.desc()).limit(limit).offset(offset)
        )
        return list(items_result.all()), total

    # ── mutations ─────────────────────────────────────────────────

    async def create(self, payload: ProjectCreate, owner: User) -> Project:
        project = Project(
            name=payload.name,
            description=payload.description,
            created_by=owner.id,
        )
        self.db.add(project)
        await self.db.flush()

        membership = ProjectMember(
            project_id=project.id,
            user_id=owner.id,
            role=ProjectRole.OWNER,
        )
        self.db.add(membership)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def update(
        self, project: Project, payload: ProjectUpdate, actor: User
    ) -> Project:
        await self._require_role(project.id, actor.id, {ProjectRole.OWNER, ProjectRole.ADMIN})
        if payload.name is not None:
            project.name = payload.name
        if payload.description is not None:
            project.description = payload.description
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def delete(self, project: Project, actor: User) -> None:
        await self._require_role(project.id, actor.id, {ProjectRole.OWNER})
        await self.db.delete(project)
        await self.db.commit()

    # ── internal helpers ──────────────────────────────────────────

    async def _require_role(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        allowed: set[ProjectRole],
    ) -> ProjectMember:
        membership = await self.get_membership(project_id, user_id)
        if not membership or membership.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return membership
