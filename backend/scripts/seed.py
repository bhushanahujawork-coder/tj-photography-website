"""Seed script to populate the database with development mock data."""

import asyncio
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import engine, AsyncSessionLocal, Base
from app.core.security import hash_password
from app.models import (
    User, Wedding, Album, Folder, Photo, Participant,
    Activity, Notification, Download, ShareLink, Session,
    StorageUsage, UserRole, WeddingStatus, WeddingVisibility,
    FolderVisibility, ParticipantStatus, ActivityType,
    NotificationType, DownloadType, DownloadStatus,
)


async def seed_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_users(session)
        await seed_weddings(session)
        await seed_albums(session)
        await seed_folders(session)
        await seed_photos(session)
        await seed_participants(session)
        await seed_activity(session)
        await seed_notifications(session)
        await seed_downloads(session)
        await seed_share_links(session)
        await seed_storage_usage(session)
        await session.commit()
        print("Database seeded successfully!")


async def seed_users(session: AsyncSession):
    users = [
        User(
            id="usr-1", name="TJ", email="tj@tjphotography.com",
            phone="+1 (555) 100-0001", role=UserRole.ADMIN.value,
            password_hash=hash_password("Password123"),
            created_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
        ),
        User(
            id="usr-2", name="Sarah Johnson", email="sarah@tjphotography.com",
            phone="+1 (555) 100-0002", role=UserRole.PHOTOGRAPHER.value,
            password_hash=hash_password("Password123"),
            created_at=datetime(2024, 1, 15, tzinfo=timezone.utc),
        ),
        User(
            id="usr-3", name="Mike Chen", email="mike@tjphotography.com",
            role=UserRole.EDITOR.value,
            password_hash=hash_password("Password123"),
            created_at=datetime(2024, 2, 1, tzinfo=timezone.utc),
        ),
        User(
            id="usr-4", name="Emily & James", email="emily.james@example.com",
            phone="+1 (555) 200-0001", role=UserRole.CLIENT.value,
            password_hash=hash_password("Password123"),
            created_at=datetime(2024, 3, 1, tzinfo=timezone.utc),
        ),
    ]
    session.add_all(users)
    await session.flush()
    print(f"Seeded {len(users)} users")


