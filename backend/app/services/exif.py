from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from io import BytesIO
from typing import Any

from PIL import ExifTags, Image


@dataclass(frozen=True)
class ExtractedExif:
    captured_at: datetime | None
    latitude: float | None
    longitude: float | None
    raw: dict[str, Any]


def extract_exif(image_bytes: bytes) -> ExtractedExif:
    try:
        with Image.open(BytesIO(image_bytes)) as image:
            exif = image.getexif()
    except Exception:
        return ExtractedExif(None, None, None, {})

    raw: dict[str, Any] = {}
    gps_payload: dict[str, Any] = {}
    captured_at: datetime | None = None

    for tag_id, value in exif.items():
        tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
        if tag_name == "GPSInfo":
            gps_payload = _decode_gps(value)
            raw[tag_name] = gps_payload
            continue

        safe_value = _json_safe(value)
        raw[tag_name] = safe_value
        if tag_name in {"DateTimeOriginal", "DateTimeDigitized", "DateTime"}:
            captured_at = captured_at or _parse_exif_datetime(str(safe_value))

    latitude, longitude = _gps_to_decimal(gps_payload)
    return ExtractedExif(captured_at, latitude, longitude, raw)


def _decode_gps(value: Any) -> dict[str, Any]:
    decoded: dict[str, Any] = {}
    try:
        items = value.items()
    except AttributeError:
        return decoded

    for gps_id, gps_value in items:
        gps_name = ExifTags.GPSTAGS.get(gps_id, str(gps_id))
        decoded[gps_name] = _json_safe(gps_value)
    return decoded


def _parse_exif_datetime(value: str) -> datetime | None:
    for fmt in ("%Y:%m:%d %H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def _gps_to_decimal(gps: dict[str, Any]) -> tuple[float | None, float | None]:
    lat_values = gps.get("GPSLatitude")
    lat_ref = gps.get("GPSLatitudeRef")
    lon_values = gps.get("GPSLongitude")
    lon_ref = gps.get("GPSLongitudeRef")

    latitude = _coordinate_to_decimal(lat_values, lat_ref)
    longitude = _coordinate_to_decimal(lon_values, lon_ref)
    return latitude, longitude


def _coordinate_to_decimal(values: Any, ref: Any) -> float | None:
    if not values or not ref or len(values) != 3:
        return None

    degrees = _number_to_float(values[0])
    minutes = _number_to_float(values[1])
    seconds = _number_to_float(values[2])
    if degrees is None or minutes is None or seconds is None:
        return None

    decimal = degrees + minutes / 60 + seconds / 3600
    if str(ref).upper() in {"S", "W"}:
        decimal *= -1
    return round(decimal, 7)


def _number_to_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        numerator = getattr(value, "numerator", None)
        denominator = getattr(value, "denominator", None)
        if denominator:
            return float(numerator) / float(denominator)
    return None


def _json_safe(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, tuple):
        return [_json_safe(item) for item in value]
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)
