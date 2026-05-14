import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, require_project_role
from app.db.session import get_db
from app.models.project import Project
from app.models.project_member import ProjectRole
from app.models.user import User
from app.schemas.dashboard import ProjectAnalytics, UserDashboardSummary
from app.services.dashboard import DashboardService

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/summary", response_model=UserDashboardSummary)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserDashboardSummary:
    return await DashboardService(db).user_summary(current_user.id)


@router.get("/projects/{project_id}/analytics", response_model=ProjectAnalytics)
async def get_project_analytics(
    project_id: uuid.UUID,
    _project: Project = Depends(
        require_project_role(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER)
    ),
    db: AsyncSession = Depends(get_db),
) -> ProjectAnalytics:
    return await DashboardService(db).project_analytics(project_id)