async def seed_weddings(session: AsyncSession):
    weddings = [
        Wedding(
            id="wed-1", wedding_name="Sunset Elegance",
            bride_name="Sophia", groom_name="Alexander",
            wedding_date=datetime(2024, 6, 15, tzinfo=timezone.utc),
            location="Tuscany, Italy",
            wedding_code="SUNSET24", status=WeddingStatus.ACTIVE.value,
            visibility=WeddingVisibility.PUBLIC.value,
            created_at=datetime(2024, 1, 10, tzinfo=timezone.utc),
            updated_at=datetime(2024, 6, 16, tzinfo=timezone.utc),
            photographer_id="usr-1",
        ),
        Wedding(
            id="wed-2", wedding_name="Golden Hour Romance",
            bride_name="Isabella", groom_name="Benjamin",
            wedding_date=datetime(2024, 8, 20, tzinfo=timezone.utc),
            location="Santorini, Greece",
            wedding_code="GOLDEN20", status=WeddingStatus.ACTIVE.value,
            visibility=WeddingVisibility.PUBLIC.value,
            created_at=datetime(2024, 3, 5, tzinfo=timezone.utc),
            updated_at=datetime(2024, 8, 21, tzinfo=timezone.utc),
            photographer_id="usr-2",
        ),
        Wedding(
            id="wed-3", wedding_name="Winter Whispers",
            bride_name="Charlotte", groom_name="Daniel",
            wedding_date=datetime(2024, 12, 5, tzinfo=timezone.utc),
            location="Aspen, Colorado",
            wedding_code="WINTER05", status=WeddingStatus.ACTIVE.value,
            visibility=WeddingVisibility.PRIVATE.value,
            created_at=datetime(2024, 9, 1, tzinfo=timezone.utc),
            updated_at=datetime(2024, 12, 6, tzinfo=timezone.utc),
            photographer_id="usr-1",
        ),
        Wedding(
            id="wed-4", wedding_name="Garden Serenade",
            bride_name="Amelia", groom_name="Ethan",
            wedding_date=datetime(2025, 3, 10, tzinfo=timezone.utc),
            location="Cotswolds, England",
            wedding_code="GARDEN10", status=WeddingStatus.DRAFT.value,
            visibility=WeddingVisibility.PRIVATE.value,
            created_at=datetime(2024, 11, 1, tzinfo=timezone.utc),
            updated_at=datetime(2024, 11, 15, tzinfo=timezone.utc),
            photographer_id="usr-2",
        ),
        Wedding(
            id="wed-5", wedding_name="Coastal Dreams",
            bride_name="Olivia", groom_name="William",
            wedding_date=datetime(2024, 9, 28, tzinfo=timezone.utc),
            location="Amalfi Coast, Italy",
            wedding_code="COAST28", status=WeddingStatus.ACTIVE.value,
            visibility=WeddingVisibility.PUBLIC.value,
            created_at=datetime(2024, 5, 15, tzinfo=timezone.utc),
            updated_at=datetime(2024, 9, 29, tzinfo=timezone.utc),
            photographer_id="usr-1",
        ),
        Wedding(
            id="wed-6", wedding_name="Vintage Charm",
            bride_name="Ella", groom_name="James",
            wedding_date=datetime(2024, 4, 12, tzinfo=timezone.utc),
            location="Provence, France",
            wedding_code="VINTAGE12", status=WeddingStatus.ARCHIVED.value,
            visibility=WeddingVisibility.PRIVATE.value,
            created_at=datetime(2024, 1, 20, tzinfo=timezone.utc),
            updated_at=datetime(2024, 4, 13, tzinfo=timezone.utc),
            photographer_id="usr-1",
        ),
    ]
    session.add_all(weddings)
    await session.flush()
    print(f"Seeded {len(weddings)} weddings")


async def seed_albums(session: AsyncSession):
    albums = [
        Album(id="album-1", wedding_id="wed-1", name="Ceremony",
              description="The beautiful ceremony", photo_count=8,
              created_at=datetime(2024, 6, 15, 10, 0, tzinfo=timezone.utc)),
        Album(id="album-2", wedding_id="wed-1", name="Reception",
              description="Evening celebration", photo_count=12,
              created_at=datetime(2024, 6, 15, 14, 0, tzinfo=timezone.utc)),
        Album(id="album-3", wedding_id="wed-1", name="Portraits",
              description="Couple portraits", photo_count=6,
              created_at=datetime(2024, 6, 15, 8, 0, tzinfo=timezone.utc)),
        Album(id="album-4", wedding_id="wed-2", name="Getting Ready",
              photo_count=10,
              created_at=datetime(2024, 8, 20, 6, 0, tzinfo=timezone.utc)),
        Album(id="album-5", wedding_id="wed-2", name="First Dance",
              photo_count=5,
              created_at=datetime(2024, 8, 20, 20, 0, tzinfo=timezone.utc)),
    ]
    session.add_all(albums)
    await session.flush()
    print(f"Seeded {len(albums)} albums")


async def seed_folders(session: AsyncSession):
    folders = [
        Folder(id="folder-1", wedding_id="wed-1", name="Raw Edits",
               photo_count=10, sort_order=1, visibility=FolderVisibility.PRIVATE.value,
               created_at=datetime(2024, 6, 10, tzinfo=timezone.utc)),
        Folder(id="folder-2", wedding_id="wed-1", name="Final Selections",
               photo_count=15, sort_order=2, visibility=FolderVisibility.PUBLIC.value,
               created_at=datetime(2024, 6, 10, tzinfo=timezone.utc)),
        Folder(id="folder-3", wedding_id="wed-1", name="BTS",
               photo_count=8, sort_order=3, visibility=FolderVisibility.HIDDEN.value,
               created_at=datetime(2024, 6, 10, tzinfo=timezone.utc)),
        Folder(id="folder-4", wedding_id="wed-2", name="Ceremony",
               photo_count=20, sort_order=1, visibility=FolderVisibility.PUBLIC.value,
               created_at=datetime(2024, 8, 18, tzinfo=timezone.utc)),
        Folder(id="folder-5", wedding_id="wed-2", name="Details",
               photo_count=6, sort_order=2, visibility=FolderVisibility.PUBLIC.value,
               created_at=datetime(2024, 8, 18, tzinfo=timezone.utc)),
    ]
    session.add_all(folders)
    await session.flush()
    print(f"Seeded {len(folders)} folders")


