"""Folder endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.fixture
async def wedding_id(client: AsyncClient, admin_token) -> str:
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Folder Test",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
        },
        headers=headers,
    )
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_list_folders(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get(f"/api/v1/weddings/{wedding_id}/folders/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_create_folder(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {"name": "Test Folder", "visibility": "private"}
    response = await client.post(
        f"/api/v1/weddings/{wedding_id}/folders/",
        json=payload,
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Folder"


@pytest.mark.asyncio
async def test_get_folder(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/folders/",
        json={"name": "Get Folder"},
        headers=headers,
    )
    folder_id = create_resp.json()["id"]

    response = await client.get(
        f"/api/v1/weddings/{wedding_id}/folders/{folder_id}",
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Get Folder"


@pytest.mark.asyncio
async def test_update_folder(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/folders/",
        json={"name": "Original"},
        headers=headers,
    )
    folder_id = create_resp.json()["id"]

    response = await client.put(
        f"/api/v1/weddings/{wedding_id}/folders/{folder_id}",
        json={"name": "Updated Folder"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Folder"


@pytest.mark.asyncio
async def test_delete_folder(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/folders/",
        json={"name": "Delete Me"},
        headers=headers,
    )
    folder_id = create_resp.json()["id"]

    response = await client.delete(
        f"/api/v1/weddings/{wedding_id}/folders/{folder_id}",
        headers=headers,
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_reorder_folder(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    f1 = await client.post(
        f"/api/v1/weddings/{wedding_id}/folders/",
        json={"name": "First"},
        headers=headers,
    )
    f2 = await client.post(
        f"/api/v1/weddings/{wedding_id}/folders/",
        json={"name": "Second"},
        headers=headers,
    )
    response = await client.put(
        f"/api/v1/weddings/{wedding_id}/folders/{f1.json()['id']}/reorder",
        json={"sort_order": 5},
        headers=headers,
    )
    assert response.status_code == 200
