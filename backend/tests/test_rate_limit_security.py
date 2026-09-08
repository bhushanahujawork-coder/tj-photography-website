"""Upload rate-limit & quota tests (Part 12-A: F-17)."""

import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.core import rate_limit
from app.core.errors import RateLimitError
from app.services.upload_service import UploadService
from tests.test_uploads_security import _create_wedding


@pytest_asyncio.fixture(autouse=True)
async def _isolate_sessions():
    UploadService._sessions.clear()
    yield
    UploadService._sessions.clear()


async def _init_raw(client: AsyncClient, headers: dict, wedding_id: str, files: int):
    payload = {
        "wedding_id": wedding_id,
        "files": [
            {"name": f"file_{i}.jpg", "size": 1000, "content_type": "image/jpeg"}
            for i in range(files)
        ],
    }
    return await client.post("/api/v1/upload/init", json=payload, headers=headers)


def test_token_bucket_refills_per_burst():
    bucket = rate_limit.TokenBucket(rate=0.5, burst=2)
    assert bucket.consume("k")
    assert bucket.consume("k")
    assert not bucket.consume("k")

    bucket2 = rate_limit.TokenBucket(rate=0.5, burst=2)
    assert bucket2.consume("a")
    assert bucket2.consume("b")
    assert bucket2.consume("a") is True


@pytest.mark.asyncio
async def test_upload_rate_limit_blocks_repeated_requests(
    client: AsyncClient, test_users, photographer_headers, monkeypatch
):
    monkeypatch.setattr(rate_limit.settings, "RATE_LIMIT_ENABLED", True)
    monkeypatch.setattr(
        rate_limit, "_upload_bucket", rate_limit.TokenBucket(rate=0.0, burst=1)
    )

    first = await client.post("/api/v1/upload/init", json={}, headers=photographer_headers)
    assert first.status_code in (401, 422)

    second = await client.post("/api/v1/upload/init", json={}, headers=photographer_headers)
    assert second.status_code == 429


@pytest.mark.asyncio
async def test_max_sessions_per_user_enforced(
    client: AsyncClient, test_users, photographer_headers
):
    UploadService._sessions.clear()
    wedding_id = await _create_wedding(client, photographer_headers)

    for _ in range(3):
        resp = await _init_raw(client, photographer_headers, wedding_id, 1)
        assert resp.status_code == 201

    fourth = await _init_raw(client, photographer_headers, wedding_id, 1)
    assert fourth.status_code == 429
    assert "sessions" in fourth.json()["error"]["message"]


@pytest.mark.asyncio
async def test_cancel_frees_session_slot(
    client: AsyncClient, test_users, photographer_headers
):
    UploadService._sessions.clear()
    wedding_id = await _create_wedding(client, photographer_headers)

    upload_ids = []
    for _ in range(3):
        resp = await _init_raw(client, photographer_headers, wedding_id, 1)
        assert resp.status_code == 201
        upload_ids.append(resp.json()["upload_id"])

    cancel = await client.post(
        f"/api/v1/upload/{upload_ids[0]}/cancel", headers=photographer_headers
    )
    assert cancel.status_code == 200

    retry = await _init_raw(client, photographer_headers, wedding_id, 1)
    assert retry.status_code == 201


@pytest.mark.asyncio
async def test_max_files_per_session_enforced(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    resp = await _init_raw(client, photographer_headers, wedding_id, 1001)
    assert resp.status_code == 422
    assert "files" in resp.json()["error"]["message"]


@pytest.mark.asyncio
async def test_upload_limits_independent_per_user(
    client: AsyncClient, test_users, photographer_headers, editor_headers
):
    UploadService._sessions.clear()
    wedding_id = await _create_wedding(client, photographer_headers)

    for _ in range(3):
        assert (await _init_raw(client, photographer_headers, wedding_id, 1)).status_code == 201

    excess = await _init_raw(client, photographer_headers, wedding_id, 1)
    assert excess.status_code == 429

    other_user = await _init_raw(client, editor_headers, wedding_id, 1)
    assert other_user.status_code == 201


@pytest.mark.asyncio
async def test_rate_limit_error_status_code():
    err = RateLimitError(message="nope")
    assert err.status_code == 429
    assert err.code == "rate_limit_exceeded"