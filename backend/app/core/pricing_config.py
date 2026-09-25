"""Central pricing & package configuration for the TJ PHOTOGRAPHY quotation
system.

This module is the SINGLE source of truth for packages, add-ons and pricing.

* The frontend receives it via ``GET /api/v1/enquiries/config`` and must never
  hardcode prices inside React components.
* The backend recalculates every quotation from this config — client-supplied
  totals are always ignored.

GOLDEN RULE: do not invent business data. Wedding package inclusions are
confirmed from the owner's quotation reference. Engagement package inclusions
stay empty (UI falls back to ``INCLUSIONS_NOTE``) until the owner provides them.
"""

from typing import Any

CURRENCY = "INR"

INCLUSIONS_NOTE = "Inclusions to be confirmed"

QUOTATION_NOTE = (
    "Final quotation may vary based on confirmed requirements, availability, "
    "travel, and other applicable requirements."
)

EVENT_TYPES: list[dict[str, str]] = [
    {"value": "wedding", "label": "Wedding"},
    {"value": "engagement", "label": "Engagement"},
]

# ---------------------------------------------------------------------------
# Packages (prices in whole Rupees)
# `inclusions` = confirmed services included in the package.
# Reference naming mapped to readable names:
#   Tred Photo → Traditional Photography, Tred Video → Traditional Videography,
#   Candid Photos → Candid Photography, Cinematographer → Cinematography
# ---------------------------------------------------------------------------
_PACKAGES: dict[str, list[dict[str, Any]]] = {
    "wedding": [
        {
            "id": "wedding.silver",
            "name": "Silver",
            "price": 110000,
            "inclusions": [
                "Traditional Photography",
                "Traditional Videography",
            ],
        },
        {
            "id": "wedding.golden",
            "name": "Golden",
            "price": 160000,
            "inclusions": [
                "Traditional Photography",
                "Traditional Videography",
                "Candid Photography",
            ],
        },
        {
            "id": "wedding.diamond",
            "name": "Diamond",
            "price": 220000,
            "inclusions": [
                "Traditional Photography",
                "Traditional Videography",
                "Candid Photography",
                "Cinematography",
            ],
        },
    ],
    "engagement": [
        # Inclusions pending reference — fill once confirmed by the owner.
        {"id": "engagement.silver", "name": "Silver", "price": 40000, "inclusions": []},
        {"id": "engagement.golden", "name": "Golden", "price": 60000, "inclusions": []},
        {"id": "engagement.diamond", "name": "Diamond", "price": 80000, "inclusions": []},
    ],
}

# ---------------------------------------------------------------------------
# Extra services. ``per_day=True`` means price is charged per day and the
# customer picks 1-3 days; fixed services are always quantity 1.
# IDs are namespaced per event type (wedding.drone != engagement.drone).
# ---------------------------------------------------------------------------
_ADD_ONS: dict[str, list[dict[str, Any]]] = {
    "wedding": [
        # Rituals (fixed)
        {"id": "wedding.lagan_lakhan", "name": "Lagan Lakhan", "price": 12000, "per_day": False, "group": "Rituals"},
        {"id": "wedding.vana_rasham", "name": "Vana Rasham", "price": 12000, "per_day": False, "group": "Rituals"},
        {"id": "wedding.mahendi_rasham", "name": "Mahendi Rasham", "price": 12000, "per_day": False, "group": "Rituals"},
        # Photography (per day)
        {"id": "wedding.reels_shooter", "name": "Reels Shooter", "price": 10000, "per_day": True, "group": "Photography"},
        {"id": "wedding.rituals_photographer", "name": "Rituals Photographer", "price": 12000, "per_day": True, "group": "Photography"},
        {"id": "wedding.rituals_videographer", "name": "Rituals Videographer", "price": 12000, "per_day": True, "group": "Photography"},
        {"id": "wedding.candid_photographer", "name": "Candid Photographer", "price": 20000, "per_day": True, "group": "Photography"},
        {"id": "wedding.cinematographer", "name": "Cinematographer", "price": 35000, "per_day": True, "group": "Photography"},
        {"id": "wedding.family_photographer", "name": "Family Photographer", "price": 15000, "per_day": True, "group": "Photography"},
        {"id": "wedding.drone", "name": "Drone", "price": 15000, "per_day": True, "group": "Photography"},
        {"id": "wedding.drone_fpv", "name": "Drone + FPV", "price": 25000, "per_day": True, "group": "Photography"},
        # Editing (fixed)
        {"id": "wedding.same_day_highlight", "name": "Same Day Wedding Highlight", "price": 25000, "per_day": False, "group": "Editing"},
        {"id": "wedding.urgent_reel", "name": "Urgent One Reel", "price": 4000, "per_day": False, "group": "Editing"},
        {"id": "wedding.urgent_story", "name": "One Urgent Insta Story", "price": 1000, "per_day": False, "group": "Editing"},
        {"id": "wedding.insta_post", "name": "One Instagram Post", "price": 2000, "per_day": False, "group": "Editing"},
    ],
    "engagement": [
        # Rituals
        {"id": "engagement.kanu_pagala", "name": "Kanu-Pagala", "price": 15000, "per_day": False, "group": "Rituals"},
        # Photography (all fixed-price)
        {"id": "engagement.outdoor_couple_shoot", "name": "Outdoor Couple Shoot", "price": 20000, "per_day": False, "group": "Photography"},
        {"id": "engagement.family_photographer", "name": "Family Photographer", "price": 15000, "per_day": False, "group": "Photography"},
        {"id": "engagement.drone", "name": "Drone", "price": 12000, "per_day": False, "group": "Photography"},
        # Editing
        {"id": "engagement.same_day_highlight", "name": "Same Day Highlight", "price": 15000, "per_day": False, "group": "Editing"},
        {"id": "engagement.urgent_reel", "name": "Urgent One Reel", "price": 5000, "per_day": False, "group": "Editing"},
        {"id": "engagement.urgent_story", "name": "One Urgent Insta Story", "price": 1000, "per_day": False, "group": "Editing"},
        {"id": "engagement.insta_post", "name": "One Instagram Post", "price": 2000, "per_day": False, "group": "Editing"},
    ],
}

