"""User endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_profile(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/users/profile", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "email" in data
    assert "role" in data


@pytest.mark.asyncio
async def test_update_profile(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.put(
        "/api/v1/users/profile",
        json={"name": "Updated Name"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_change_password(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.put(
        "/api/v1/users/password",
        json={"current_password": "Password123", "new_password": "NewPass456"},
        headers=headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_change_password_wrong_current(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.put(
        "/api/v1/users/password",
        json={"current_password": "wrongpassword", "new_password": "NewPass456"},
        headers=headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_permissions(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/users/permissions", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_profile_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/users/profile")
    assert response.status_code == 401
