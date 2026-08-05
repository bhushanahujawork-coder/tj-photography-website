"""Health check and system endpoints tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_liveness_check(client: AsyncClient):
    response = await client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"
    assert "version" in data


@pytest.mark.asyncio
async def test_readiness_check(client: AsyncClient):
    response = await client.get("/health/ready")
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_request_id_header(client: AsyncClient):
    response = await client.get("/health", headers={"X-Request-ID": "test-req-123"})
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == "test-req-123"


@pytest.mark.asyncio
async def test_response_time_header(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert "X-Response-Time-Ms" in response.headers


@pytest.mark.asyncio
async def test_cors_headers(client: AsyncClient):
    response = await client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


@pytest.mark.asyncio
async def test_swagger_docs_available(client: AsyncClient):
    response = await client.get("/docs")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_openapi_schema(client: AsyncClient):
    response = await client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert data["info"]["title"] == "TJ Photography API"
    assert "paths" in data
    assert "/health" in data["paths"]
    assert "/api/v1/auth/register" in data["paths"]
