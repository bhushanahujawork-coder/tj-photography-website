"""Notification endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_notifications(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/notifications/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_unread_count(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/notifications/unread-count", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "count" in data


@pytest.mark.asyncio
async def test_mark_all_read(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.put("/api/v1/notifications/mark-all-read", headers=headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_notification_not_found(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.put(
        "/api/v1/notifications/nonexistent",
        json={"read": True},
        headers=headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_notifications_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/notifications/")
    assert response.status_code == 401
