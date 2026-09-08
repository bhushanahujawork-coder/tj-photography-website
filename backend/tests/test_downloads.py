"""Download and share link endpoint tests."""

import pytest
from httpx import AsyncClient

from tests.test_uploads_security import _create_wedding


@pytest.fixture
async def wedding_id(client: AsyncClient, admin_token) -> str:
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Download Test",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
        },
        headers=headers,
    )
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_create_download(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.post(
        "/api/v1/downloads",
        json={
            "wedding_id": wedding_id,
            "photo_ids": ["photo-1", "photo-2"],
            "type": "multiple",
        },
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["wedding_id"] == wedding_id
    assert data["photo_count"] == 2


@pytest.mark.asyncio
async def test_list_downloads(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/downloads", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_list_downloads_is_user_scoped(
    client: AsyncClient, test_users, photographer_headers, editor_headers,
):
    """A non-admin user must never see another user's download records (IDOR)."""
    wedding_id = await _create_wedding(client, photographer_headers)
    create = await client.post(
        "/api/v1/downloads",
        json={"wedding_id": wedding_id, "photo_ids": ["photo-1"], "type": "single"},
        headers=photographer_headers,
    )
    assert create.status_code == 201
    created_id = create.json()["id"]

    other_list = await client.get("/api/v1/downloads", headers=editor_headers)
    assert other_list.status_code == 200
    assert all(d["id"] != created_id for d in other_list.json())


@pytest.mark.asyncio
async def test_list_downloads_with_records(
    client: AsyncClient, test_users, photographer_headers,
):
    """Listing returns full records (wedding/user names) once history exists."""
    wedding_id = await _create_wedding(client, photographer_headers)
    create = await client.post(
        "/api/v1/downloads",
        json={"wedding_id": wedding_id, "photo_ids": ["photo-1"], "type": "single"},
        headers=photographer_headers,
    )
    assert create.status_code == 201

    response = await client.get("/api/v1/downloads", headers=photographer_headers)
    assert response.status_code == 200
    records = response.json()
    assert any(d["id"] == create.json()["id"] for d in records)
    for record in records:
        assert record["created_at"]
        assert record["wedding_name"]


@pytest.mark.asyncio
async def test_get_download_not_found(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/downloads/nonexistent", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_share_link(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.post(
        f"/api/v1/weddings/{wedding_id}/share-links",
        json={"role": "client", "download_enabled": True},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["wedding_id"] == wedding_id
    assert "code" in data


@pytest.mark.asyncio
async def test_list_share_links(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get(
        f"/api/v1/weddings/{wedding_id}/share-links",
        headers=headers,
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_delete_share_link(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/share-links",
        json={"role": "guest"},
        headers=headers,
    )
    link_id = create_resp.json()["id"]

    response = await client.delete(f"/api/v1/share-links/{link_id}", headers=headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_access_share_link(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/share-links",
        json={"role": "guest"},
        headers=headers,
    )
    code = create_resp.json()["code"]

    response = await client.get(f"/api/v1/share-links/{code}")
    assert response.status_code == 200
