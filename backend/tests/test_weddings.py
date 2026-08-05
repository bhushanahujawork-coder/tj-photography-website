"""Wedding endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_weddings(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/weddings/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "pages" in data


@pytest.mark.asyncio
async def test_list_weddings_pagination(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/weddings/?page=1&page_size=5", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 5


@pytest.mark.asyncio
async def test_create_wedding(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "wedding_name": "Test Wedding",
        "bride_name": "Test Bride",
        "groom_name": "Test Groom",
        "wedding_date": "2025-06-15T00:00:00Z",
        "location": "Test Location",
        "visibility": "public",
    }
    response = await client.post("/api/v1/weddings/", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["wedding_name"] == "Test Wedding"
    assert data["bride_name"] == "Test Bride"
    assert data["groom_name"] == "Test Groom"
    assert "id" in data
    assert "wedding_code" in data


@pytest.mark.asyncio
async def test_create_wedding_unauthenticated(client: AsyncClient):
    payload = {
        "wedding_name": "Test Wedding",
        "bride_name": "Test Bride",
        "groom_name": "Test Groom",
        "wedding_date": "2025-06-15T00:00:00Z",
    }
    response = await client.post("/api/v1/weddings/", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_wedding(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Get Test",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
        },
        headers=headers,
    )
    wedding_id = create_resp.json()["id"]

    response = await client.get(f"/api/v1/weddings/{wedding_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["wedding_name"] == "Get Test"


@pytest.mark.asyncio
async def test_get_wedding_not_found(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/weddings/nonexistent-id", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_wedding(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Original Name",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
        },
        headers=headers,
    )
    wedding_id = create_resp.json()["id"]

    response = await client.put(
        f"/api/v1/weddings/{wedding_id}",
        json={"wedding_name": "Updated Name"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["wedding_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_delete_wedding(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Delete Me",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
        },
        headers=headers,
    )
    wedding_id = create_resp.json()["id"]

    response = await client.delete(f"/api/v1/weddings/{wedding_id}", headers=headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_publish_wedding(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Publish Test",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
        },
        headers=headers,
    )
    wedding_id = create_resp.json()["id"]

    response = await client.post(
        f"/api/v1/weddings/{wedding_id}/publish",
        json={"published": True},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "active"


@pytest.mark.asyncio
async def test_archive_wedding(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Archive Test",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
        },
        headers=headers,
    )
    wedding_id = create_resp.json()["id"]

    response = await client.post(
        f"/api/v1/weddings/{wedding_id}/archive",
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "archived"


@pytest.mark.asyncio
async def test_duplicate_wedding(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Original",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
        },
        headers=headers,
    )
    wedding_id = create_resp.json()["id"]

    response = await client.post(
        f"/api/v1/weddings/{wedding_id}/duplicate",
        json={"new_name": "Copy of Original"},
        headers=headers,
    )
    assert response.status_code == 201
    assert response.json()["wedding_name"] == "Copy of Original"


@pytest.mark.asyncio
async def test_get_wedding_by_code(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Code Test",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
            "wedding_code": "TEST1234",
        },
        headers=headers,
    )
    code = create_resp.json()["wedding_code"]

    response = await client.get(f"/api/v1/weddings/by-code/{code}")
    assert response.status_code == 200
    assert response.json()["wedding_code"] == code


@pytest.mark.asyncio
async def test_get_wedding_by_code_not_found(client: AsyncClient):
    response = await client.get("/api/v1/weddings/by-code/NONEXISTENT")
    assert response.status_code == 404
