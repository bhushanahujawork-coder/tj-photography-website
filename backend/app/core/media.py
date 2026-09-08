from typing import Literal

MediaSize = Literal["original", "medium", "thumbnail"]
_DEFAULT_SIZE: MediaSize = "medium"


def media_url(photo_id: str, size: MediaSize = _DEFAULT_SIZE) -> str:
    """Authorized media URL for a photo size. Content is served through the
    authenticated media route instead of a blind static mount."""
    return f"/api/v1/media/photos/{photo_id}/content?size={size}"