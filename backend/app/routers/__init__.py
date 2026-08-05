from app.routers.auth import router as auth_router
from app.routers.weddings import router as weddings_router
from app.routers.albums import router as albums_router
from app.routers.folders import router as folders_router
from app.routers.photos import router as photos_router
from app.routers.participants import router as participants_router
from app.routers.uploads import router as uploads_router
from app.routers.downloads import router as downloads_router
from app.routers.activity import router as activity_router
from app.routers.notifications import router as notifications_router
from app.routers.users import router as users_router
from app.routers.settings import router as settings_router
from app.routers.dashboard import router as dashboard_router
from app.routers.permissions import router as permissions_router

__all__ = [
    "auth_router",
    "weddings_router",
    "albums_router",
    "folders_router",
    "photos_router",
    "participants_router",
    "uploads_router",
    "downloads_router",
    "activity_router",
    "notifications_router",
    "users_router",
    "settings_router",
    "dashboard_router",
    "permissions_router",
]
