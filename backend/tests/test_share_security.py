"""Share-link security tests (Part 12-A: F-12)."""

from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient

from app.models import Participant
from tests.test_authz_security import _add_participant, _upload_photo
from tests.test_uploads_security import _create_wedding


async def _create_share_link(client: AsyncClient, headers: dict, wedding_id: str, **overrides) -> dict:
    payload = {
        "wedding_id": wedding_id,
        "role": "guest",
        "download_enabled": True,
        "expires_at": None,
    }
    payload.update(overrides)
    resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/share-links",
        json=payload,
        headers=headers,
    )
    return resp


async def _public_media(client: AsyncClient, code: str, photo_id: str, size: str = "medium"):
    return await client.get(
        f"/api/v1/media/share/{code}/photos/{photo_id}/content?size={size}"
    )


@pytest.mark.asyncio
async def test_create_and_access_share_link(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    photo_id = await _upload_photo(client, photographer_headers, wedding_id)

    create = await _create_share_link(client, photographer_headers, wedding_id)
    assert create.status_code == 201
    link = create.json()
    assert link["url"].startswith("/s/")
    assert link["code"]

    public = await client.get(f"/api/v1/share-links/{link['code']}")
    assert public.status_code == 200
    assert public.json()["wedding_id"] == wedding_id

    medium = await _public_media(client, link["code"], photo_id, "medium")
    assert medium.status_code == 200
    assert medium.headers["content-type"] == "image/webp"

    guest_original = await _public_media(client, link["code"], photo_id, "original")
    assert guest_original.status_code == 404

    client_link = await _create_share_link(
        client, photographer_headers, wedding_id, role="client"
    )
    client_original = await _public_media(client, client_link.json()["code"], photo_id, "original")
    assert client_original.status_code == 200


@pytest.mark.asyncio
async def test_expired_share_link_rejected(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    photo_id = await _upload_photo(client, photographer_headers, wedding_id)

    past = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    create = await _create_share_link(
        client, photographer_headers, wedding_id, expires_at=past
    )
    assert create.status_code == 201
    code = create.json()["code"]

    public = await client.get(f"/api/v1/share-links/{code}")
    assert public.status_code == 404

    media = await _public_media(client, code, photo_id)
    assert media.status_code == 404


@pytest.mark.asyncio
async def test_download_disabled_blocks_original_but_not_view(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    photo_id = await _upload_photo(client, photographer_headers, wedding_id)

    create = await _create_share_link(
        client, photographer_headers, wedding_id, download_enabled=False
    )
    assert create.status_code == 201
    code = create.json()["code"]

    medium = await _public_media(client, code, photo_id, "medium")
    assert medium.status_code == 200

    original = await _public_media(client, code, photo_id, "original")
    assert original.status_code == 404


@pytest.mark.asyncio
async def test_share_link_photo_must_belong_to_wedding(
    client: AsyncClient, test_users, photographer_headers
):
    w1 = await _create_wedding(client, photographer_headers)
    w2 = await _create_wedding(client, photographer_headers)
    photo_in_w2 = await _upload_photo(client, photographer_headers, w2)

    create = await _create_share_link(client, photographer_headers, w1)
    assert create.status_code == 201
    code = create.json()["code"]

    media = await _public_media(client, code, photo_in_w2)
    assert media.status_code == 404


@pytest.mark.asyncio
async def test_share_link_unknown_photo_404(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    create = await _create_share_link(client, photographer_headers, wedding_id)
    assert create.status_code == 201

    media = await _public_media(client, create.json()["code"], "missing-photo-id")
    assert media.status_code == 404


@pytest.mark.asyncio
async def test_share_link_never_exposes_hidden_photo(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    photo_id = await _upload_photo(client, photographer_headers, wedding_id)
    hide = await client.put(
        f"/api/v1/photos/{photo_id}",
        json={"is_hidden": True},
        headers=photographer_headers,
    )
    assert hide.status_code == 200

    create = await _create_share_link(client, photographer_headers, wedding_id)
    code = create.json()["code"]

    medium = await _public_media(client, code, photo_id, "medium")
    assert medium.status_code == 404


@pytest.mark.asyncio
async def test_share_link_deleted_photo_404(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    photo_id = await _upload_photo(client, photographer_headers, wedding_id)
    delete = await client.delete(f"/api/v1/photos/{photo_id}", headers=photographer_headers)
    assert delete.status_code == 204

    create = await _create_share_link(client, photographer_headers, wedding_id)
    code = create.json()["code"]

    medium = await _public_media(client, code, photo_id, "medium")
    assert medium.status_code == 404


@pytest.mark.asyncio
async def test_create_share_link_requires_share_permission(
    client: AsyncClient, test_users, photographer_headers, client_headers, db_session
):
    wedding_id = await _create_wedding(client, photographer_headers)
    await _add_participant(db_session, wedding_id, "usr-4", "client")

    resp = await _create_share_link(client, client_headers, wedding_id)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_share_links_forbidden_for_outsider(
    client: AsyncClient, test_users, photographer_headers, client_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)

    resp = await client.get(
        f"/api/v1/weddings/{wedding_id}/share-links", headers=client_headers
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_delete_share_link_requires_share_permission(
    client: AsyncClient, test_users, photographer_headers, client_headers, db_session
):
    wedding_id = await _create_wedding(client, photographer_headers)
    create = await _create_share_link(client, photographer_headers, wedding_id)
    link_id = create.json()["id"]

    await _add_participant(db_session, wedding_id, "usr-4", "client")
    denied = await client.delete(f"/api/v1/share-links/{link_id}", headers=client_headers)
    assert denied.status_code == 403

    owner = await client.delete(f"/api/v1/share-links/{link_id}", headers=photographer_headers)
    assert owner.status_code == 204

    gone = await client.get(f"/api/v1/share-links/{create.json()['code']}")
    assert gone.status_code == 404


@pytest.mark.asyncio
async def test_share_link_expires_with_future_deadline(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    photo_id = await _upload_photo(client, photographer_headers, wedding_id)

    future = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    create = await _create_share_link(
        client, photographer_headers, wedding_id, expires_at=future
    )
    assert create.status_code == 201
    code = create.json()["code"]

    public = await client.get(f"/api/v1/share-links/{code}")
    assert public.status_code == 200

    medium = await _public_media(client, code, photo_id)
    assert medium.status_code == 200