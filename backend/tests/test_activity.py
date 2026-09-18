"""Activity endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_activities(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/activity/", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, dict)
    assert "items" in body
    assert "total" in body


@pytest.mark.asyncio
async def test_list_activities_with_filters(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get(
        "/api/v1/activity/?page=1&page_size=10",
        headers=headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_activities_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/activity/")
    assert response.status_code in (401, 422)
