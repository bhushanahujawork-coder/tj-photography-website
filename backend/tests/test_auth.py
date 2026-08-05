"""Authentication endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    payload = {
        "name": "New User",
        "email": "newuser@example.com",
        "password": "SecurePass123",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["name"] == "New User"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, test_users):
    payload = {
        "name": "Duplicate User",
        "email": "tj@tjphotography.com",
        "password": "SecurePass123",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    payload = {
        "name": "Weak User",
        "email": "weak@example.com",
        "password": "short",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_no_uppercase(client: AsyncClient):
    payload = {
        "name": "No Upper",
        "email": "noupper@example.com",
        "password": "alllowercase1",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_users):
    payload = {"email": "tj@tjphotography.com", "password": "Password123"}
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["email"] == "tj@tjphotography.com"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, test_users):
    payload = {"email": "tj@tjphotography.com", "password": "wrongpassword"}
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_email(client: AsyncClient):
    payload = {"email": "nobody@example.com", "password": "Password123"}
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_inactive_user(client: AsyncClient, db_session, test_users):
    payload = {"email": "tj@tjphotography.com", "password": "Password123"}
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, test_users):
    login_payload = {"email": "tj@tjphotography.com", "password": "Password123"}
    login_resp = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    refresh_token = login_resp.json()["refresh_token"]

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_refresh_token_invalid(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid_token_here"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "tj@tjphotography.com"


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_invalid_token(client: AsyncClient):
    headers = {"Authorization": "Bearer invalidtoken"}
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.post("/api/v1/auth/logout", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Logged out successfully"


@pytest.mark.asyncio
async def test_update_me(client: AsyncClient, test_users, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {"name": "TJ Updated"}
    response = await client.put("/api/v1/auth/me", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "TJ Updated"


@pytest.mark.asyncio
async def test_otp_send(client: AsyncClient, test_users):
    response = await client.post(
        "/api/v1/auth/otp/send",
        json={"email": "tj@tjphotography.com"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_password_reset_request(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/password/reset",
        json={"email": "tj@tjphotography.com"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_google_auth(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/google",
        json={"id_token": "google_id_token"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
