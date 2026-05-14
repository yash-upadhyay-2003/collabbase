import uuid
from collections.abc import Callable

from fastapi import Depends, HTTPException, Path, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.project_member import ProjectRole
from app.models.user import User
from app.services.user import UserService

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials:
        raise unauthorized
    try:
        user_id = decode_access_token(credentials.credentials)
    except JWTError:
        raise unauthorized

    user = await UserService(db).get_by_id(uuid.UUID(user_id))
    if not user:
        raise unauthorized
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive.")
    return user


def require_project_role(*roles: ProjectRole) -> Callable:
    """
    Dependency factory — returns a FastAPI dependency that:
    1. Resolves the project from the path param `project_id`
    2. Verifies the current user is a member with one of the given roles
    3. Returns the project (so routes don't need to re-fetch it)

    Usage:
        @router.patch("/{project_id}")
        async def update(
            project=Depends(require_project_role(ProjectRole.OWNER, ProjectRole.ADMIN)),
        ): ...
    """
    allowed = set(roles)

    async def _dependency(
        project_id: uuid.UUID = Path(...),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        from app.services.project import ProjectService  # local import avoids circular

        svc = ProjectService(db)
        project = await svc.get_by_id_or_404(project_id)
        membership = await svc.get_membership(project_id, current_user.id)

        if not membership or membership.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return project

    return _dependency
