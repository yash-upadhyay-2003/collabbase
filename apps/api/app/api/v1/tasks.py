import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, require_project_role
from app.db.session import get_db
from app.models.project import Project
from app.models.project_member import ProjectRole
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.user import User
from app.schemas.task import PaginatedTasks, TaskCreate, TaskRead, TaskUpdate
from app.services.task import TaskService

router = APIRouter(
    prefix="/projects/{project_id}/tasks",
    tags=["tasks"],
)

# Shared membership guard — all task endpoints require at least MEMBER access
_any_member = require_project_role(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER)


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: uuid.UUID,
    payload: TaskCreate,
    _project: Project = Depends(_any_member),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskRead:
    task = await TaskService(db).create(project_id, payload, current_user)
    return TaskRead.model_validate(task)


@router.get("", response_model=PaginatedTasks)
async def list_tasks(
    project_id: uuid.UUID,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status_filter: TaskStatus | None = Query(None, alias="status"),
    priority_filter: TaskPriority | None = Query(None, alias="priority"),
    assigned_to: uuid.UUID | None = Query(None),
    _project: Project = Depends(_any_member),
    db: AsyncSession = Depends(get_db),
) -> PaginatedTasks:
    items, total = await TaskService(db).list_for_project(
        project_id, limit, offset, status_filter, priority_filter, assigned_to
    )
    return PaginatedTasks(
        items=[TaskRead.model_validate(t) for t in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    _project: Project = Depends(_any_member),
    db: AsyncSession = Depends(get_db),
) -> TaskRead:
    task = await TaskService(db).get_by_id_or_404(task_id, project_id)
    return TaskRead.model_validate(task)


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    payload: TaskUpdate,
    _project: Project = Depends(_any_member),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskRead:
    svc = TaskService(db)
    task = await svc.get_by_id_or_404(task_id, project_id)
    updated = await svc.update(task, payload, current_user)
    return TaskRead.model_validate(updated)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    _project: Project = Depends(_any_member),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    svc = TaskService(db)
    task = await svc.get_by_id_or_404(task_id, project_id)
    await svc.delete(task, current_user)
