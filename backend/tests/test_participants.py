"""Participant endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.fixture
async def wedding_id(client: AsyncClient, admin_token) -> str:
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.post(
        "/api/v1/weddings/",
        json={
            "wedding_name": "Participant Test",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "wedding_date": "2025-06-15T00:00:00Z",
        },
        headers=headers,
    )
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_list_participants(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get(
        f"/api/v1/weddings/{wedding_id}/participants/",
        headers=headers,
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_invite_participant(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {"name": "Test Guest", "email": "guest@example.com", "role": "guest"}
    response = await client.post(
        f"/api/v1/weddings/{wedding_id}/participants/",
        json=payload,
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Guest"
    assert data["email"] == "guest@example.com"
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_bulk_invite_participants(
    client: AsyncClient, test_users, admin_token, wedding_id,
):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "participants": [
            {"name": "Guest 1", "email": "guest1@example.com"},
            {"name": "Guest 2", "email": "guest2@example.com"},
        ],
    }
    response = await client.post(
        f"/api/v1/weddings/{wedding_id}/participants/bulk",
        json=payload,
        headers=headers,
    )
    assert response.status_code == 201
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_update_participant(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/participants/",
        json={"name": "Update Me", "email": "update@example.com"},
        headers=headers,
    )
    part_id = create_resp.json()["id"]

    response = await client.put(
        f"/api/v1/weddings/{wedding_id}/participants/{part_id}",
        json={"role": "editor"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["role"] == "editor"


@pytest.mark.asyncio
async def test_remove_participant(client: AsyncClient, test_users, admin_token, wedding_id):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/participants/",
        json={"name": "Remove Me", "email": "remove@example.com"},
        headers=headers,
    )
    part_id = create_resp.json()["id"]

    response = await client.delete(
        f"/api/v1/weddings/{wedding_id}/participants/{part_id}",
        headers=headers,
    )
    assert response.status_code == 204