async def seed_photos(session: AsyncSession):
    now = datetime.now(timezone.utc)
    photos = []
    for i in range(50):
        wedding_id = "wed-1" if i < 20 else "wed-2" if i < 35 else "wed-5"
        folder_id = None
        if i < 10:
            folder_id = "folder-1"
        elif i < 20:
            folder_id = "folder-2"
        album_id = "album-1" if i < 8 else None
        photos.append(Photo(
            id=f"photo-{i + 1}",
            wedding_id=wedding_id,
            filename=f"photo_{i + 1}.jpg",
            original_path=f"originals/photo_{i + 1}.jpg",
            medium_path=f"medium/photo_{i + 1}.jpg",
            thumbnail_path=f"thumbnails/photo_{i + 1}.jpg",
            alt_text=f"Wedding photo {i + 1}",
            favorite=i < 5,
            is_highlight=i < 3,
            folder_id=folder_id,
            album_id=album_id,
            created_at=now - timedelta(days=i),
        ))
    session.add_all(photos)
    await session.flush()
    print(f"Seeded {len(photos)} photos")


async def seed_participants(session: AsyncSession):
    participants = [
        Participant(id="part-1", wedding_id="wed-1", user_id="usr-4",
                    name="Emily & James", email="emily.james@example.com",
                    role="client", status=ParticipantStatus.ACCEPTED.value,
                    invited_at=datetime(2024, 1, 15, tzinfo=timezone.utc)),
        Participant(id="part-2", wedding_id="wed-1",
                    name="Lisa Parker", email="lisa@example.com",
                    role="guest", status=ParticipantStatus.PENDING.value,
                    invited_at=datetime(2024, 5, 1, tzinfo=timezone.utc)),
        Participant(id="part-3", wedding_id="wed-1",
                    name="Tom Parker", email="tom@example.com",
                    role="guest", status=ParticipantStatus.ACCEPTED.value,
                    invited_at=datetime(2024, 5, 1, tzinfo=timezone.utc)),
        Participant(id="part-4", wedding_id="wed-2",
                    name="Maria Santos", email="maria@example.com",
                    role="client", status=ParticipantStatus.ACCEPTED.value,
                    invited_at=datetime(2024, 4, 1, tzinfo=timezone.utc)),
        Participant(id="part-5", wedding_id="wed-2",
                    name="David Kim", email="david@example.com",
                    role="editor", status=ParticipantStatus.PENDING.value,
                    invited_at=datetime(2024, 7, 1, tzinfo=timezone.utc)),
        Participant(id="part-6", wedding_id="wed-3",
                    name="Rachel Green", email="rachel@example.com",
                    role="client", status=ParticipantStatus.ACCEPTED.value,
                    invited_at=datetime(2024, 10, 1, tzinfo=timezone.utc)),
    ]
    session.add_all(participants)
    await session.flush()
    print(f"Seeded {len(participants)} participants")


