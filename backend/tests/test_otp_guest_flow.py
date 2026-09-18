"""Guest gallery login flow tests (After Home Page — guest flow, item 3).

Covers:
  - OTP is persisted and consumed (send + verify),
  - a fresh phone number provisions a guest user on verify,
  - a share_code auto-joins the guest as an accepted participant,
  - the participant gates work with distinct error codes
    (gallery_pin_required / participant_required),
  - PIN-gated and anonymous-disabled galleries unlock after guest auth.
"""

import pytest
from httpx import AsyncClient

from tests.test_share_security import _create_share_link
from tests.test_uploads_security import _create_wedding


async def _send_otp(client: AsyncClient, phone: str, **overrides):
    payload = {"phone": phone}
    payload.update(overrides)
    return await client.post("/api/v1/auth/otp/send", json=payload)


async def _verify_otp(client: AsyncClient, phone: str, otp: str, **overrides):
    payload = {"phone": phone, "otp_code": otp}
    payload.update(overrides)
    return await client.post("/api/v1/auth/otp/verify", json=payload)


@pytest.mark.asyncio
async def test_otp_send_and_verify_provisions_guest(
    client: AsyncClient, test_users, monkeypatch
):
    monkeypatch.setattr("app.services.auth_service.generate_otp", lambda: "424242")

    send = await _send_otp(client, "+919999000001")
    assert send.status_code == 200

    wrong = await _verify_otp(client, "+919999000001", "000000")
    assert wrong.status_code == 401

    verify = await _verify_otp(client, "+919999000001", "424242")
    assert verify.status_code == 200
    body = verify.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["user"]["role"] == "guest"
    assert body["user"]["phone"] == "+919999000001"


@pytest.mark.asyncio
async def test_verify_otp_consumes_code_second_use_rejected(
    client: AsyncClient, test_users, monkeypatch
):
    monkeypatch.setattr("app.services.auth_service.generate_otp", lambda: "424242")
    await _send_otp(client, "+919999000002")

    first = await _verify_otp(client, "+919999000002", "424242")
    assert first.status_code == 200

    again = await _verify_otp(client, "+919999000002", "424242")
    assert again.status_code == 401


@pytest.mark.asyncio
async def test_verify_otp_expired_code_rejected(
    client: AsyncClient, test_users, monkeypatch, db_session
):
    monkeypatch.setattr("app.services.auth_service.generate_otp", lambda: "424242")
    from datetime import datetime, timedelta, timezone
    from sqlalchemy import select

    from app.models.otp_code import OtpCode

    await _send_otp(client, "+919999000003")
    stmt = select(OtpCode).where(OtpCode.phone == "+919999000003")
    code_row = (await db_session.execute(stmt)).scalars().first()
    code_row.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    await db_session.commit()

    verify = await _verify_otp(client, "+919999000003", "424242")
    assert verify.status_code == 401


