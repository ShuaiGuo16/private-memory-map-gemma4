from __future__ import annotations

import re
from datetime import datetime

from backend.app.db.models import Photo, Trip, TripMemory


def trip_markdown(trip: Trip, photos: list[Photo], memory: TripMemory | None) -> str:
    lines = [
        f"# {trip.title}",
        "",
    ]
    if trip.description:
        lines.extend([trip.description, ""])

    if memory is not None:
        summary = memory.user_narrative_summary or memory.narrative_summary
        if summary:
            lines.extend(["## Trip Story", "", summary, ""])
        if memory.user_note:
            lines.extend(["## Personal Note", "", memory.user_note, ""])
        lines.extend(_list_section("Inferred Interests", memory.inferred_interests))
        lines.extend(_list_section("Recurring Themes", memory.recurring_themes))
        if memory.memorable_moments:
            lines.extend(["## Memorable Moments", ""])
            for moment in memory.memorable_moments:
                title = str(moment.get("title") or "Moment")
                description = str(moment.get("description") or "")
                evidence = _ids(moment.get("evidence_photo_ids"))
                lines.extend([f"### {title}", ""])
                if description:
                    lines.extend([description, ""])
                if evidence:
                    lines.extend([f"Evidence photos: {_id_list(evidence)}", ""])
        lines.extend(_list_section("Uncertainty Notes", memory.uncertainty_notes))

    favorites = [photo for photo in photos if photo.is_favorite]
    if favorites:
        lines.extend(["## Kept Photos", ""])
        for photo in favorites:
            lines.append(f"- #{photo.id} {photo.filename}")
        lines.append("")

    if photos:
        lines.extend(["## Photo Memories", ""])
        for photo in photos:
            lines.extend(_photo_lines(photo))

    return "\n".join(lines).strip() + "\n"


def export_filename(title: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", title.strip()).strip("-").lower()
    return f"{slug or 'trip-memory'}.md"


def _photo_lines(photo: Photo) -> list[str]:
    analysis = photo.analysis
    title = analysis.memory_caption if analysis is not None else photo.filename
    lines = [f"### #{photo.id} {title}", ""]
    lines.append(f"- File: {photo.filename}")
    if photo.is_favorite:
        lines.append("- Kept: yes")
    if photo.captured_at:
        lines.append(f"- Captured: {_format_datetime(photo.captured_at)}")
    if photo.latitude is not None and photo.longitude is not None:
        lines.append(f"- GPS: {photo.latitude}, {photo.longitude}")
    if analysis is not None:
        if analysis.scene_summary:
            lines.append(f"- Scene: {analysis.scene_summary}")
        mood = analysis.user_mood or analysis.mood
        if mood:
            lines.append(f"- Mood: {mood}")
        if analysis.place_type:
            lines.append(f"- Place type: {analysis.place_type}")
        if analysis.user_note:
            lines.extend(["", analysis.user_note])
    lines.append("")
    return lines


def _list_section(title: str, values: list[str]) -> list[str]:
    if not values:
        return []
    return [f"## {title}", "", *[f"- {value}" for value in values], ""]


def _ids(value: object) -> list[int]:
    if not isinstance(value, list):
        return []
    return [int(item) for item in value if isinstance(item, int)]


def _id_list(values: list[int]) -> str:
    return ", ".join(f"#{value}" for value in values)


def _format_datetime(value: datetime) -> str:
    return value.isoformat()