async def seed_activity(session: AsyncSession):
    now = datetime.now(timezone.utc)
    activities = [
        Activity(id="act-1", action="Uploaded photos",
                 description="24 photos uploaded to Sunset Elegance",
                 user_id="usr-1", wedding_id="wed-1",
                 created_at=now - timedelta(minutes=10),
                 type=ActivityType.UPLOAD.value),
        Activity(id="act-2", action="Shared gallery",
                 description="Shared Sunset Elegance with Emily & James",
                 user_id="usr-1", wedding_id="wed-1",
                 created_at=now - timedelta(minutes=30),
                 type=ActivityType.SHARE.value),
        Activity(id="act-3", action="Downloaded photos",
                 description="12 photos downloaded as ZIP",
                 user_id="usr-4", wedding_id="wed-1",
                 created_at=now - timedelta(hours=1),
                 type=ActivityType.DOWNLOAD.value),
        Activity(id="act-4", action="Created wedding",
                 description="Winter Whispers wedding created",
                 user_id="usr-1", wedding_id="wed-3",
                 created_at=now - timedelta(days=1),
                 type=ActivityType.CREATE.value),
        Activity(id="act-5", action="Edited album",
                 description="Updated Ceremony album cover",
                 user_id="usr-2", wedding_id="wed-1",
                 created_at=now - timedelta(days=2),
                 type=ActivityType.EDIT.value),
        Activity(id="act-6", action="Invited participant",
                 description="Invited Lisa Parker to Sunset Elegance",
                 user_id="usr-1", wedding_id="wed-1",
                 created_at=now - timedelta(days=3),
                 type=ActivityType.INVITE.value),
        Activity(id="act-7", action="Deleted photos",
                 description="3 photos removed from Raw Edits",
                 user_id="usr-2", wedding_id="wed-1",
                 created_at=now - timedelta(days=4),
                 type=ActivityType.DELETE.value),
        Activity(id="act-8", action="User logged in",
                 description="Mike Chen logged in from Chrome on Windows",
                 user_id="usr-3",
                 created_at=now - timedelta(days=5),
                 type=ActivityType.LOGIN.value),
        Activity(id="act-9", action="Created album",
                 description="First Dance album created for Golden Hour Romance",
                 user_id="usr-2", wedding_id="wed-2",
                 created_at=now - timedelta(days=6),
                 type=ActivityType.CREATE.value),
        Activity(id="act-10", action="Downloaded photos",
                 description="Bulk download of 48 photos",
                 user_id="usr-4", wedding_id="wed-1",
                 created_at=now - timedelta(days=7),
                 type=ActivityType.DOWNLOAD.value),
        Activity(id="act-11", action="Updated settings",
                 description="Changed watermark position to bottom-right",
                 user_id="usr-1",
                 created_at=now - timedelta(days=8),
                 type=ActivityType.EDIT.value),
        Activity(id="act-12", action="Uploaded photos",
                 description="56 photos uploaded to Coastal Dreams",
                 user_id="usr-1", wedding_id="wed-5",
                 created_at=now - timedelta(days=9),
                 type=ActivityType.UPLOAD.value),
    ]
    session.add_all(activities)
    await session.flush()
    print(f"Seeded {len(activities)} activity logs")


async def seed_notifications(session: AsyncSession):
    now = datetime.now(timezone.utc)
    notifications = [
        Notification(id="notif-1", user_id="usr-1", title="Upload complete",
                     description="24 photos uploaded to Sunset Elegance gallery",
                     type=NotificationType.SUCCESS.value, read=False,
                     created_at=now - timedelta(minutes=10),
                     link="/weddings/wed-1/gallery"),
        Notification(id="notif-2", user_id="usr-1", title="New download",
                     description="Emily & James downloaded 12 photos",
                     type=NotificationType.INFO.value, read=False,
                     created_at=now - timedelta(hours=1),
                     link="/downloads"),
        Notification(id="notif-3", user_id="usr-1", title="Participant joined",
                     description="Lisa Parker accepted invitation to Sunset Elegance",
                     type=NotificationType.SUCCESS.value, read=False,
                     created_at=now - timedelta(hours=2),
                     link="/participants"),
        Notification(id="notif-4", user_id="usr-1", title="Storage warning",
                     description="You have used 85% of your storage limit",
                     type=NotificationType.WARNING.value, read=True,
                     created_at=now - timedelta(days=1),
                     link="/storage"),
        Notification(id="notif-5", user_id="usr-2", title="Gallery shared",
                     description="Winter Whispers gallery shared via link",
                     type=NotificationType.INFO.value, read=True,
                     created_at=now - timedelta(days=2)),
        Notification(id="notif-6", user_id="usr-1", title="New client registration",
                     description="Rachel Green registered as a client",
                     type=NotificationType.INFO.value, read=True,
                     created_at=now - timedelta(days=3),
                     link="/participants"),
    ]
    session.add_all(notifications)
    await session.flush()
    print(f"Seeded {len(notifications)} notifications")


