from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, verify_password
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserCreate, UserRead
from app.services.user import UserService


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.users = UserService(db)

    async def register(self, payload: RegisterRequest) -> UserRead:
        if await self.users.get_by_email(payload.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        user = await self.users.create(
            UserCreate(
                full_name=payload.full_name,
                email=payload.email,
                password=payload.password,
            )
        )
        return UserRead.model_validate(user)

    async def authenticate(self, payload: LoginRequest) -> TokenResponse:
        user = await self.users.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive.",
            )
        return TokenResponse(access_token=create_access_token(str(user.id)))
