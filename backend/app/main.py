from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.core.errors import AppError, app_error_handler, global_exception_handler
from app.core.logging import setup_logging
from app.core.middleware import register_middleware
from app.core.rate_limit import register_rate_limit
from app.routers import (
    auth_router, weddings_router, albums_router, folders_router,
    photos_router, participants_router, uploads_router, downloads_router,
    activity_router, notifications_router, users_router, settings_router,
    dashboard_router, permissions_router,
)

logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting TJ Photography API v%s...", settings.VERSION)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")
    yield
    await engine.dispose()
    logger.info("Engine disposed")


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for TJ Photography — AI Wedding Gallery Platform. "
    "Provides authentication, wedding/album/folder/photo management, "
    "participant invitations, file uploads, downloads, activity logging, "
    "notifications, and role-based permissions.",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else "/docs",
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
    contact={
        "name": "TJ Photography",
        "url": "https://tjphotography.com",
    },
    license_info={
        "name": "Proprietary",
    },
)

register_middleware(app)
register_rate_limit(app)

import os as _os
_storage_path = _os.path.abspath(settings.STORAGE_LOCAL_PATH)
_os.makedirs(_storage_path, exist_ok=True)
app.mount("/storage", StaticFiles(directory=_storage_path), name="storage")

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, global_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Response-Time-Ms"],
)

app.include_router(auth_router)
app.include_router(weddings_router)
app.include_router(albums_router)
app.include_router(folders_router)
app.include_router(photos_router)
app.include_router(participants_router)
app.include_router(uploads_router)
app.include_router(downloads_router)
app.include_router(activity_router)
app.include_router(notifications_router)
app.include_router(users_router)
app.include_router(settings_router)
app.include_router(dashboard_router)
app.include_router(permissions_router)


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
    }


@app.get("/health/ready", tags=["System"])
async def readiness_check():
    try:
        async with engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "version": settings.VERSION,
        }
    except Exception as e:
        return __import__("fastapi").responses.JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "database": "disconnected",
                "detail": str(e),
            },
        )


@app.get("/health/live", tags=["System"])
async def liveness_check():
    return {
        "status": "alive",
        "version": settings.VERSION,
    }
