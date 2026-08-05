"""Photo endpoint tests."""

import pytest
from httpx import AsyncClient


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
