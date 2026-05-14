import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, require_project_role
from app.db.session import get_db
from app.models.project import Project
from app.models.project_member import ProjectRole
from app.models.user import User
from app.schemas.project import (
    AddMemberRequest,
    MemberWithUserRead,
    PaginatedProjects,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
)
from app.services.project import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectRead:
    project = await ProjectService(db).create(payload, current_user)
    return ProjectRead(
        id=project.id,
        name=project.name,
        description=project.description,
        created_by=project.created_by,
        member_count=1,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.get("", response_model=PaginatedProjects)
async def list_projects(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedProjects:
    rows, total = await ProjectService(db).list_for_user(current_user, limit, offset)
    return PaginatedProjects(
        items=[
            ProjectRead(
                id=project.id,
                name=project.name,
                description=project.description,
                created_by=project.created_by,
                member_count=member_count,
                created_at=project.created_at,
                updated_at=project.updated_at,
            )
            for project, member_count in rows
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project: Project = Depends(require_project_role(
        ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER
    )),
) -> ProjectRead:
    return ProjectRead.model_validate(project)


@router.get("/{project_id}/members", response_model=list[MemberWithUserRead])
async def list_members(
    project_id: uuid.UUID,
    _project: Project = Depends(require_project_role(
        ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER
    )),
    db: AsyncSession = Depends(get_db),
) -> list[MemberWithUserRead]:
    return await ProjectService(db).list_members(project_id)


@router.post("/{project_id}/members", response_model=MemberWithUserRead, status_code=status.HTTP_201_CREATED)
async def add_member(
    project_id: uuid.UUID,
    payload: AddMemberRequest,
    _project: Project = Depends(require_project_role(
        ProjectRole.OWNER, ProjectRole.ADMIN
    )),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MemberWithUserRead:
    return await ProjectService(db).add_member_by_email(project_id, payload, current_user)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    payload: ProjectUpdate,
    project: Project = Depends(require_project_role(
        ProjectRole.OWNER, ProjectRole.ADMIN
    )),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectRead:
    updated = await ProjectService(db).update(project, payload, current_user)
    return ProjectRead.model_validate(updated)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project: Project = Depends(require_project_role(ProjectRole.OWNER)),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await ProjectService(db).delete(project, current_user)
