"""Photo endpoint tests."""

from datetime import datetime, timezone

import pytest
from httpx import AsyncClient

from app.models.base import ParticipantStatus, WeddingRole
from app.models.participant import Participant
from tests.test_authz_security import _upload_photo
from tests.test_uploads_security import _create_wedding


@pytest.fixture
async def wedding_id(client: AsyncClient, admin_token) -> str:
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Photo Test",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
        },
        headers=headers,
    )
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_list_photos(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get(f"/api/v1/weddings/{wedding_id}/photos", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_list_photos_with_filters(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get(
        f"/api/v1/weddings/{wedding_id}/photos?favorite=true&sort_by=created_at&sort_order=desc",
        headers=headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_photo_not_found(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/photos/nonexistent", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_upload_init(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.post(
        "/api/v1/upload/init",
        json={
            "wedding_id": wedding_id,
            "files": [
                {"name": "test.jpg", "size": 1024, "content_type": "image/jpeg"},
            ],
        },
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert "upload_id" in data
    assert "files" in data


@pytest.mark.asyncio
async def test_toggle_favorite_unauthorized(client: AsyncClient):
    response = await client.put("/api/v1/photos/nonexistent/favorite")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_deleted_photos_only_for_delete_permission(
    client: AsyncClient, test_users, photographer_headers,
):
    """Deleted photos are hidden by default and only visible to roles
    holding the 'delete' permission (photographer), never to viewers."""
    wedding_id = await _create_wedding(client, photographer_headers)
    photo_id = await _upload_photo(client, photographer_headers, wedding_id)

    delete_resp = await client.delete(
        f"/api/v1/photos/{photo_id}", headers=photographer_headers,
    )
    assert delete_resp.status_code == 204

    normal = await client.get(
        f"/api/v1/weddings/{wedding_id}/photos", headers=photographer_headers,
    )
    assert normal.status_code == 200
    assert all(p["id"] != photo_id for p in normal.json()["items"])

    deleted = await client.get(
        f"/api/v1/weddings/{wedding_id}/photos",
        params={"include_deleted": "true"},
        headers=photographer_headers,
    )
    assert deleted.status_code == 200
    assert any(p["id"] == photo_id for p in deleted.json()["items"])


@pytest.mark.asyncio
async def test_list_deleted_photos_forbidden_for_client_role(
    client: AsyncClient, test_users, photographer_headers, client_headers, db_session,
):
    """A client participant (view-only) must get 403 when requesting deleted photos."""
    wedding_id = await _create_wedding(client, photographer_headers)

    db_session.add(
        Participant(
            wedding_id=wedding_id,
            user_id="usr-4",
            name="Emily & James",
            role=WeddingRole.CLIENT.value,
            status=ParticipantStatus.ACCEPTED.value,
            invited_at=datetime.now(timezone.utc),
        )
    )
    await db_session.commit()

    deleted = await client.get(
        f"/api/v1/weddings/{wedding_id}/photos",
        params={"include_deleted": "true"},
        headers=client_headers,
    )
    assert deleted.status_code == 403

    normal = await client.get(
        f"/api/v1/weddings/{wedding_id}/photos", headers=client_headers,
    )
    assert normal.status_code == 200
