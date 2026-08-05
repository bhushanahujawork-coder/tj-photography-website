"""Dashboard endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_dashboard_stats(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/dashboard/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_weddings" in data
    assert "total_photos" in data
    assert "total_downloads" in data
    assert "total_storage" in data


@pytest.mark.asyncio
async def test_get_recent_activity(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get(
        "/api/v1/dashboard/recent-activity?limit=5",
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "activities" in data


@pytest.mark.asyncio
async def test_get_analytics(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/dashboard/analytics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_views" in data
    assert "total_downloads" in data


@pytest.mark.asyncio
async def test_dashboard_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/dashboard/stats")
    assert response.status_code == 401
