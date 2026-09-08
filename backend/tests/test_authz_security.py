"""Authorization security tests (Part 12-A: F-03, F-04, F-05, F-10)."""

import pytest
from httpx import AsyncClient

from app.models import Participant
from tests.test_uploads_security import (
    _create_wedding,
    _init_upload,
    _jpeg_bytes,
    _upload_file,
)


async def _add_participant(db_session, wedding_id: str, user_id: str, role: str):
    participant = Participant(
        wedding_id=wedding_id,
        user_id=user_id,
        name="Guest",
        email="guest@example.com",
        role=role,
        status="accepted",
    )
    db_session.add(participant)
    await db_session.commit()
    return participant


async def _upload_photo(client: AsyncClient, headers: dict, wedding_id: str) -> str:
    raw = _jpeg_bytes()
    upload_id, alloc = await _init_upload(client, headers, wedding_id, "photo.jpg", len(raw))
    resp = await _upload_file(client, headers, upload_id, alloc["file_id"], "photo.jpg", raw)
    assert resp.status_code == 201
    return resp.json()["id"]


async def _create_album(client: AsyncClient, headers: dict, wedding_id: str, name: str = "Album") -> str:
    resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/albums/",
        json={"wedding_id": wedding_id, "name": name},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def _create_folder(client: AsyncClient, headers: dict, wedding_id: str, name: str = "Folder") -> str:
    resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/folders/",
        json={"wedding_id": wedding_id, "name": name},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def _invite_participant(
    client: AsyncClient, headers: dict, wedding_id: str, name: str = "Guest"
) -> str:
    resp = await client.post(
        f"/api/v1/weddings/{wedding_id}/participants/",
        json={"wedding_id": wedding_id, "name": name, "email": "g@example.com", "role": "guest"},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_wedding_get_forbidden_for_outsider(
    client: AsyncClient, test_users, photographer_headers, client_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)

    resp = await client.get(f"/api/v1/weddings/{wedding_id}", headers=client_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_wedding_edit_denied_for_client(
    client: AsyncClient, test_users, photographer_headers, client_headers, db_session
):
    wedding_id = await _create_wedding(client, photographer_headers)
    await _add_participant(db_session, wedding_id, "usr-4", "client")

    resp = await client.put(
        f"/api/v1/weddings/{wedding_id}",
        json={"wedding_name": "Hacked"},
        headers=client_headers,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_photo_idor_denied_for_outsider(
    client: AsyncClient, test_users, photographer_headers, client_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    photo_id = await _upload_photo(client, photographer_headers, wedding_id)

    get_resp = await client.get(f"/api/v1/photos/{photo_id}", headers=client_headers)
    assert get_resp.status_code == 403

    put_resp = await client.put(
        f"/api/v1/photos/{photo_id}",
        json={"alt_text": "hacked"},
        headers=client_headers,
    )
    assert put_resp.status_code == 403

    del_resp = await client.delete(f"/api/v1/photos/{photo_id}", headers=client_headers)
    assert del_resp.status_code == 403


@pytest.mark.asyncio
async def test_hidden_photos_hidden_from_client(
    client: AsyncClient, test_users, photographer_headers, client_headers, db_session
):
    wedding_id = await _create_wedding(client, photographer_headers)
    await _add_participant(db_session, wedding_id, "usr-4", "client")

    visible_id = await _upload_photo(client, photographer_headers, wedding_id)
    hidden_id = await _upload_photo(client, photographer_headers, wedding_id)
    hide_resp = await client.put(
        f"/api/v1/photos/{hidden_id}",
        json={"is_hidden": True},
        headers=photographer_headers,
    )
    assert hide_resp.status_code == 200

    listed = await client.get(
        f"/api/v1/weddings/{wedding_id}/photos", headers=client_headers
    )
    assert listed.status_code == 200
    ids = [p["id"] for p in listed.json()["items"]]
    assert visible_id in ids
    assert hidden_id not in ids

    single = await client.get(f"/api/v1/photos/{hidden_id}", headers=client_headers)
    assert single.status_code == 404

    media = await client.get(
        f"/api/v1/media/photos/{hidden_id}/content?size=medium", headers=client_headers
    )
    assert media.status_code == 404


@pytest.mark.asyncio
async def test_guest_cannot_download(
    client: AsyncClient, test_users, photographer_headers, client_token, db_session
):
    wedding_id = await _create_wedding(client, photographer_headers)
    photo_id = await _upload_photo(client, photographer_headers, wedding_id)
    await _add_participant(db_session, wedding_id, "usr-4", "guest")

    headers = {"Authorization": f"Bearer {client_token}"}
    dl = await client.get(f"/api/v1/photos/{photo_id}/download", headers=headers)
    assert dl.status_code == 404

    media_orig = await client.get(
        f"/api/v1/media/photos/{photo_id}/content?size=original", headers=headers
    )
    assert media_orig.status_code == 404


@pytest.mark.asyncio
async def test_batch_download_route_not_shadowed(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    photo_id = await _upload_photo(client, photographer_headers, wedding_id)

    resp = await client.get(
        f"/api/v1/photos/download?photo_ids={photo_id}",
        headers=photographer_headers,
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/zip"
    assert len(resp.content) > 0

    empty = await client.get(
        "/api/v1/photos/download?photo_ids=", headers=photographer_headers
    )
    assert empty.status_code == 200


@pytest.mark.asyncio
async def test_owner_can_update_photo_and_media(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    photo_id = await _upload_photo(client, photographer_headers, wedding_id)

    up = await client.put(
        f"/api/v1/photos/{photo_id}",
        json={"alt_text": "owner edit"},
        headers=photographer_headers,
    )
    assert up.status_code == 200
    assert up.json()["alt_text"] == "owner edit"

    media = await client.get(
        f"/api/v1/media/photos/{photo_id}/content?size=medium",
        headers=photographer_headers,
    )
    assert media.status_code == 200


@pytest.mark.asyncio
async def test_album_idor_cross_wedding_404(
    client: AsyncClient, test_users, photographer_headers
):
    w1 = await _create_wedding(client, photographer_headers)
    w2 = await _create_wedding(client, photographer_headers)
    album_id = await _create_album(client, photographer_headers, w2)

    get_resp = await client.get(f"/api/v1/weddings/{w1}/albums/{album_id}", headers=photographer_headers)
    assert get_resp.status_code == 404

    put_resp = await client.put(
        f"/api/v1/weddings/{w1}/albums/{album_id}",
        json={"name": "Hacked"},
        headers=photographer_headers,
    )
    assert put_resp.status_code == 404

    del_resp = await client.delete(f"/api/v1/weddings/{w1}/albums/{album_id}", headers=photographer_headers)
    assert del_resp.status_code == 404


@pytest.mark.asyncio
async def test_album_list_forbidden_for_outsider(
    client: AsyncClient, test_users, photographer_headers, client_headers
):
    w1 = await _create_wedding(client, photographer_headers)
    resp = await client.get(f"/api/v1/weddings/{w1}/albums/", headers=client_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_folder_idor_cross_wedding_404(
    client: AsyncClient, test_users, photographer_headers
):
    w1 = await _create_wedding(client, photographer_headers)
    w2 = await _create_wedding(client, photographer_headers)
    folder_id = await _create_folder(client, photographer_headers, w2)

    get_resp = await client.get(f"/api/v1/weddings/{w1}/folders/{folder_id}", headers=photographer_headers)
    assert get_resp.status_code == 404

    put_resp = await client.put(
        f"/api/v1/weddings/{w1}/folders/{folder_id}",
        json={"name": "Hacked"},
        headers=photographer_headers,
    )
    assert put_resp.status_code == 404


@pytest.mark.asyncio
async def test_participant_idor_cross_wedding_404(
    client: AsyncClient, test_users, photographer_headers
):
    w1 = await _create_wedding(client, photographer_headers)
    w2 = await _create_wedding(client, photographer_headers)
    participant_id = await _invite_participant(client, photographer_headers, w2)

    put_resp = await client.put(
        f"/api/v1/weddings/{w1}/participants/{participant_id}",
        json={"role": "client"},
        headers=photographer_headers,
    )
    assert put_resp.status_code == 404

    resend = await client.post(
        f"/api/v1/weddings/{w1}/participants/{participant_id}/resend",
        headers=photographer_headers,
    )
    assert resend.status_code == 404


@pytest.mark.asyncio
async def test_participant_invite_requires_share_permission(
    client: AsyncClient, test_users, photographer_headers, client_headers, db_session
):
    w1 = await _create_wedding(client, photographer_headers)
    await _add_participant(db_session, w1, "usr-4", "client")

    resp = await client.post(
        f"/api/v1/weddings/{w1}/participants/",
        json={"wedding_id": w1, "name": "Nosy", "email": "n@example.com", "role": "guest"},
        headers=client_headers,
    )
    assert resp.status_code == 403