"""Permission endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.fixture
async def wedding_id(client: AsyncClient, admin_token) -> str:
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Perm Test",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
        },
        headers=headers,
    )
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_get_permission_matrix(
    client: AsyncClient, test_users, admin_token, wedding_id,
):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get(
        f"/api/v1/weddings/{wedding_id}/permissions/",
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "wedding_id" in data
    assert "permissions" in data


@pytest.mark.asyncio
async def test_update_permissions(
    client: AsyncClient, test_users, admin_token, wedding_id,
):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.put(
        f"/api/v1/weddings/{wedding_id}/permissions/",
        json={
            "permissions": [
                {"role": "client", "permission": "download", "allowed": False},
            ],
        },
        headers=headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_default_permissions(
    client: AsyncClient, test_users, admin_token, wedding_id,
):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get(
        f"/api/v1/weddings/{wedding_id}/permissions/defaults",
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "defaults" in data


@pytest.mark.asyncio
async def test_permissions_unauthorized(client: AsyncClient, wedding_id):
    response = await client.get(f"/api/v1/weddings/{wedding_id}/permissions/")
    assert response.status_code == 401
