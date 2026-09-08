import hashlib
import io
import logging
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from app.core.config import settings
from app.core.errors import ValidationError
from app.core.storage import get_storage

logger = logging.getLogger(__name__)

MAX_IMAGE_PIXELS = 40_000_000
MAX_IMAGE_DIMENSION = 16_384

_MAGIC_PREFIXES: dict[str, list[bytes]] = {
    "jpeg": [b"\xff\xd8\xff"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "webp": [b"RIFF"],
    "tiff": [b"II*\x00", b"MM\x00*"],
}

_EXT_TO_FORMAT: dict[str, str] = {
    ".jpg": "jpeg",
    ".jpeg": "jpeg",
    ".png": "png",
    ".webp": "webp",
    ".tiff": "tiff",
}

_EXT_TO_MIME: dict[str, str] = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".tiff": "image/tiff",
}


def _sniff_format(raw: bytes) -> str | None:
    for fmt, prefixes in _MAGIC_PREFIXES.items():
        for prefix in prefixes:
            if len(raw) >= len(prefix) and raw.startswith(prefix):
                if fmt == "webp":
                    if len(raw) >= 12 and raw[8:12] == b"WEBP":
                        return "webp"
                    return None
                return fmt
    return None


class ImageProcessingService:
    def __init__(self):
        self.storage = get_storage()

    async def validate_bytes(self, raw_bytes: bytes, filename: str) -> tuple[int, int]:
        """Validate uploaded bytes BEFORE persistence.

        Checks: allowed extension, magic-byte signature matches the declared
        extension, PIL can fully verify the image, and pixel/dimension caps.
        Returns (width, height) of the decoded image. Raises ValidationError.
        """
        ext = Path(filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise ValidationError(message=f"File type not allowed: {ext}")

        if ext == ".heic":
            raise ValidationError(
                message="HEIC format is not supported yet — please convert to JPEG or PNG"
            )

        fmt = _sniff_format(raw_bytes)
        if fmt is None:
            raise ValidationError(
                message="File content does not match a supported image format"
            )

        expected = _EXT_TO_FORMAT.get(ext)
        if expected and expected != fmt:
            raise ValidationError(
                message=f"File extension {ext} does not match actual format '{fmt}'"
            )

        width = height = 0
        try:
            with Image.open(io.BytesIO(raw_bytes)) as img:
                img.verify()
            with Image.open(io.BytesIO(raw_bytes)) as img:
                width, height = img.size
        except Exception as e:
            raise ValidationError(message=f"Invalid image file: {e}")

        if not width or not height:
            raise ValidationError(message="Image has no usable dimensions")

        if width * height > MAX_IMAGE_PIXELS:
            raise ValidationError(
                message=f"Image too large: {width}x{height} exceeds {MAX_IMAGE_PIXELS} pixels"
            )
        if max(width, height) > MAX_IMAGE_DIMENSION:
            raise ValidationError(
                message=f"Image dimension exceeds max {MAX_IMAGE_DIMENSION}px"
            )
        return width, height

    def mime_for_ext(self, ext: str) -> str:
        return _EXT_TO_MIME.get(ext.lower(), "application/octet-stream")

    async def process(self, storage_path: str, filename: str, wedding_id: str, file_id: str,
                      watermark_settings: dict | None = None) -> dict:
        raw = await self.storage.read(storage_path)
        if raw is None:
            raise ValidationError(message="Image file not found in storage")

        # Defense-in-depth: the bytes may have been touched since upload validation.
        await self.validate_bytes(raw, filename)

        ext = Path(filename).suffix.lower()
        base_relative = f"weddings/{wedding_id}"
        sizes = settings.IMAGE_SIZES
        result = {}

        try:
            img = Image.open(io.BytesIO(raw))
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")

            result["width"], result["height"] = img.size

            result["blur_hash"] = self._compute_blur_hash(img)

            watermark_enabled = watermark_settings and watermark_settings.get("enabled", False)
            webp_quality = int(sizes.get("quality", "85"))

            # The true original is preserved as-is on disk (private). Never rewrite it.
            result["original"] = storage_path
            result["file_size"] = len(raw)

            if "medium" in sizes and sizes["medium"]:
                max_dim = int(sizes["medium"])
                medium_rel = f"{base_relative}/optimized/{file_id}.webp"
                medium_img = self._resize(img, max_dim)
                if watermark_enabled:
                    medium_img = self._apply_watermark(medium_img, watermark_settings)
                buf = io.BytesIO()
                medium_img.save(buf, format="WEBP", quality=webp_quality - 5, optimize=True)
                await self.storage.save(medium_rel, buf.getvalue(), "image/webp")
                result["medium"] = medium_rel

            if "thumbnail" in sizes and sizes["thumbnail"]:
                max_dim = int(sizes["thumbnail"])
                thumb_rel = f"{base_relative}/thumbnails/{file_id}.webp"
                thumb_img = self._resize(img, max_dim)
                buf = io.BytesIO()
                thumb_img.save(buf, format="WEBP", quality=webp_quality - 15, optimize=True)
                await self.storage.save(thumb_rel, buf.getvalue(), "image/webp")
                result["thumbnail"] = thumb_rel

            img.close()
        except Exception as e:
            raise ValidationError(message=f"Image processing failed: {e}")

        logger.info("Image processed: %s -> %s (original preserved)", filename, file_id)
        return result

    def _apply_watermark(self, img: Image.Image, settings: dict | None) -> Image.Image:
        if not settings:
            return img

        watermark_type = settings.get("type", "text")
        position = settings.get("position", "bottom-center")
        size_raw = settings.get("size", "medium")
        if isinstance(size_raw, str):
            size_pct = {"small": 5, "medium": 10, "large": 15}.get(size_raw, 10)
        else:
            size_pct = int(size_raw)
        text = settings.get("text", "TJ Photography")

        draw = ImageDraw.Draw(img)
        img_w, img_h = img.size

        font_size = max(int(min(img_w, img_h) * size_pct / 100), 12)
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except (OSError, IOError):
            font = ImageFont.load_default()

        if watermark_type == "text" and text:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]

            padding = int(img_h * 0.03)

            if position == "bottom-center":
                x = (img_w - text_w) // 2
                y = img_h - text_h - padding
            elif position == "bottom-left":
                x = padding
                y = img_h - text_h - padding
            elif position == "bottom-right":
                x = img_w - text_w - padding
                y = img_h - text_h - padding
            elif position == "top-left":
                x = padding
                y = padding
            elif position == "top-right":
                x = img_w - text_w - padding
                y = padding
            elif position == "center":
                x = (img_w - text_w) // 2
                y = (img_h - text_h) // 2
            else:
                x = (img_w - text_w) // 2
                y = img_h - text_h - padding

            overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            overlay_draw.text((x, y), text, font=font, fill=(255, 255, 255, 180))
            if img.mode == "RGB":
                img = img.convert("RGBA")
            img = Image.alpha_composite(img, overlay)
            if img.mode == "RGBA":
                img = img.convert("RGB")

        elif watermark_type == "logo":
            logo_url = settings.get("logo_url", "")
            if logo_url:
                pass

        return img

    async def extract_exif(self, raw_bytes: bytes) -> dict:
        exif_data = {}
        try:
            with Image.open(io.BytesIO(raw_bytes)) as img:
                exif_raw = img._getexif()
                if not exif_raw:
                    return exif_data

                tag_map = {tag_id: tag_name for tag_id, tag_name in TAGS.items()}
                exif_dict = {}
                for tag_id, value in exif_raw.items():
                    tag_name = tag_map.get(tag_id, str(tag_id))
                    if isinstance(value, bytes):
                        try:
                            value = value.decode("utf-8", errors="replace")
                        except Exception:
                            value = str(value)
                    exif_dict[tag_name] = value

                exif_data["camera"] = exif_dict.get("Make", "")
                if exif_dict.get("Model"):
                    exif_data["camera"] = f"{exif_data['camera']} {exif_dict['Model']}".strip()
                exif_data["lens"] = exif_dict.get("LensModel", "")
                exif_data["aperture"] = exif_dict.get("FNumber", "")
                exif_data["shutter_speed"] = exif_dict.get("ExposureTime", "")
                iso = exif_dict.get("ISOSpeedRatings")
                if iso:
                    exif_data["iso"] = int(iso) if not isinstance(iso, int) else iso
                exif_data["focal_length"] = exif_dict.get("FocalLength", "")
                date_str = exif_dict.get("DateTimeOriginal") or exif_dict.get("DateTime")
                if date_str:
                    try:
                        exif_data["date_taken"] = datetime.strptime(
                            str(date_str), "%Y:%m:%d %H:%M:%S"
                        ).replace(tzinfo=timezone.utc)
                    except (ValueError, TypeError):
                        pass
        except Exception as e:
            logger.warning("Failed to extract EXIF: %s", e)

        return exif_data

    async def generate_blur_hash(self, raw_bytes: bytes) -> str:
        try:
            with Image.open(io.BytesIO(raw_bytes)) as img:
                small = img.resize((32, 32), Image.LANCZOS)
                if small.mode != "RGB":
                    small = small.convert("RGB")
                pixels = list(small.getdata())
                avg_r = sum(p[0] for p in pixels) / len(pixels)
                avg_g = sum(p[1] for p in pixels) / len(pixels)
                avg_b = sum(p[2] for p in pixels) / len(pixels)
                color_str = f"{int(avg_r):02x}{int(avg_g):02x}{int(avg_b):02x}"
                return hashlib.md5(color_str.encode()).hexdigest()[:12]
        except Exception:
            return ""

    async def get_dimensions(self, raw_bytes: bytes) -> tuple[int, int]:
        try:
            with Image.open(io.BytesIO(raw_bytes)) as img:
                return img.size
        except Exception:
            return (0, 0)

    def _compute_blur_hash(self, img: Image.Image) -> str:
        try:
            small = img.resize((32, 32), Image.LANCZOS)
            if small.mode != "RGB":
                small = small.convert("RGB")
            pixels = list(small.getdata())
            avg_r = sum(p[0] for p in pixels) / len(pixels)
            avg_g = sum(p[1] for p in pixels) / len(pixels)
            avg_b = sum(p[2] for p in pixels) / len(pixels)
            color_str = f"{int(avg_r):02x}{int(avg_g):02x}{int(avg_b):02x}"
            return hashlib.md5(color_str.encode()).hexdigest()[:12]
        except Exception:
            return ""

    async def validate_image(self, file_path: str) -> bool:
        raw = await self.storage.read(file_path)
        if raw is None:
            return False

        ext = Path(file_path).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            return False

        try:
            with Image.open(io.BytesIO(raw)) as img:
                img.verify()
            return True
        except Exception:
            return False

    async def convert_to_png(self, storage_path: str) -> tuple[bytes, str] | None:
        raw = await self.storage.read(storage_path)
        if raw is None:
            return None
        try:
            with Image.open(io.BytesIO(raw)) as img:
                if img.mode not in ("RGB", "RGBA"):
                    img = img.convert("RGB")
                buf = io.BytesIO()
                img.save(buf, format="PNG", optimize=True)
                stem = Path(storage_path).stem
                return buf.getvalue(), f"{stem}.png"
        except Exception:
            return None

    def _resize(self, img: Image.Image, max_dim: int) -> Image.Image:
        ratio = min(max_dim / img.width, max_dim / img.height)
        if ratio >= 1:
            return img.copy()
        new_size = (int(img.width * ratio), int(img.height * ratio))
        return img.resize(new_size, Image.LANCZOS)
