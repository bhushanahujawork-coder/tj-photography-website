"""Activity endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_activities(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/activity/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


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
    assert response.status_code == 401
