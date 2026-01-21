"""
UUID/GUID type that works across SQLite and PostgreSQL.

- PostgreSQL: uses native UUID column type
- SQLite/others: stores UUIDs as CHAR(36) strings
"""

from __future__ import annotations

import uuid

from sqlalchemy import CHAR
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.types import TypeDecorator


class GUID(TypeDecorator):
    """Platform-independent GUID type."""

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PostgresUUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None

        if isinstance(value, uuid.UUID):
            return value if dialect.name == "postgresql" else str(value)

        # Accept strings
        parsed = uuid.UUID(str(value))
        return parsed if dialect.name == "postgresql" else str(parsed)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))

