from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from backend.app.core.config import Settings, get_settings


class ImageValidationError(ValueError):
    pass


class ImageTooLargeError(ValueError):
    pass


@dataclass(frozen=True)
class StoredUpload:
    original_filename: str
    stored_path: str
    content: bytes


CONTENT_TYPE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


async def save_image_upload(
    upload: UploadFile,
    trip_id: int,
    settings: Settings | None = None,
) -> StoredUpload:
    settings = settings or get_settings()
    content_type = upload.content_type or ""
    if content_type not in settings.allowed_image_types:
        raise ImageValidationError(f"Unsupported image type: {content_type or 'unknown'}")

    content = await upload.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise ImageTooLargeError(f"Image exceeds {settings.max_upload_mb} MB")

    try:
        with Image.open(BytesIO(content)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise ImageValidationError("Uploaded file is not a valid image") from exc

    original_name = Path(upload.filename or "photo").name
    extension = CONTENT_TYPE_EXTENSIONS.get(content_type, Path(original_name).suffix)
    trip_dir = settings.upload_dir / f"trip_{trip_id}"
    trip_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}{extension}"
    destination = trip_dir / stored_name
    destination.write_bytes(content)

    return StoredUpload(
        original_filename=original_name,
        stored_path=f"trip_{trip_id}/{stored_name}",
        content=content,
    )
