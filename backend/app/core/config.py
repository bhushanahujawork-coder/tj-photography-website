from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "TJ Photography API"
    VERSION: str = "0.2.0"
    DEBUG: bool = False
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/tj_photography",
        description="PostgreSQL async connection string",
    )
    SECRET_KEY: str = Field(
        default="",
        description="Secret key for JWT signing. MUST be at least 32 characters in production.",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    OTP_EXPIRE_MINUTES: int = 5

    STORAGE_BACKEND: str = "local"
    STORAGE_LOCAL_PATH: str = "./storage"
    R2_ENDPOINT: str | None = None
    R2_ACCESS_KEY: str | None = None
    R2_SECRET_KEY: str | None = None
    R2_BUCKET: str | None = None

    UPLOAD_MAX_SIZE: int = 50 * 1024 * 1024
    ALLOWED_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".tiff"}
    IMAGE_SIZES: dict[str, str] = {"original": "", "medium": "1200", "thumbnail": "400"}

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"

    REDIS_URL: str = "redis://localhost:6379/0"

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "100/minute"

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        if info.data.get("ENVIRONMENT") == "production" and (not v or len(v) < 32):
            raise ValueError(
                "SECRET_KEY must be at least 32 characters long in production"
            )
        return v or "d09f8e7c6a5b4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0"

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str, info) -> str:
        if info.data.get("ENVIRONMENT") == "production":
            if "postgres:postgres" in v:
                raise ValueError(
                    "DATABASE_URL must use non-default credentials in production"
                )
        return v


settings = Settings()
