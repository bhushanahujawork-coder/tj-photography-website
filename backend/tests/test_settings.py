"""Settings endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_settings(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/settings/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "general" in data
    assert "gallery" in data
    assert "downloads" in data
    assert "branding" in data
    assert "theme" in data


@pytest.mark.asyncio
async def test_update_gallery_settings(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.put(
        "/api/v1/settings/gallery",
        json={"visibility": "private", "download_enabled": False},
        headers=headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_download_settings(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.put(
        "/api/v1/settings/downloads",
        json={"zip_enabled": False, "single_enabled": True},
        headers=headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_branding_settings(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.put(
        "/api/v1/settings/branding",
        json={"primary_color": "#FF0000", "gallery_theme": "light"},
        headers=headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_theme_settings(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.put(
        "/api/v1/settings/theme",
        json={"mode": "light", "primary_color": "#000000"},
        headers=headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_settings_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/settings/")
    assert response.status_code == 401
