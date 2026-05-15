from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "CollabBase API"
    ENV: str = "development"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()

if settings.DATABASE_URL.startswith("postgresql://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace(
        "postgresql://",
        "postgresql+asyncpg://",
        1,
    )