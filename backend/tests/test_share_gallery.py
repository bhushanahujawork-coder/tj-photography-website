"""Public share-gallery endpoint tests (Phase 2A/F: client gallery view).

Covers the two public share routes that power the guest gallery:
  GET /api/v1/share/{code}          -> wedding + share capabilities
  GET /api/v1/share/{code}/photos   -> share-scoped photo listing
"""

from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient

from tests.test_authz_security import _upload_photo
from tests.test_share_security import _create_share_link
from tests.test_uploads_security import _create_wedding


async def _share_gallery(client: AsyncClient, code: str):
    return await client.get(f"/api/v1/share/{code}")


async def _share_photos(client: AsyncClient, code: str, **params):
    return await client.get(f"/api/v1/share/{code}/photos", params=params)


@pytest.mark.asyncio
async def test_share_gallery_access_public_and_download_allowed(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    photo_id = await _upload_photo(client, photographer_headers, wedding_id)

    guest = await _create_share_link(client, photographer_headers, wedding_id)
    assert guest.status_code == 201
    guest_code = guest.json()["code"]

    resp = await _share_gallery(client, guest_code)
    assert resp.status_code == 200
    body = resp.json()
    assert body["wedding"]["id"] == wedding_id
    assert body["wedding"]["wedding_name"]
    assert body["share"]["code"] == guest_code
    assert body["share"]["role"] == "guest"
    assert body["download_allowed"] is False

    client_link = await _create_share_link(
        client, photographer_headers, wedding_id, role="client"
    )
    assert client_link.status_code == 201
    client_resp = await _share_gallery(client, client_link.json()["code"])
    assert client_resp.status_code == 200
    assert client_resp.json()["download_allowed"] is True


@pytest.mark.asyncio
async def test_share_gallery_access_unknown_404(
    client: AsyncClient, test_users, photographer_headers
):
    resp = await _share_gallery(client, "NO-SUCH-CODE")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_share_gallery_access_expired_404(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    past = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    create = await _create_share_link(
        client, photographer_headers, wedding_id, expires_at=past
    )
    assert create.status_code == 201

    resp = await _share_gallery(client, create.json()["code"])
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_share_photos_lists_paginated(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    ids = [
        await _upload_photo(client, photographer_headers, wedding_id)
        for _ in range(3)
    ]

    create = await _create_share_link(client, photographer_headers, wedding_id)
    assert create.status_code == 201
    code = create.json()["code"]

    resp = await _share_photos(client, code, page_size=2)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3
    assert body["pages"] == 2
    assert body["page_size"] == 2
    assert len(body["items"]) == 2

    first = body["items"][0]
    assert first["id"] in ids
    assert first["wedding_id"] == wedding_id
    assert first["thumbnail_url"].startswith(
        f"/api/v1/media/share/{code}/photos/"
    )
    assert "size=thumbnail" in first["thumbnail_url"]
    assert "size=medium" in first["medium_url"]
    assert "size=original" in first["original_url"]


@pytest.mark.asyncio
async def test_share_photos_excludes_hidden(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    keep = await _upload_photo(client, photographer_headers, wedding_id)
    hide = await _upload_photo(client, photographer_headers, wedding_id)

    hid = await client.put(
        f"/api/v1/photos/{hide}",
        json={"is_hidden": True},
        headers=photographer_headers,
    )
    assert hid.status_code == 200

    create = await _create_share_link(client, photographer_headers, wedding_id)
    assert create.status_code == 201

    resp = await _share_photos(client, create.json()["code"])
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == keep


@pytest.mark.asyncio
async def test_share_photos_excludes_deleted(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    keep = await _upload_photo(client, photographer_headers, wedding_id)
    delete = await _upload_photo(client, photographer_headers, wedding_id)

    deleted = await client.delete(f"/api/v1/photos/{delete}", headers=photographer_headers)
    assert deleted.status_code == 204

    create = await _create_share_link(client, photographer_headers, wedding_id)
    assert create.status_code == 201

    resp = await _share_photos(client, create.json()["code"])
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == keep


@pytest.mark.asyncio
async def test_share_photos_scoped_to_wedding(
    client: AsyncClient, test_users, photographer_headers
):
    w1 = await _create_wedding(client, photographer_headers)
    w2 = await _create_wedding(client, photographer_headers)
    w1_photo = await _upload_photo(client, photographer_headers, w1)
    await _upload_photo(client, photographer_headers, w2)

    create = await _create_share_link(client, photographer_headers, w1)
    assert create.status_code == 201

    resp = await _share_photos(client, create.json()["code"])
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == w1_photo


@pytest.mark.asyncio
async def test_share_photos_expired_404(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    await _upload_photo(client, photographer_headers, wedding_id)

    past = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    create = await _create_share_link(
        client, photographer_headers, wedding_id, expires_at=past
    )
    assert create.status_code == 201

    resp = await _share_photos(client, create.json()["code"])
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_share_photos_unknown_code_404(
    client: AsyncClient, test_users, photographer_headers
):
    resp = await _share_photos(client, "NO-SUCH-CODE")
    assert resp.status_code == 404