"""Enquiry/Quotation service — OTP verification, lead capture and the
authoritative backend pricing calculation.

Security rules enforced here:
* Phone validated server-side (10-digit Indian mobile).
* OTP: SHA-256 hashed, 5-min expiry, resend invalidates previous codes,
  30-second per-phone resend cooldown, max 5 failed attempts — the 6th
  failed attempt invalidates the OTP.
* Quotation: every price is recalculated from ``pricing_config``. Any
  client-supplied total is ignored (the request schema has no total field).
"""

import hashlib
import logging
import re
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core import pricing_config as pricing
from app.core.config import settings
from app.core.errors import (
    BadRequestError,
    NotFoundError,
    RateLimitError,
    UnauthorizedError,
    ValidationError,
)
from app.core.security import create_access_token, generate_otp
from app.repositories.enquiry_lead_repository import EnquiryLeadRepository
from app.repositories.otp_code_repository import OtpCodeRepository
from app.schemas.enquiry import (
    EnquiryCreateRequest,
    EnquiryOtpSendResponse,
    EnquiryTokenResponse,
    LeadResponse,
    QuotationAddOnLine,
    QuotationPackage,
    QuotationResponse,
)

logger = logging.getLogger(__name__)

RESEND_COOLDOWN_SECONDS = 30
MAX_OTP_ATTEMPTS = 6  # the 6th failed attempt invalidates the OTP
ENQUIRY_TOKEN_TTL_MINUTES = 30

_INDIAN_MOBILE_RE = re.compile(r"^[6-9]\d{9}$")
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

QUOTATION_NOTE = pricing.QUOTATION_NOTE


class EnquiryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.otp_repo = OtpCodeRepository(db)
        self.lead_repo = EnquiryLeadRepository(db)

    # ------------------------------------------------------------------
    # Phone + OTP
    # ------------------------------------------------------------------
    @staticmethod
    def _hash_otp(otp: str) -> str:
        return hashlib.sha256(f"{otp}::{settings.SECRET_KEY}".encode()).hexdigest()

    @staticmethod
    def normalize_phone(raw: str) -> str:
        digits = re.sub(r"\D", "", raw or "")
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        if len(digits) == 11 and digits.startswith("0"):
            digits = digits[1:]
        if not _INDIAN_MOBILE_RE.match(digits):
            raise ValidationError(
                message="Enter a valid 10-digit Indian mobile number"
            )
        return digits

    async def send_otp(self, phone: str) -> EnquiryOtpSendResponse:
        phone = self.normalize_phone(phone)

        latest = await self.otp_repo.get_latest_for_phone(phone)
        if latest and latest.created_at:
            age = (datetime.now(timezone.utc) - latest.created_at).total_seconds()
            if age < RESEND_COOLDOWN_SECONDS:
                wait = int(RESEND_COOLDOWN_SECONDS - age) + 1
                raise RateLimitError(
                    message=f"Please wait {wait} seconds before requesting a new code"
                )

        # Resend invalidates any previous outstanding code for this phone.
        await self.otp_repo.invalidate_for_identifier(phone=phone, email=None)

        otp = generate_otp()
        await self.otp_repo.create(
            phone=phone,
            email=None,
            code_hash=self._hash_otp(otp),
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
            used=False,
            attempts=0,
        )
        # NOTE: plaintext OTP is never logged or stored — only the hash.
        return EnquiryOtpSendResponse(
            message="OTP sent successfully",
            demo_otp=otp if settings.DEMO_OTP else None,
            expires_in_minutes=settings.OTP_EXPIRE_MINUTES,
        )

    async def verify_otp(self, phone: str, otp_code: str) -> EnquiryTokenResponse:
        phone = self.normalize_phone(phone)

        row = await self.otp_repo.get_latest_valid(phone=phone)
        if not row:
            raise UnauthorizedError(message="No pending OTP found. Request a new code.")
        if row.expires_at <= datetime.now(timezone.utc):
            raise UnauthorizedError(message="OTP has expired. Request a new code.")

        if not secrets.compare_digest(row.code_hash, self._hash_otp(otp_code)):
            row.attempts = (row.attempts or 0) + 1
            if row.attempts >= MAX_OTP_ATTEMPTS:
                row.used = True
                row.consumed_at = datetime.now(timezone.utc)
                logger.warning("OTP invalidated after %s failed attempts (phone %s)", row.attempts, phone)
            await self.db.commit()  # persist BEFORE raising — the request
            # teardown rolls back on exceptions, which would lose the counter.
            raise UnauthorizedError(message="Invalid OTP code")

        row.used = True
        row.consumed_at = datetime.now(timezone.utc)
        await self.otp_repo.session.flush()

        lead = await self._upsert_lead(phone)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=ENQUIRY_TOKEN_TTL_MINUTES)
        token = create_access_token(
            {"sub": lead.id, "phone": phone},
            expires_delta=timedelta(minutes=ENQUIRY_TOKEN_TTL_MINUTES),
            token_type="enquiry",
        )
        logger.info("Enquiry OTP verified for phone %s (lead %s)", phone, lead.id)
        return EnquiryTokenResponse(
            access_token=token,
            token_type="bearer",
            expires_at=expires_at,
            phone=phone,
            lead_id=lead.id,
        )

    async def _upsert_lead(self, phone: str):
        lead = await self.lead_repo.get_latest_by_phone(phone)
        if lead:
            if not lead.phone_verified:
                lead.phone_verified = True
                await self.lead_repo.session.flush()
            return lead
        return await self.lead_repo.create(
            phone=phone,
            phone_verified=True,
            status=pricing.DEFAULT_LEAD_STATUS,
        )

    # ------------------------------------------------------------------
    # Quotation (backend is the pricing authority)
    # ------------------------------------------------------------------
    async def create_quotation(
        self, lead_id: str, phone: str, data: EnquiryCreateRequest
    ) -> QuotationResponse:
        lead = await self.lead_repo.get(lead_id)
        if not lead or lead.phone != phone:
            raise UnauthorizedError(message="Invalid enquiry session")

        event_type = data.event_type
        if event_type not in [e["value"] for e in pricing.EVENT_TYPES]:
            raise BadRequestError(message="Invalid event type")

        couple_name = data.couple_name.strip()
        if not couple_name:
            raise ValidationError(message="Couple name is required")

        event_date = (data.event_date or "").strip()
        if not _DATE_RE.match(event_date):
            raise ValidationError(message="Event date must be in YYYY-MM-DD format")
        try:
            parsed_date = datetime.strptime(event_date, "%Y-%m-%d").date()
        except ValueError:
            raise ValidationError(message="Event date is not a valid date")
        if parsed_date < datetime.now(timezone.utc).date():
            raise ValidationError(message="Event date cannot be in the past")

        venues = data.venues or {}
        if event_type == "wedding":
            day1 = (venues.get("day1") or "").strip()
            if not day1:
                raise ValidationError(message="Day 1 venue is required")
            day2 = (venues.get("day2") or "").strip()
            # Day 2 is optional — one-day weddings are valid.
            venues = {"day1": day1}
            if day2:
                venues["day2"] = day2
        else:
            venue = (venues.get("venue") or "").strip()
            if not venue:
                raise ValidationError(message="Engagement venue is required")
            venues = {"venue": venue}

        package = pricing.get_package(event_type, data.package_id)
        if not package:
            raise BadRequestError(message="Invalid package for the selected event type")

        seen_ids: set[str] = set()
        lines: list[QuotationAddOnLine] = []
        for sel in data.add_ons:
            add_on = pricing.get_add_on(event_type, sel.id)
            if not add_on:
                raise BadRequestError(
                    message=f"Invalid add-on for the selected event type: {sel.id}"
                )
            if sel.id in seen_ids:
                raise BadRequestError(message=f"Duplicate add-on: {add_on['name']}")
            seen_ids.add(sel.id)

            if not add_on["per_day"] and sel.qty != 1:
                raise BadRequestError(
                    message=f"{add_on['name']} is a fixed service — quantity must be 1"
                )
            if sel.qty < pricing.MIN_ADD_ON_QTY or sel.qty > pricing.MAX_ADD_ON_QTY:
                raise BadRequestError(
                    message=f"Quantity must be between {pricing.MIN_ADD_ON_QTY} and {pricing.MAX_ADD_ON_QTY}"
                )

            lines.append(
                QuotationAddOnLine(
                    id=add_on["id"],
                    name=add_on["name"],
                    price=add_on["price"],
                    per_day=add_on["per_day"],
                    qty=sel.qty,
                    line_total=pricing.calc_line_total(add_on, sel.qty),
                )
            )

        base_price = int(package["price"])
        add_on_total = sum(line.line_total for line in lines)
        total = pricing.calc_total(base_price, [line.line_total for line in lines])

        # Persist — backend numbers only, nothing from the browser.
        lead.event_type = event_type
        lead.couple_name = couple_name
        lead.event_date = event_date
        lead.venues = venues
        lead.package_id = package["id"]
        lead.package_name = package["name"]
        lead.package_price = base_price
        lead.add_ons = [line.model_dump() for line in lines]
        lead.quotation_total = total
        lead.status = "QUOTATION_GENERATED"
        await self.lead_repo.session.flush()

        logger.info(
            "Quotation generated: lead %s, package %s, total %s",
            lead.id, package["id"], total,
        )
        return QuotationResponse(
            lead_id=lead.id,
            phone=lead.phone,
            event_type=event_type,
            couple_name=couple_name,
            event_date=event_date,
            venues=venues,
            package=QuotationPackage(**package),
            add_ons=lines,
            base_price=base_price,
            add_on_total=add_on_total,
            quotation_total=total,
            status=lead.status,
            note=QUOTATION_NOTE,
            created_at=lead.created_at,
        )

    # ------------------------------------------------------------------
    # Leads (admin)
    # ------------------------------------------------------------------
    async def list_leads(
        self,
        status: str | None = None,
        event_type: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ):
        if status and status not in pricing.LEAD_STATUSES:
            raise BadRequestError(message="Invalid lead status filter")
        if event_type and event_type not in [e["value"] for e in pricing.EVENT_TYPES]:
            raise BadRequestError(message="Invalid event type filter")
        items, total = await self.lead_repo.list_filtered(
            status=status, event_type=event_type, search=search, skip=skip, limit=limit,
        )
        return [LeadResponse.model_validate(i) for i in items], total

    async def update_lead_status(self, lead_id: str, status: str) -> LeadResponse:
        if status not in pricing.LEAD_STATUSES:
            raise BadRequestError(
                message=f"Invalid status. Allowed: {', '.join(pricing.LEAD_STATUSES)}"
            )
        lead = await self.lead_repo.get(lead_id)
        if not lead:
            raise NotFoundError(message="Lead not found")
        lead.status = status
        await self.lead_repo.session.flush()
        return LeadResponse.model_validate(lead)
