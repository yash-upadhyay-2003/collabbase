import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project_member import ProjectMember, ProjectRole
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate


class TaskService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── queries ───────────────────────────────────────────────────

    async def get_by_id(self, task_id: uuid.UUID, project_id: uuid.UUID) -> Task | None:
        result = await self.db.execute(
            select(Task).where(Task.id == task_id, Task.project_id == project_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id_or_404(self, task_id: uuid.UUID, project_id: uuid.UUID) -> Task:
        task = await self.get_by_id(task_id, project_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
        return task

    async def list_for_project(
        self,
        project_id: uuid.UUID,
        limit: int,
        offset: int,
        filter_status: TaskStatus | None,
        filter_priority: TaskPriority | None,
        filter_assigned_to: uuid.UUID | None,
    ) -> tuple[list[Task], int]:
        base = select(Task).where(Task.project_id == project_id)

        if filter_status is not None:
            base = base.where(Task.status == filter_status)
        if filter_priority is not None:
            base = base.where(Task.priority == filter_priority)
        if filter_assigned_to is not None:
            base = base.where(Task.assigned_to == filter_assigned_to)

        total_result = await self.db.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = total_result.scalar_one()

        items_result = await self.db.execute(
            base.order_by(Task.created_at.desc()).limit(limit).offset(offset)
        )
        return list(items_result.scalars().all()), total

    # ── mutations ─────────────────────────────────────────────────

    async def create(
        self, project_id: uuid.UUID, payload: TaskCreate, creator: User
    ) -> Task:
        if payload.assigned_to is not None:
            await self._validate_assignee(project_id, payload.assigned_to)

        task = Task(
            title=payload.title,
            description=payload.description,
            status=payload.status,
            priority=payload.priority,
            due_date=payload.due_date,
            project_id=project_id,
            assigned_to=payload.assigned_to,
            created_by=creator.id,
        )
        self.db.add(task)
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def update(
        self, task: Task, payload: TaskUpdate, actor: User
    ) -> Task:
        membership = await self._get_membership(task.project_id, actor.id)

        is_admin_or_owner = (
            membership is not None
            and membership.role in {ProjectRole.OWNER, ProjectRole.ADMIN}
        )
        is_assignee = task.assigned_to == actor.id

        if not is_admin_or_owner and not is_assignee:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the task assignee, project ADMIN, or OWNER can update this task.",
            )

        if is_admin_or_owner:
            # Full update — validate assignee change if present
            if payload.assigned_to is not None:
                await self._validate_assignee(task.project_id, payload.assigned_to)
            for field, value in payload.model_dump(exclude_unset=True).items():
                setattr(task, field, value)
        else:
            # Assignee-only update — status field only
            if payload.status is not None:
                task.status = payload.status

        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def delete(self, task: Task, actor: User) -> None:
        await self._require_admin_or_owner(task.project_id, actor.id)
        await self.db.delete(task)
        await self.db.commit()

    # ── internal helpers ──────────────────────────────────────────

    async def _get_membership(
        self, project_id: uuid.UUID, user_id: uuid.UUID
    ) -> ProjectMember | None:
        result = await self.db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def _validate_assignee(
        self, project_id: uuid.UUID, assignee_id: uuid.UUID
    ) -> None:
        membership = await self._get_membership(project_id, assignee_id)
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Assignee is not a member of this project.",
            )

    async def _require_admin_or_owner(
        self, project_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        membership = await self._get_membership(project_id, user_id)
        if not membership or membership.role not in {ProjectRole.OWNER, ProjectRole.ADMIN}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only project OWNER or ADMIN can perform this action.",
            )
