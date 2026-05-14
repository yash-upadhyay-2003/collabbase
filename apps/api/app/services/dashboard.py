import uuid
from datetime import date

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project_member import ProjectMember
from app.models.task import Task, TaskPriority, TaskStatus
from app.schemas.dashboard import ProjectAnalytics, UserDashboardSummary


class DashboardService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def user_summary(self, user_id: uuid.UUID) -> UserDashboardSummary:
        today = date.today()

        # All tasks across projects the user is a member of
        member_project_ids = (
            select(ProjectMember.project_id)
            .where(ProjectMember.user_id == user_id)
            .scalar_subquery()
        )

        row = await self.db.execute(
            select(
                # distinct project count from memberships
                select(func.count())
                .select_from(ProjectMember)
                .where(ProjectMember.user_id == user_id)
                .scalar_subquery()
                .label("total_projects"),

                func.count(Task.id).label("total_tasks"),

                func.sum(
                    case((Task.status == TaskStatus.DONE, 1), else_=0)
                ).label("completed_tasks"),

                func.sum(
                    case((Task.status == TaskStatus.IN_PROGRESS, 1), else_=0)
                ).label("in_progress_tasks"),

                func.sum(
                    case(
                        (
                            (Task.due_date < today) & (Task.status != TaskStatus.DONE),
                            1,
                        ),
                        else_=0,
                    )
                ).label("overdue_tasks"),

                func.sum(
                    case((Task.assigned_to == user_id, 1), else_=0)
                ).label("assigned_tasks"),
            )
            .select_from(Task)
            .where(Task.project_id.in_(member_project_ids))
        )

        r = row.one()
        return UserDashboardSummary(
            total_projects=r.total_projects or 0,
            total_tasks=r.total_tasks or 0,
            completed_tasks=r.completed_tasks or 0,
            in_progress_tasks=r.in_progress_tasks or 0,
            overdue_tasks=r.overdue_tasks or 0,
            assigned_tasks=r.assigned_tasks or 0,
        )

    async def project_analytics(self, project_id: uuid.UUID) -> ProjectAnalytics:
        today = date.today()

        tasks_row = await self.db.execute(
            select(
                func.count(Task.id).label("total_tasks"),

                func.sum(
                    case((Task.status == TaskStatus.DONE, 1), else_=0)
                ).label("completed_tasks"),

                func.sum(
                    case((Task.status == TaskStatus.TODO, 1), else_=0)
                ).label("todo_tasks"),

                func.sum(
                    case((Task.status == TaskStatus.IN_PROGRESS, 1), else_=0)
                ).label("in_progress_tasks"),

                func.sum(
                    case((Task.priority == TaskPriority.HIGH, 1), else_=0)
                ).label("high_priority_tasks"),

                func.sum(
                    case(
                        (
                            (Task.due_date < today) & (Task.status != TaskStatus.DONE),
                            1,
                        ),
                        else_=0,
                    )
                ).label("overdue_tasks"),
            )
            .where(Task.project_id == project_id)
        )

        member_count_row = await self.db.execute(
            select(func.count())
            .select_from(ProjectMember)
            .where(ProjectMember.project_id == project_id)
        )

        t = tasks_row.one()
        return ProjectAnalytics(
            total_tasks=t.total_tasks or 0,
            completed_tasks=t.completed_tasks or 0,
            todo_tasks=t.todo_tasks or 0,
            in_progress_tasks=t.in_progress_tasks or 0,
            high_priority_tasks=t.high_priority_tasks or 0,
            overdue_tasks=t.overdue_tasks or 0,
            member_count=member_count_row.scalar_one() or 0,
        )
