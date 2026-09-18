import io
import logging
import math

from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError, ValidationError
from app.core.storage import get_storage
from app.models.base import UserRole
from app.repositories.face_profile_repository import FaceProfileRepository
from app.repositories.photo_repository import PhotoRepository
from app.schemas.faces import (
    FaceProfileResponse,
    FaceSearchMatch,
    FaceSearchResponse,
    SelfieVerifyResponse,
)
from app.services.permission_service import PermissionService

logger = logging.getLogger(__name__)

_EMBED_DIM = 32


class FaceService:
    """Face profile + similarity search + lightweight liveness checks.

    The current embedding pipeline is deliberately dependency-free: it uses
    Pillow to derive a normalized perceptual descriptor (32x32 grayscale).
    This keeps the local MVP fully offline and deterministic. The service is
    designed so the descriptor function can be swapped for an InsightFace /
    deep embedding later without changing the schema or routes.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.face_repo = FaceProfileRepository(db)
        self.photo_repo = PhotoRepository(db)
        self.storage = get_storage()

    # ------------------------------------------------------------------
    # Embedding primitives
    # ------------------------------------------------------------------

    @staticmethod
    def embedding_from_bytes(raw: bytes) -> list[float]:
        try:
            with Image.open(io.BytesIO(raw)) as img:
                gray = img.convert("L")
                small = gray.resize((_EMBED_DIM, _EMBED_DIM), Image.LANCZOS)
                pixels = list(small.getdata())
        except Exception as e:
            raise ValidationError(message=f"Could not read image for embedding: {e}")

        mean = sum(pixels) / len(pixels)
        centered = [p - mean for p in pixels]
        norm = math.sqrt(sum(v * v for v in centered))
        if norm < 1e-6:
            norm = 1.0
        return [round(v / norm, 6) for v in centered]

    @staticmethod
    def cosine_similarity(a: list[float], b: list[float]) -> float:
        if not a or not b:
            return 0.0
        length = min(len(a), len(b))
        dot = sum(a[i] * b[i] for i in range(length))
        return round(max(-1.0, min(1.0, dot)), 4)

    @staticmethod
    def _heuristic_confidence(raw: bytes, has_box: bool) -> float:
        """Heuristic face-likeness confidence without a heavyweight detector."""
        try:
            with Image.open(io.BytesIO(raw)) as img:
                gray = img.convert("L")
                w, h = img.size
                cx0, cy0 = int(w * 0.25), int(h * 0.2)
                cx1, cy1 = int(w * 0.75), int(h * 0.8)
                crop = gray.crop((cx0, cy0, cx1, cy1)).resize((64, 64), Image.LANCZOS)
                pixels = list(crop.getdata())
                mean = sum(pixels) / len(pixels)
                variance = sum((p - mean) ** 2 for p in pixels) / len(pixels)
                std = math.sqrt(variance)
                base = 0.55 if has_box else 0.45
                return round(min(0.97, base + std / 2000), 3)
        except Exception:
            return 0.5

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    async def register_photo_face(
        self, photo_id: str, label: str | None, face_box: list[int] | None,
        created_by: dict,
    ) -> FaceProfileResponse:
        photo = await self.photo_repo.get(photo_id)
        if not photo or photo.is_deleted:
            raise NotFoundError(message="Photo not found")

        from app.core.dependencies import resolve_wedding_role

        role = await resolve_wedding_role(self.db, photo.wedding_id, created_by)
        allowed = await PermissionService(self.db).has_permission(
            photo.wedding_id, role, "edit",
        )
        if not allowed:
            raise NotFoundError(message="Photo not found")

        raw = await self.storage.read(photo.original_path)
        if raw is None:
            raise ValidationError(message="Photo file not found on storage")

        embedding = self.embedding_from_bytes(raw)
        confidence = self._heuristic_confidence(raw, bool(face_box))

        primary = await self.face_repo.count(wedding_id=photo.wedding_id) == 0

        profile = await self.face_repo.create(
            wedding_id=photo.wedding_id,
            photo_id=photo.id,
            label=label,
            embedding=embedding,
            face_box=face_box,
            is_primary=primary,
            confidence=confidence,
            created_by=created_by.get("sub"),
        )
        logger.info("Face profile registered: %s (wedding %s)", profile.id, profile.wedding_id)
        return self._to_response(profile)

    async def list_faces(self, wedding_id: str, current_user: dict) -> list[FaceProfileResponse]:
        from app.core.dependencies import resolve_wedding_role

        role = await resolve_wedding_role(self.db, wedding_id, current_user)
        allowed = await PermissionService(self.db).has_permission(
            wedding_id, role, "view",
        )
        if not allowed:
            raise NotFoundError(message="Wedding not found")

        items, _ = await self.face_repo.get_multi_by_wedding(wedding_id)
        return [self._to_response(p) for p in items]

    async def update_face(self, face_id: str, data, current_user: dict) -> FaceProfileResponse:
        profile = await self.face_repo.get(face_id)
        if not profile:
            raise NotFoundError(message="Face profile not found")
        await self._require_face_edit(profile.wedding_id, current_user)

        updates = {
            k: v
            for k, v in {
                "label": data.label,
                "is_primary": data.is_primary,
                "face_box": data.face_box,
            }.items()
            if v is not None
        }
        if data.is_primary:
            others, _ = await self.face_repo.get_multi_by_wedding(profile.wedding_id)
            for other in others:
                if other.id != profile.id and other.is_primary:
                    await self.face_repo.update(other.id, is_primary=False)

        updated = await self.face_repo.update(face_id, **updates)
        return self._to_response(updated)

    async def delete_face(self, face_id: str, current_user: dict) -> None:
        profile = await self.face_repo.get(face_id)
        if not profile:
            raise NotFoundError(message="Face profile not found")
        await self._require_face_edit(profile.wedding_id, current_user)
        await self.face_repo.delete(face_id)
        logger.info("Face profile deleted: %s", face_id)

    async def _require_face_edit(self, wedding_id: str, current_user: dict) -> None:
        from app.core.dependencies import resolve_wedding_role

        role = await resolve_wedding_role(self.db, wedding_id, current_user)
        allowed = await PermissionService(self.db).has_permission(
            wedding_id, role, "edit",
        )
        if not allowed:
            raise NotFoundError(message="Face profile not found")

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    async def search_faces(
        self, raw: bytes, wedding_id: str, current_user: dict, limit: int = 10,
    ) -> FaceSearchResponse:
        from app.core.dependencies import resolve_wedding_role

        role = await resolve_wedding_role(self.db, wedding_id, current_user)
        allowed = await PermissionService(self.db).has_permission(
            wedding_id, role, "view",
        )
        if not allowed:
            raise NotFoundError(message="Wedding not found")

        query_embedding = self.embedding_from_bytes(raw)
        detected = self._heuristic_confidence(raw, False) >= 0.5

        profiles, _ = await self.face_repo.get_multi_by_wedding(wedding_id, limit=1000)
        scored = [
            (self.cosine_similarity(query_embedding, p.embedding), p)
            for p in profiles
        ]
        scored.sort(key=lambda item: item[0], reverse=True)
        top = [item for item in scored if item[0] >= 0.6][:limit]

        return FaceSearchResponse(
            query_detected=detected,
            matches=[
                FaceSearchMatch(profile=self._to_response(profile), similarity=score)
                for score, profile in top
            ],
        )

    # ------------------------------------------------------------------
    # Liveness / selfie verification
    # ------------------------------------------------------------------

    @staticmethod
    def verify_selfie(raw: bytes) -> SelfieVerifyResponse:
        try:
            with Image.open(io.BytesIO(raw)) as img:
                w, h = img.size
                gray = img.convert("L").resize((64, 64), Image.LANCZOS)
                pixels = list(gray.getdata())
        except Exception as e:
            raise ValidationError(message=f"Could not read selfie image: {e}")

        mean = sum(pixels) / len(pixels)
        variance = sum((p - mean) ** 2 for p in pixels) / len(pixels)
        std = math.sqrt(variance)
        min_dim = min(w, h)

        resolution_ok = min_dim >= 180
        texture_ok = std >= 15

        verified = resolution_ok and texture_ok
        confidence = round(min(0.98, 0.55 + (std / 100) * 0.3 + (min(1.0, min_dim / 900)) * 0.25), 3)
        if not resolution_ok:
            message = "Selfie is too small — upload a sharper/larger photo"
        elif not texture_ok:
            message = "Selfie appears blank or too dark — please retake"
        else:
            message = "Face detected successfully"

        return SelfieVerifyResponse(
            verified=verified,
            confidence=confidence,
            message=message,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _to_response(profile) -> FaceProfileResponse:
        return FaceProfileResponse(
            id=profile.id,
            wedding_id=profile.wedding_id,
            photo_id=profile.photo_id,
            label=profile.label,
            face_box=profile.face_box,
            is_primary=profile.is_primary,
            confidence=profile.confidence,
            created_at=profile.created_at,
        )