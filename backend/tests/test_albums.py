"""Album endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.fixture
async def wedding_id(client: AsyncClient, admin_token) -> str:
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Album Test Wedding",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
        },
        headers=headers,
    )
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_list_albums(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get(f"/api/v1/weddings/{wedding_id}/albums/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_create_album(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {"name": "Test Album", "description": "A test album"}
    response = await client.post(
        f"/api/v1/weddings/{wedding_id}/albums/",
        json=payload,
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Album"
    assert data["description"] == "A test album"


@pytest.mark.asyncio
async def test_get_album(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/albums/",
        json={"name": "Get Album"},
        headers=headers,
    )
    album_id = create_resp.json()["id"]

    response = await client.get(
        f"/api/v1/weddings/{wedding_id}/albums/{album_id}",
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Get Album"


@pytest.mark.asyncio
async def test_update_album(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/albums/",
        json={"name": "Original"},
        headers=headers,
    )
    album_id = create_resp.json()["id"]

    response = await client.put(
        f"/api/v1/weddings/{wedding_id}/albums/{album_id}",
        json={"name": "Updated Album"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Album"


@pytest.mark.asyncio
async def test_delete_album(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/albums/",
        json={"name": "Delete Me"},
        headers=headers,
    )
    album_id = create_resp.json()["id"]

    response = await client.delete(
        f"/api/v1/weddings/{wedding_id}/albums/{album_id}",
        headers=headers,
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_get_album_not_found(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get(
        f"/api/v1/weddings/{wedding_id}/albums/nonexistent",
        headers=headers,
    )
    assert response.status_code == 404