async def seed_downloads(session: AsyncSession):
    now = datetime.now(timezone.utc)
    downloads = [
        Download(id="dl-1", wedding_id="wed-1", name="Sunset_Elegance_ZIP",
                 user_id="usr-4", type=DownloadType.ZIP.value,
                 photo_count=24, total_size=156_000_000,
                 created_at=now - timedelta(hours=1), status=DownloadStatus.COMPLETED.value),
        Download(id="dl-2", wedding_id="wed-1", name="Single_photo",
                 type=DownloadType.SINGLE.value, photo_count=3, total_size=18_000_000,
                 created_at=now - timedelta(hours=2), status=DownloadStatus.COMPLETED.value),
        Download(id="dl-3", wedding_id="wed-2", name="Golden_Hour_Bulk",
                 user_id="usr-4", type=DownloadType.BULK.value,
                 photo_count=48, total_size=312_000_000,
                 created_at=now - timedelta(days=1), status=DownloadStatus.COMPLETED.value),
        Download(id="dl-4", wedding_id="wed-5", name="Coastal_Select",
                 type=DownloadType.MULTIPLE.value, photo_count=12, total_size=78_000_000,
                 created_at=now - timedelta(days=2), status=DownloadStatus.COMPLETED.value),
        Download(id="dl-5", wedding_id="wed-1", name="Sunset_ZIP_retry",
                 type=DownloadType.ZIP.value, photo_count=24, total_size=156_000_000,
                 created_at=now - timedelta(days=3), status=DownloadStatus.FAILED.value),
        Download(id="dl-6", wedding_id="wed-3", name="Winter_single",
                 user_id="usr-4", type=DownloadType.SINGLE.value,
                 photo_count=1, total_size=6_000_000,
                 created_at=now - timedelta(days=4), status=DownloadStatus.PROCESSING.value),
        Download(id="dl-7", wedding_id="wed-2", name="Golden_Hour_ZIP",
                 type=DownloadType.ZIP.value, photo_count=56, total_size=420_000_000,
                 created_at=now - timedelta(days=5), status=DownloadStatus.COMPLETED.value),
    ]
    session.add_all(downloads)
    await session.flush()
    print(f"Seeded {len(downloads)} downloads")


async def seed_share_links(session: AsyncSession):
    now = datetime.now(timezone.utc)
    share_links = [
        ShareLink(id="sl-1", wedding_id="wed-1", code="SUNSET24",
                  role="client", download_enabled=True,
                  created_at=now - timedelta(days=30), access_count=47),
        ShareLink(id="sl-2", wedding_id="wed-1", code="SUNSET-GUEST",
                  role="guest", download_enabled=False,
                  expires_at=now + timedelta(days=30),
                  created_at=now - timedelta(days=7), access_count=12),
        ShareLink(id="sl-3", wedding_id="wed-2", code="GOLDEN20",
                  role="client", download_enabled=True,
                  created_at=now - timedelta(days=60), access_count=89),
        ShareLink(id="sl-4", wedding_id="wed-5", code="COAST28",
                  role="editor", download_enabled=True,
                  expires_at=now + timedelta(days=14),
                  created_at=now - timedelta(days=3), access_count=5),
    ]
    session.add_all(share_links)
    await session.flush()
    print(f"Seeded {len(share_links)} share links")


async def seed_storage_usage(session: AsyncSession):
    usage = StorageUsage(
        id="su-1", user_id="usr-1",
        total_bytes=247_800_000_000,
        photo_count=1423, video_count=24,
    )
    session.add(usage)
    await session.flush()
    print("Seeded storage usage")


if __name__ == "__main__":
    asyncio.run(seed_database())
