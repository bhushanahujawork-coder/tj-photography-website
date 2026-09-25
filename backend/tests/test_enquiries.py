"""TJ PHOTOGRAPHY Quotation / Enquiry system tests."""

from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select

from app.core import rate_limit
from app.core import pricing_config as pricing
from app.core.security import decode_token
from app.models.otp_code import OtpCode
from app.services import enquiry_service as es


PHONE = "9876543210"


async def _send_otp(client: AsyncClient, phone: str = PHONE) -> dict:
    resp = await client.post("/api/v1/enquiries/otp/send", json={"phone": phone})
    assert resp.status_code == 200, resp.text
    return resp.json()


async def _verify_otp(client: AsyncClient, otp: str, phone: str = PHONE) -> dict:
    resp = await client.post(
        "/api/v1/enquiries/otp/verify", json={"phone": phone, "otp_code": otp}
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


async def _authed_flow(client: AsyncClient, monkeypatch) -> dict:
    """send → verify, returns the enquiry auth dict."""
    monkeypatch.setattr(es, "RESEND_COOLDOWN_SECONDS", 0)
    sent = await _send_otp(client)
    return await _verify_otp(client, sent["demo_otp"])


def _quotation_body(**overrides) -> dict:
    body = {
        "event_type": "wedding",
        "couple_name": "Aarav & Diya",
        "event_date": "2027-02-14",
        "venues": {"day1": "Rajmahal Banquet, Jamnagar", "day2": "Gangnath Farm"},
        "package_id": "wedding.golden",
        "add_ons": [
            {"id": "wedding.candid_photographer", "qty": 2},
            {"id": "wedding.drone", "qty": 2},
        ],
    }
    body.update(overrides)
    return body


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_config_returns_packages_and_prices(client: AsyncClient):
    resp = await client.get("/api/v1/enquiries/config")
    assert resp.status_code == 200
    data = resp.json()

    assert data["currency"] == "INR"
    assert data["recommendation_rules"] == []  # no "Recommended" badges

    wedding = {p["id"]: p for p in data["packages"]["wedding"]}
    assert wedding["wedding.silver"]["price"] == 110000
    assert wedding["wedding.golden"]["price"] == 160000
    assert wedding["wedding.diamond"]["price"] == 220000

    engagement = {p["id"]: p for p in data["packages"]["engagement"]}
    assert engagement["engagement.silver"]["price"] == 40000
    assert engagement["engagement.golden"]["price"] == 60000
    assert engagement["engagement.diamond"]["price"] == 80000

    # wedding.drone exists, engagement.drone exists (namespaced)
    w_addons = {a["id"]: a for a in data["add_ons"]["wedding"]}
    e_addons = {a["id"]: a for a in data["add_ons"]["engagement"]}
    assert w_addons["wedding.drone"]["price"] == 15000
    assert w_addons["wedding.drone"]["per_day"] is True
    assert e_addons["engagement.drone"]["price"] == 12000
    assert e_addons["engagement.drone"]["per_day"] is False
    assert w_addons["wedding.lagan_lakhan"]["per_day"] is False
    assert w_addons["wedding.lagan_lakhan"]["price"] == 12000

    assert "inclusions_note" in data["packages"]["wedding"][0]
    assert "may vary" in data["quotation_note"]

    # Confirmed wedding package inclusions (mapped from owner reference)
    silver = next(p for p in data["packages"]["wedding"] if p["id"] == "wedding.silver")
    golden = next(p for p in data["packages"]["wedding"] if p["id"] == "wedding.golden")
    diamond = next(p for p in data["packages"]["wedding"] if p["id"] == "wedding.diamond")
    assert silver["inclusions"] == ["Traditional Photography", "Traditional Videography"]
    assert golden["inclusions"] == [
        "Traditional Photography", "Traditional Videography", "Candid Photography",
    ]
    assert diamond["inclusions"] == [
        "Traditional Photography", "Traditional Videography",
        "Candid Photography", "Cinematography",
    ]

    # Add-on groups fall into the three fixed categories
    for et in ("wedding", "engagement"):
        groups = {a["group"] for a in data["add_ons"][et]}
        assert groups <= {"Rituals", "Photography", "Editing"}, (et, groups)


# ---------------------------------------------------------------------------
# OTP
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_otp_send_returns_demo_otp(client: AsyncClient):
    data = await _send_otp(client)
    assert len(data["demo_otp"]) == 6
    assert data["demo_otp"].isdigit()
    assert data["expires_in_minutes"] == 5


@pytest.mark.asyncio
async def test_otp_send_invalid_phone_422(client: AsyncClient):
    resp = await client.post("/api/v1/enquiries/otp/send", json={"phone": "12345"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_otp_send_cooldown_429(client: AsyncClient):
    await _send_otp(client)
    resp = await client.post("/api/v1/enquiries/otp/send", json={"phone": PHONE})
    assert resp.status_code == 429


@pytest.mark.asyncio
async def test_otp_resend_invalidates_previous_code(
    client: AsyncClient, monkeypatch
):
    monkeypatch.setattr(es, "RESEND_COOLDOWN_SECONDS", 0)
    first = await _send_otp(client)
    second = await _send_otp(client)
    assert first["demo_otp"] != second["demo_otp"]

    stale = await client.post(
        "/api/v1/enquiries/otp/verify",
        json={"phone": PHONE, "otp_code": first["demo_otp"]},
    )
    assert stale.status_code == 401

    ok = await client.post(
        "/api/v1/enquiries/otp/verify",
        json={"phone": PHONE, "otp_code": second["demo_otp"]},
    )
    assert ok.status_code == 200


@pytest.mark.asyncio
async def test_otp_verify_success_returns_enquiry_jwt_and_lead(
    client: AsyncClient, db_session, monkeypatch
):
    auth = await _authed_flow(client, monkeypatch)

    payload = decode_token(auth["access_token"])
    assert payload["type"] == "enquiry"
    assert payload["phone"] == PHONE
    assert payload["sub"] == auth["lead_id"]

    # Lead created at OTP verify with minimal data, status NEW
    from app.models.enquiry_lead import EnquiryLead

    lead = (
        await db_session.execute(select(EnquiryLead).where(EnquiryLead.phone == PHONE))
    ).scalars().first()
    assert lead is not None
    assert lead.id == auth["lead_id"]
    assert lead.phone_verified is True
    assert lead.status == "NEW"
    assert lead.quotation_total is None

    # Access token (type=access) must NOT work as enquiry token
    from app.core.security import create_access_token

    access = create_access_token({"sub": payload["sub"], "phone": PHONE})
    rejected = await client.post(
        "/api/v1/enquiries",
        json=_quotation_body(),
        headers={"Authorization": f"Bearer {access}"},
    )
    assert rejected.status_code == 401


@pytest.mark.asyncio
async def test_otp_wrong_code_five_attempts_sixth_correct_succeeds(
    client: AsyncClient, monkeypatch
):
    monkeypatch.setattr(es, "RESEND_COOLDOWN_SECONDS", 0)
    sent = await _send_otp(client)
    otp = sent["demo_otp"]
    wrong = "000000" if otp != "000000" else "111111"

    for _ in range(5):
        resp = await client.post(
            "/api/v1/enquiries/otp/verify",
            json={"phone": PHONE, "otp_code": wrong},
        )
        assert resp.status_code == 401

    # Correct code on the 6th attempt still succeeds
    ok = await client.post(
        "/api/v1/enquiries/otp/verify",
        json={"phone": PHONE, "otp_code": otp},
    )
    assert ok.status_code == 200


@pytest.mark.asyncio
async def test_otp_sixth_failed_attempt_invalidates_code(
    client: AsyncClient, db_session, monkeypatch
):
    monkeypatch.setattr(es, "RESEND_COOLDOWN_SECONDS", 0)
    sent = await _send_otp(client)
    otp = sent["demo_otp"]
    wrong = "000000" if otp != "000000" else "111111"

    for _ in range(6):
        resp = await client.post(
            "/api/v1/enquiries/otp/verify",
            json={"phone": PHONE, "otp_code": wrong},
        )
        assert resp.status_code == 401

    # Code is now invalidated — even the correct one fails
    after = await client.post(
        "/api/v1/enquiries/otp/verify",
        json={"phone": PHONE, "otp_code": otp},
    )
    assert after.status_code == 401

    row = (
        await db_session.execute(select(OtpCode).where(OtpCode.phone == PHONE))
    ).scalars().first()
    assert row.used is True
    assert row.attempts == 6


@pytest.mark.asyncio
async def test_otp_expired_code_rejected(client: AsyncClient, db_session, monkeypatch):
    monkeypatch.setattr(es, "RESEND_COOLDOWN_SECONDS", 0)
    sent = await _send_otp(client)

    row = (
        await db_session.execute(select(OtpCode).where(OtpCode.phone == PHONE))
    ).scalars().first()
    row.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    await db_session.commit()

    resp = await client.post(
        "/api/v1/enquiries/otp/verify",
        json={"phone": PHONE, "otp_code": sent["demo_otp"]},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_otp_hashed_not_plaintext(client: AsyncClient, db_session, monkeypatch):
    monkeypatch.setattr(es, "RESEND_COOLDOWN_SECONDS", 0)
    sent = await _send_otp(client)

    row = (
        await db_session.execute(select(OtpCode).where(OtpCode.phone == PHONE))
    ).scalars().first()
    assert row.code_hash != sent["demo_otp"]
    assert sent["demo_otp"] not in row.code_hash


# ---------------------------------------------------------------------------
# Quotation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_quotation_recalculates_backend_price(
    client: AsyncClient, monkeypatch
):
    auth = await _authed_flow(client, monkeypatch)
    resp = await client.post(
        "/api/v1/enquiries",
        json=_quotation_body(),
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()

    # 160000 (Golden) + 20000×2 (Candid) + 15000×2 (Drone)
    assert data["base_price"] == 160000
    assert data["add_on_total"] == 40000 + 30000
    assert data["quotation_total"] == 230000
    assert data["status"] == "QUOTATION_GENERATED"
    assert "may vary" in data["note"]
    assert data["lead_id"] == auth["lead_id"]


@pytest.mark.asyncio
async def test_client_supplied_total_is_ignored(client: AsyncClient, monkeypatch):
    auth = await _authed_flow(client, monkeypatch)
    body = _quotation_body(quotation_total=1, total=1, price=999)
    resp = await client.post(
        "/api/v1/enquiries",
        json=body,
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )
    assert resp.status_code == 201
    assert resp.json()["quotation_total"] == 230000  # recalculated, not 1


@pytest.mark.asyncio
async def test_fixed_add_on_quantity_ignored_as_one(
    client: AsyncClient, monkeypatch
):
    auth = await _authed_flow(client, monkeypatch)
    body = _quotation_body(
        add_ons=[{"id": "wedding.lagan_lakhan", "qty": 3}],  # fixed service
    )
    resp = await client.post(
        "/api/v1/enquiries",
        json=body,
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )
    assert resp.status_code == 400  # fixed add-ons must have qty 1


@pytest.mark.asyncio
async def test_invalid_package_returns_400(client: AsyncClient, monkeypatch):
    auth = await _authed_flow(client, monkeypatch)
    resp = await client.post(
        "/api/v1/enquiries",
        json=_quotation_body(package_id="wedding.platinum"),
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_package_from_other_event_returns_400(
    client: AsyncClient, monkeypatch
):
    auth = await _authed_flow(client, monkeypatch)
    # engagement add-on used on a wedding enquiry
    body = _quotation_body(
        add_ons=[{"id": "engagement.outdoor_couple_shoot", "qty": 1}],
    )
    body["package_id"] = "wedding.silver"
    resp = await client.post(
        "/api/v1/enquiries",
        json=body,
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_invalid_add_on_returns_400(client: AsyncClient, monkeypatch):
    auth = await _authed_flow(client, monkeypatch)
    resp = await client.post(
        "/api/v1/enquiries",
        json=_quotation_body(add_ons=[{"id": "wedding.nope", "qty": 1}]),
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_quantity_out_of_range_returns_400(client: AsyncClient, monkeypatch):
    auth = await _authed_flow(client, monkeypatch)
    resp = await client.post(
        "/api/v1/enquiries",
        json=_quotation_body(add_ons=[{"id": "wedding.drone", "qty": 4}]),
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_day2_venue_is_optional_but_day1_required(
    client: AsyncClient, monkeypatch
):
    auth = await _authed_flow(client, monkeypatch)

    # One-day wedding (only Day 1) is valid
    ok = await client.post(
        "/api/v1/enquiries",
        json=_quotation_body(venues={"day1": "Only day one"}),
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )
    assert ok.status_code == 201
    assert ok.json()["venues"] == {"day1": "Only day one"}

    # Day 1 missing → rejected
    bad = await client.post(
        "/api/v1/enquiries",
        json=_quotation_body(venues={"day2": "Only day two"}),
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )
    assert bad.status_code == 422


@pytest.mark.asyncio
async def test_past_event_date_rejected(client: AsyncClient, monkeypatch):
    auth = await _authed_flow(client, monkeypatch)
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    resp = await client.post(
        "/api/v1/enquiries",
        json=_quotation_body(event_date=yesterday),
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )
    assert resp.status_code == 422
    assert "past" in resp.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_engagement_flow_requires_venue(client: AsyncClient, monkeypatch):
    auth = await _authed_flow(client, monkeypatch)
    resp = await client.post(
        "/api/v1/enquiries",
        json=_quotation_body(
            event_type="engagement",
            venues={"venue": "Hotel Kingsway"},
            package_id="engagement.silver",
            add_ons=[{"id": "engagement.drone", "qty": 1}],
        ),
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    # 40000 (engagement silver) + 12000 (engagement drone)
    assert data["quotation_total"] == 52000


@pytest.mark.asyncio
async def test_create_quotation_requires_enquiry_token(client: AsyncClient):
    resp = await client.post("/api/v1/enquiries", json=_quotation_body())
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_lead_status_updated_to_quotation_generated(
    client: AsyncClient, db_session, monkeypatch
):
    auth = await _authed_flow(client, monkeypatch)
    await client.post(
        "/api/v1/enquiries",
        json=_quotation_body(),
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )

    from app.models.enquiry_lead import EnquiryLead

    lead = (
        await db_session.execute(
            select(EnquiryLead).where(EnquiryLead.id == auth["lead_id"])
        )
    ).scalars().first()
    assert lead.status == "QUOTATION_GENERATED"
    assert lead.package_id == "wedding.golden"
    assert lead.quotation_total == 230000


# ---------------------------------------------------------------------------
# Leads (admin/photographer only)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_leads_unauthenticated_401(client: AsyncClient):
    resp = await client.get("/api/v1/leads")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_leads_forbidden_for_client(
    client: AsyncClient, test_users, client_token
):
    resp = await client.get(
        "/api/v1/leads", headers={"Authorization": f"Bearer {client_token}"}
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_leads_list_search_and_filter(
    client: AsyncClient, test_users, admin_token, monkeypatch
):
    auth = await _authed_flow(client, monkeypatch)
    await client.post(
        "/api/v1/enquiries",
        json=_quotation_body(),
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )

    headers = {"Authorization": f"Bearer {admin_token}"}
    all_leads = await client.get("/api/v1/leads", headers=headers)
    assert all_leads.status_code == 200
    body = all_leads.json()
    assert body["total"] >= 1
    assert any(i["phone"] == PHONE for i in body["items"])

    # search by phone
    search = await client.get(f"/api/v1/leads?search={PHONE}", headers=headers)
    assert search.status_code == 200
    assert search.json()["total"] == 1

    # filter by status
    filtered = await client.get(
        "/api/v1/leads?status=QUOTATION_GENERATED", headers=headers
    )
    assert filtered.status_code == 200
    assert all(i["status"] == "QUOTATION_GENERATED" for i in filtered.json()["items"])

    # invalid status filter → 400
    bad = await client.get("/api/v1/leads?status=NOPE", headers=headers)
    assert bad.status_code == 400


@pytest.mark.asyncio
async def test_lead_status_patch(
    client: AsyncClient, test_users, admin_token, photographer_token, monkeypatch
):
    auth = await _authed_flow(client, monkeypatch)
    await client.post(
        "/api/v1/enquiries",
        json=_quotation_body(),
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )

    admin = {"Authorization": f"Bearer {admin_token}"}
    leads = await client.get("/api/v1/leads", headers=admin)
    lead_id = next(i["id"] for i in leads.json()["items"] if i["phone"] == PHONE)

    ok = await client.patch(
        f"/api/v1/leads/{lead_id}", json={"status": "CONTACTED"}, headers=admin
    )
    assert ok.status_code == 200
    assert ok.json()["status"] == "CONTACTED"

    # photographer can also update
    photog = {"Authorization": f"Bearer {photographer_token}"}
    ok2 = await client.patch(
        f"/api/v1/leads/{lead_id}", json={"status": "BOOKED"}, headers=photog
    )
    assert ok2.status_code == 200

    # invalid status → 400
    bad = await client.patch(
        f"/api/v1/leads/{lead_id}", json={"status": "WOW"}, headers=admin
    )
    assert bad.status_code == 400

    # missing lead → 404
    missing = await client.patch(
        "/api/v1/leads/does-not-exist", json={"status": "BOOKED"}, headers=admin
    )
    assert missing.status_code == 404


# ---------------------------------------------------------------------------
# Rate limiting (explicitly re-enabled)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_enquiry_rate_limit(client: AsyncClient, monkeypatch):
    monkeypatch.setattr(rate_limit.settings, "RATE_LIMIT_ENABLED", True)
    monkeypatch.setattr(
        rate_limit, "_enquiries_bucket", rate_limit.TokenBucket(rate=0.0, burst=1)
    )
    try:
        first = await client.get("/api/v1/enquiries/config")
        assert first.status_code == 200
        second = await client.get("/api/v1/enquiries/config")
        assert second.status_code == 429
    finally:
        rate_limit.settings.RATE_LIMIT_ENABLED = False
        monkeypatch.undo()
