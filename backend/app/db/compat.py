from __future__ import annotations

from sqlalchemy import Engine, text


SQLITE_COLUMNS: dict[str, dict[str, str]] = {
    "trip": {
        "cover_photo_id": "INTEGER",
    },
    "photo": {
        "is_favorite": "BOOLEAN NOT NULL DEFAULT 0",
    },
    "photoanalysis": {
        "user_memory_caption": "VARCHAR(1000)",
        "user_scene_summary": "VARCHAR(500)",
        "user_mood": "VARCHAR(160)",
        "user_note": "VARCHAR(2000)",
        "updated_at": "DATETIME",
    },
    "tripmemory": {
        "user_narrative_summary": "VARCHAR(2500)",
        "user_note": "VARCHAR(2000)",
    },
}


def ensure_sqlite_compat(engine: Engine) -> None:
    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as connection:
        for table_name, columns in SQLITE_COLUMNS.items():
            existing = {
                row[1]
                for row in connection.exec_driver_sql(
                    f'PRAGMA table_info("{table_name}")'
                )
            }
            for column_name, column_type in columns.items():
                if column_name not in existing:
                    connection.execute(
                        text(
                            f'ALTER TABLE "{table_name}" '
                            f'ADD COLUMN "{column_name}" {column_type}'
                        )
                    )
