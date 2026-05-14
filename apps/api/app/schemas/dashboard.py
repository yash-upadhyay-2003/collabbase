from pydantic import BaseModel, Field, computed_field


class UserDashboardSummary(BaseModel):
    total_projects: int
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    overdue_tasks: int
    assigned_tasks: int

    @computed_field
    @property
    def completion_percentage(self) -> float:
        if self.total_tasks == 0:
            return 0.0
        return round(self.completed_tasks / self.total_tasks * 100, 1)


class ProjectAnalytics(BaseModel):
    total_tasks: int
    completed_tasks: int
    todo_tasks: int
    in_progress_tasks: int
    high_priority_tasks: int
    overdue_tasks: int
    member_count: int

    @computed_field
    @property
    def completion_percentage(self) -> float:
        if self.total_tasks == 0:
            return 0.0
        return round(self.completed_tasks / self.total_tasks * 100, 1)