# ---------------------------------------------------------------------------
# Recommendation rules — intentionally EMPTY.
# No "Recommended" badge is shown until the owner provides real business rules.
# Example future rule shape (do not invent one):
#   {"id": "rule-1", "when": {"min_days": 3}, "recommend": "wedding.diamond"}
# ---------------------------------------------------------------------------
RECOMMENDATION_RULES: list[dict[str, Any]] = []

# ---------------------------------------------------------------------------
# Lead lifecycle (configurable)
# ---------------------------------------------------------------------------
LEAD_STATUSES: list[str] = [
    "NEW",
    "QUOTATION_GENERATED",
    "CONTACTED",
    "FOLLOW_UP",
    "BOOKED",
    "LOST",
]
DEFAULT_LEAD_STATUS = "NEW"

# Per-day add-on quantity bounds
MIN_ADD_ON_QTY = 1
MAX_ADD_ON_QTY = 3


def packages_for(event_type: str) -> list[dict[str, Any]]:
    return [
        dict(p, inclusions=list(p.get("inclusions", [])), inclusions_note=INCLUSIONS_NOTE)
        for p in _PACKAGES.get(event_type, [])
    ]


def add_ons_for(event_type: str) -> list[dict[str, Any]]:
    return [dict(a) for a in _ADD_ONS.get(event_type, [])]


def get_package(event_type: str, package_id: str) -> dict[str, Any] | None:
    for p in _PACKAGES.get(event_type, []):
        if p["id"] == package_id:
            return dict(p, inclusions=list(p.get("inclusions", [])), inclusions_note=INCLUSIONS_NOTE)
    return None


def get_add_on(event_type: str, add_on_id: str) -> dict[str, Any] | None:
    for a in _ADD_ONS.get(event_type, []):
        if a["id"] == add_on_id:
            return dict(a)
    return None


def calc_line_total(add_on: dict[str, Any], qty: int) -> int:
    """Price for one add-on line: fixed services ignore qty (always 1 unit)."""
    if add_on["per_day"]:
        return int(add_on["price"]) * qty
    return int(add_on["price"])


def calc_total(package_price: int, line_totals: list[int]) -> int:
    return int(package_price) + sum(line_totals)


def get_public_config() -> dict[str, Any]:
    """Payload for GET /api/v1/enquiries/config."""
    return {
        "event_types": [dict(e) for e in EVENT_TYPES],
        "packages": {et: packages_for(et) for et in _PACKAGES},
        "add_ons": {et: add_ons_for(et) for et in _ADD_ONS},
        "recommendation_rules": [dict(r) for r in RECOMMENDATION_RULES],
        "lead_statuses": list(LEAD_STATUSES),
        "inclusions_note": INCLUSIONS_NOTE,
        "quotation_note": QUOTATION_NOTE,
        "currency": CURRENCY,
        "min_add_on_qty": MIN_ADD_ON_QTY,
        "max_add_on_qty": MAX_ADD_ON_QTY,
    }
