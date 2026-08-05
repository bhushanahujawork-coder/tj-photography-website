"""Upload endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.fixture
async def wedding_id(client: AsyncClient, admin_token) -> str:
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Upload Test",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
        },
        headers=headers,
    )
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_init_upload(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.post(
        "/api/v1/upload/init",
        json={
            "wedding_id": wedding_id,
            "files": [
                {"name": "photo1.jpg", "size": 5242880, "content_type": "image/jpeg"},
                {"name": "photo2.png", "size": 2097152, "content_type": "image/png"},
            ],
        },
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert "upload_id" in data
    assert len(data["files"]) == 2
    assert data["files"][0]["filename"] == "photo1.jpg"


@pytest.mark.asyncio
async def test_init_upload_unauthorized(client: AsyncClient):
    response = await client.post(
        "/api/v1/upload/init",
        json={"wedding_id": "wed-1", "files": []},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_upload_progress_not_found(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/upload/nonexistent/progress", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_cancel_upload_not_found(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.post("/api/v1/upload/nonexistent/cancel", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_complete_upload_not_found(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.post(
        "/api/v1/upload/nonexistent/complete",
        json={"file_id": "f1", "status": "completed"},
        headers=headers,
    )
    assert response.status_code == 404