@pytest.mark.asyncio
async def test_guest_login_with_share_code_creates_participant_and_roles(
    client: AsyncClient, test_users, photographer_headers, monkeypatch
):
    monkeypatch.setattr("app.services.auth_service.generate_otp", lambda: "424242")
    wedding_id = await _create_wedding(client, photographer_headers)
    from tests.test_authz_security import _upload_photo
    photo_id = await _upload_photo(client, photographer_headers, wedding_id)
    create = await _create_share_link(client, photographer_headers, wedding_id)
    code = create.json()["code"]

    await _send_otp(client, "+919999000004")
    verify = await _verify_otp(
        client, "+919999000004", "424242", share_code=code
    )
    assert verify.status_code == 200
    guest_token = verify.json()["access_token"]

    # Guest is now an accepted participant: can list photos
    listing = await client.get(
        f"/api/v1/share/{code}/photos",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert listing.status_code == 200

    # ...and can react (like) a photo as themselves
    reaction = await client.put(
        f"/api/v1/photos/{photo_id}/reaction",
        json={"reacted": True},
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert reaction.status_code == 200
    assert reaction.json()["reacted"] is True


@pytest.mark.asyncio
async def test_participant_required_gate_for_anonymous_disabled(
    client: AsyncClient, test_users, photographer_headers, monkeypatch
):
    monkeypatch.setattr("app.services.auth_service.generate_otp", lambda: "424242")
    wedding_id = await _create_wedding(client, photographer_headers)

    settings_resp = await client.put(
        "/api/v1/settings/gallery",
        json={"anonymous_viewing": False},
        headers=photographer_headers,
    )
    assert settings_resp.status_code == 200

    create = await _create_share_link(client, photographer_headers, wedding_id)
    code = create.json()["code"]

    anon = await client.get(f"/api/v1/share/{code}")
    assert anon.status_code == 403
    assert anon.json()["error"]["code"] == "participant_required"

    await _send_otp(client, "+919999000005")
    verify = await _verify_otp(
        client, "+919999000005", "424242", share_code=code
    )
    assert verify.status_code == 200
    guest_token = verify.json()["access_token"]

    authed = await client.get(
        f"/api/v1/share/{code}",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert authed.status_code == 200


@pytest.mark.asyncio
async def test_pin_gate_error_code_and_unlock(
    client: AsyncClient, test_users, photographer_headers
):
    wedding_id = await _create_wedding(client, photographer_headers)
    create = await _create_share_link(
        client, photographer_headers, wedding_id, pin_code="1234"
    )
    code = create.json()["code"]

    locked = await client.get(f"/api/v1/share/{code}")
    assert locked.status_code == 403
    assert locked.json()["error"]["code"] == "gallery_pin_required"

    unlocked = await client.get(
        f"/api/v1/share/{code}", headers={"X-Gallery-Pin": "1234"}
    )
    assert unlocked.status_code == 200


@pytest.mark.asyncio
async def test_optional_share_code_on_verify_does_not_block_login(
    client: AsyncClient, test_users, monkeypatch
):
    monkeypatch.setattr("app.services.auth_service.generate_otp", lambda: "424242")
    await _send_otp(client, "+919999000006")
    verify = await _verify_otp(
        client, "+919999000006", "424242", share_code="NO-SUCH-CODE"
    )
    assert verify.status_code == 200
    assert verify.json()["user"]["role"] == "guest"


@pytest.mark.asyncio
async def test_phone_login_auto_links_invites_and_client_galleries(
    client: AsyncClient, test_users, photographer_headers, monkeypatch
):
    monkeypatch.setattr("app.services.auth_service.generate_otp", lambda: "424242")
    wedding_id = await _create_wedding(client, photographer_headers)

    # TJ pre-invites the client's phone number as a wedding participant
    invite = await client.post(
        f"/api/v1/weddings/{wedding_id}/participants/",
        json={"wedding_id": wedding_id, "name": "Rajesh", "phone": "+919999000007"},
        headers=photographer_headers,
    )
    assert invite.status_code == 201

    # Client OTP login from the navbar — NO share_code
    await _send_otp(client, "+919999000007")
    verify = await _verify_otp(client, "+919999000007", "424242")
    assert verify.status_code == 200
    client_token = verify.json()["access_token"]
    headers = {"Authorization": f"Bearer {client_token}"}

    # The client dashboard lists the invited wedding
    galleries = await client.get("/api/v1/client/galleries", headers=headers)
    assert galleries.status_code == 200
    ids = [g["id"] for g in galleries.json()]
    assert wedding_id in ids

    # And the participant is now accepted: albums resolve for the guest
    albums = await client.get(f"/api/v1/weddings/{wedding_id}/albums/", headers=headers)
    assert albums.status_code == 200

    # Other weddings are never leaked to the client
    other = await _create_wedding(client, photographer_headers)
    only_mine = await client.get("/api/v1/client/galleries", headers=headers)
    ids = [g["id"] for g in only_mine.json()]
    assert other not in ids

    # Unauthenticated access is rejected
    assert (await client.get("/api/v1/client/galleries")).status_code == 401