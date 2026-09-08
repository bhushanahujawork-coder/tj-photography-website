"""Upload validation security tests (Part 12-A: F-06, F-07, F-08, F-09)."""

import io

import pytest
from httpx import AsyncClient
from PIL import Image

from app.core.errors import ValidationError
from app.services import image_service
from app.services.image_service import _sniff_format


def _jpeg_bytes(size: tuple[int, int] = (800, 800), quality: int = 80) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, (180, 40, 40))
    img.save(buf, format="JPEG", quality=quality)
    return buf.getvalue()


def _png_bytes(size: tuple[int, int] = (64, 64)) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, (20, 120, 200))
    img.save(buf, format="PNG")
    return buf.getvalue()


async def _create_wedding(client: AsyncClient, headers: dict) -> str:
    resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Upload Security",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
            "location": "Test Location",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def _init_upload(client: AsyncClient, headers: dict, wedding_id: str, name: str, size: int):
    resp = await client.post(
        "/api/v1/upload/init",
        json={"wedding_id": wedding_id, "files": [{"name": name, "size": size, "content_type": "image/jpeg"}]},
        headers=headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    return data["upload_id"], data["files"][0]


async def _upload_file(client: AsyncClient, headers: dict, upload_id: str, file_id: str, name: str, data: bytes):
    return await client.post(
        f"/api/v1/upload/{upload_id}/files/{file_id}",
        files={"file": (name, data, "image/jpeg")},
        headers=headers,
    )


@pytest.mark.asyncio
async def test_upload_jpeg_success(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    wedding_id = await _create_wedding(client, headers)
    raw = _jpeg_bytes()
    upload_id, alloc = await _init_upload(client, headers, wedding_id, "photo.jpg", len(raw))

    resp = await _upload_file(client, headers, upload_id, alloc["file_id"], "photo.jpg", raw)
    assert resp.status_code == 201
    data = resp.json()
    assert data["original_url"] == f"/api/v1/media/photos/{data['id']}/content?size=original"
    assert data["medium_url"].startswith(f"/api/v1/media/photos/{data['id']}/content")
    assert data["medium_url"].endswith("size=medium")
    assert data["thumbnail_url"].endswith("size=thumbnail")
    assert data["width"] == 800
    assert data["height"] == 800
    assert data["file_size"] == len(raw)


@pytest.mark.asyncio
async def test_upload_size_exceeded_rejected(
    client: AsyncClient, test_users, admin_token, monkeypatch
):
    from app.routers import uploads as uploads_router

    monkeypatch.setattr(uploads_router.settings, "UPLOAD_MAX_SIZE", 5000)

    headers = {"Authorization": f"Bearer {admin_token}"}
    wedding_id = await _create_wedding(client, headers)
    raw = _jpeg_bytes(size=(1200, 1200), quality=95)
    assert len(raw) > 5000
    upload_id, alloc = await _init_upload(client, headers, wedding_id, "big.jpg", len(raw))

    resp = await _upload_file(client, headers, upload_id, alloc["file_id"], "big.jpg", raw)
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "validation_error"


@pytest.mark.asyncio
async def test_upload_extension_format_mismatch_rejected(
    client: AsyncClient, test_users, admin_token
):
    headers = {"Authorization": f"Bearer {admin_token}"}
    wedding_id = await _create_wedding(client, headers)
    raw = _png_bytes()
    upload_id, alloc = await _init_upload(client, headers, wedding_id, "fake.jpg", len(raw))

    resp = await _upload_file(client, headers, upload_id, alloc["file_id"], "fake.jpg", raw)
    assert resp.status_code == 422
    assert "does not match actual format" in resp.json()["error"]["message"]


@pytest.mark.asyncio
async def test_upload_heic_rejected(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    wedding_id = await _create_wedding(client, headers)
    raw = _jpeg_bytes()
    upload_id, alloc = await _init_upload(client, headers, wedding_id, "photo.heic", len(raw))

    resp = await _upload_file(client, headers, upload_id, alloc["file_id"], "photo.heic", raw)
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "validation_error"


@pytest.mark.asyncio
async def test_upload_pixel_cap_rejected(
    client: AsyncClient, test_users, admin_token, monkeypatch
):
    monkeypatch.setattr(image_service, "MAX_IMAGE_PIXELS", 90_000)

    headers = {"Authorization": f"Bearer {admin_token}"}
    wedding_id = await _create_wedding(client, headers)
    raw = _png_bytes(size=(800, 800))
    upload_id, alloc = await _init_upload(client, headers, wedding_id, "big.png", len(raw))

    resp = await _upload_file(client, headers, upload_id, alloc["file_id"], "big.png", raw)
    assert resp.status_code == 422
    assert "exceeds" in resp.json()["error"]["message"]


@pytest.mark.asyncio
async def test_upload_failure_leaves_no_db_row(
    client: AsyncClient, test_users, admin_token, db_session, monkeypatch
):
    from app.services.image_service import ImageProcessingService

    async def boom_process(self, storage_path, filename, wedding_id, file_id, watermark_settings=None):
        raise ValidationError(message="processing failed")

    monkeypatch.setattr(ImageProcessingService, "process", boom_process)

    headers = {"Authorization": f"Bearer {admin_token}"}
    wedding_id = await _create_wedding(client, headers)
    raw = _jpeg_bytes()
    upload_id, alloc = await _init_upload(client, headers, wedding_id, "photo.jpg", len(raw))

    resp = await _upload_file(client, headers, upload_id, alloc["file_id"], "photo.jpg", raw)
    assert resp.status_code == 422

    from app.models import Photo
    from sqlalchemy import select

    result = await db_session.execute(
        select(Photo).where(Photo.wedding_id == wedding_id)
    )
    assert result.scalar_one_or_none() is None


def test_sniff_format():
    assert _sniff_format(_jpeg_bytes()) == "jpeg"
    assert _sniff_format(_png_bytes()) == "png"
    assert _sniff_format(b"\xff\xd8\xffjunkjunkjunk") == "jpeg"
    assert _sniff_format(b"not an image") is None
    assert _sniff_format(b"RIFF\x00\x00\x00\x00WEBP") == "webp"

    webp = io.BytesIO()
    Image.new("RGB", (10, 10), (1, 2, 3)).save(webp, format="WEBP")
    assert _sniff_format(webp.getvalue()) == "webp"


@pytest.mark.asyncio
async def test_storage_traversal_rejected(monkeypatch):
    from pathlib import Path

    import tempfile

    from app.core.storage import LocalStorage

    tmp = tempfile.mkdtemp()
    monkeypatch.setattr("app.core.config.settings.STORAGE_LOCAL_PATH", tmp)

    store = LocalStorage()
    store.root = Path(tmp).resolve()
    store.root.mkdir(parents=True, exist_ok=True)

    for evil in (
        "../secret.txt",
        "..\\secret.txt",
        "/etc/passwd",
        "weddings/../secret",
        "a/../../b",
        "a//b.jpg",
        "a:file.jpg",
    ):
        with pytest.raises((ValueError, IndexError)):
            await store.read(evil)
        with pytest.raises((ValueError, IndexError)):
            await store.delete(evil)


def test_storage_sanitize_units():
    from app.core.storage import _sanitize_relative

    assert _sanitize_relative("weddings/w1/originals/f.jpg") == "weddings/w1/originals/f.jpg"
    assert _sanitize_relative("a\\b\\c.jpg") == "a/b/c.jpg"

    for evil in ("../x", "..\\x", "/abs", "a/../b", "a//b", "a:file"):
        with pytest.raises(ValueError):
            _sanitize_relative(evil)


@pytest.mark.asyncio
async def test_media_content_served_authenticated(
    client: AsyncClient, test_users, admin_token
):
    headers = {"Authorization": f"Bearer {admin_token}"}
    wedding_id = await _create_wedding(client, headers)
    raw = _jpeg_bytes()
    upload_id, alloc = await _init_upload(client, headers, wedding_id, "photo.jpg", len(raw))
    resp = await _upload_file(client, headers, upload_id, alloc["file_id"], "photo.jpg", raw)
    photo_id = resp.json()["id"]

    med = await client.get(f"/api/v1/media/photos/{photo_id}/content?size=medium", headers=headers)
    assert med.status_code == 200
    assert med.headers["content-type"] == "image/webp"

    orb = await client.get(f"/api/v1/media/photos/{photo_id}/content?size=original", headers=headers)
    assert orb.status_code == 200
    assert orb.headers["content-type"] == "image/jpeg"
    assert orb.content == raw


@pytest.mark.asyncio
async def test_media_content_forbidden_for_outsider(
    client: AsyncClient, test_users, photographer_headers, client_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    raw = _jpeg_bytes()
    upload_id, alloc = await _init_upload(client, photographer_headers, wedding_id, "photo.jpg", len(raw))
    upload_resp = await _upload_file(
        client, photographer_headers, upload_id, alloc["file_id"], "photo.jpg", raw
    )
    photo_id = upload_resp.json()["id"]

    resp = await client.get(
        f"/api/v1/media/photos/{photo_id}/content?size=medium", headers=client_headers
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_media_content_requires_auth(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    wedding_id = await _create_wedding(client, headers)
    raw = _jpeg_bytes()
    upload_id, alloc = await _init_upload(client, headers, wedding_id, "photo.jpg", len(raw))
    upload_resp = await _upload_file(
        client, headers, upload_id, alloc["file_id"], "photo.jpg", raw
    )
    photo_id = upload_resp.json()["id"]

    resp = await client.get(f"/api/v1/media/photos/{photo_id}/content?size=medium")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_storage_mount_removed(client: AsyncClient):
    resp = await client.get("/storage/anything.txt")
    assert resp.status_code == 404