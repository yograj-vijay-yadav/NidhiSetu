"""Database layer.

Two interchangeable backends behind one minimal interface:

1. MongoDB (PyMongo) when `MONGODB_URI` is configured.
2. An in-memory demo store otherwise — same interface, so the whole platform
   (auth, applications, dashboard) is demonstrable without any database
   service. Demo store contents reset on restart, which is fine for a demo
   and clearly labelled.

Collections: users, applications. Indexes (see create_indexes):
- users.email (unique), users.google_provider_id (unique)
- applications.user_id, applications.created_at, applications.scheme_id,
  applications.status
"""

from __future__ import annotations

import threading
from typing import Any, Callable, Iterable, Optional

from app.config import settings
from app.utils.errors import PersistenceError
from app.utils.logging import get_logger

logger = get_logger(__name__)

USERS_COLLECTION = "users"
APPLICATIONS_COLLECTION = "applications"


class DatabaseInterface:
    """Minimal async-compatible interface both backends implement."""

    def insert_one(self, collection: str, document: dict[str, Any]) -> str: ...
    def find_one(self, collection: str, query: dict[str, Any]) -> Optional[dict[str, Any]]: ...
    def find(
        self,
        collection: str,
        query: dict[str, Any] | None = None,
        sort: list[tuple[str, int]] | None = None,
        limit: int = 0,
    ) -> list[dict[str, Any]]: ...
    def update_one(
        self,
        collection: str,
        query: dict[str, Any],
        update: dict[str, Any],
        upsert: bool = False,
    ) -> bool: ...
    def count(self, collection: str, query: dict[str, Any] | None = None) -> int: ...
    def create_indexes(self) -> None: ...


class InMemoryStore(DatabaseInterface):
    """Thread-safe in-memory demo store (Mongo-compatible subset)."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._data: dict[str, list[dict[str, Any]]] = {
            USERS_COLLECTION: [],
            APPLICATIONS_COLLECTION: [],
        }

    def insert_one(self, collection: str, document: dict[str, Any]) -> str:
        with self._lock:
            self._data.setdefault(collection, []).append(dict(document))
            return str(document.get("_id", ""))

    def find_one(self, collection: str, query: dict[str, Any]) -> Optional[dict[str, Any]]:
        with self._lock:
            for doc in self._data.get(collection, []):
                if self._matches(doc, query):
                    return dict(doc)
        return None

    def find(
        self,
        collection: str,
        query: dict[str, Any] | None = None,
        sort: list[tuple[str, int]] | None = None,
        limit: int = 0,
    ) -> list[dict[str, Any]]:
        with self._lock:
            docs = [dict(d) for d in self._data.get(collection, []) if self._matches(d, query or {})]
        if sort:
            for key, direction in reversed(sort):
                docs.sort(key=lambda d: (d.get(key) is None, d.get(key)), reverse=direction < 0)
        return docs[:limit] if limit else docs

    def update_one(
        self,
        collection: str,
        query: dict[str, Any],
        update: dict[str, Any],
        upsert: bool = False,
    ) -> bool:
        with self._lock:
            for doc in self._data.get(collection, []):
                if self._matches(doc, query):
                    self._apply(doc, update)
                    return True
            if upsert:
                base = dict(query)
                self._apply(base, update)
                base["_id"] = base.get("_id", str(len(self._data.get(collection, [])) + 1))
                self._data.setdefault(collection, []).append(base)
                return True
        return False

    def count(self, collection: str, query: dict[str, Any] | None = None) -> int:
        with self._lock:
            return sum(1 for d in self._data.get(collection, []) if self._matches(d, query or {}))

    def create_indexes(self) -> None:
        pass  # demo store keeps everything in memory; no real indexes needed

    @staticmethod
    def _matches(doc: dict[str, Any], query: dict[str, Any]) -> bool:
        for key, expected in query.items():
            actual = doc.get(key)
            if isinstance(expected, dict) and "$in" in expected:
                if actual not in expected["$in"]:
                    return False
            elif isinstance(expected, dict) and "$exists" in expected:
                if bool(expected["$exists"]) != (key in doc and doc.get(key) is not None):
                    return False
            elif actual != expected:
                return False
        return True

    @staticmethod
    def _apply(doc: dict[str, Any], update: dict[str, Any]) -> None:
        if "$set" in update:
            doc.update(update["$set"])
        else:
            doc.update(update)


class MongoStore(DatabaseInterface):
    """PyMongo-backed store; falls back to the demo store on connection errors."""

    def __init__(self, uri: str, db_name: str) -> None:
        import pymongo

        self._client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=3000)
        self._db = self._client[db_name]

    def insert_one(self, collection: str, document: dict[str, Any]) -> str:
        return str(self._db[collection].insert_one(document).inserted_id)

    def find_one(self, collection: str, query: dict[str, Any]) -> Optional[dict[str, Any]]:
        return self._db[collection].find_one(query)

    def find(
        self,
        collection: str,
        query: dict[str, Any] | None = None,
        sort: list[tuple[str, int]] | None = None,
        limit: int = 0,
    ) -> list[dict[str, Any]]:
        cursor = self._db[collection].find(query or {})
        if sort:
            cursor = cursor.sort(sort)
        if limit:
            cursor = cursor.limit(limit)
        return list(cursor)

    def update_one(
        self,
        collection: str,
        query: dict[str, Any],
        update: dict[str, Any],
        upsert: bool = False,
    ) -> bool:
        result = self._db[collection].update_one(query, update, upsert=upsert)
        return result.modified_count > 0 or result.upserted_id is not None

    def count(self, collection: str, query: dict[str, Any] | None = None) -> int:
        return self._db[collection].count_documents(query or {})

    def create_indexes(self) -> None:
        users = self._db[USERS_COLLECTION]
        apps = self._db[APPLICATIONS_COLLECTION]
        users.create_index("email", unique=True)
        users.create_index("google_provider_id", unique=True, sparse=True)
        apps.create_index("user_id")
        apps.create_index([("created_at", -1)])
        apps.create_index("scheme_id")
        apps.create_index("status")


_store: DatabaseInterface | None = None
_store_lock = threading.Lock()


def get_store() -> DatabaseInterface:
    """Return the configured store (Mongo if reachable, else demo)."""
    global _store
    if _store is not None:
        return _store
    with _store_lock:
        if _store is not None:
            return _store
        if settings.mongodb_uri:
            try:
                store = MongoStore(settings.mongodb_uri, "nidhisetu")
                store.create_indexes()
                logger.info("Connected to MongoDB at %s", settings.mongodb_uri.split("@")[-1])
                _store = store
            except Exception as exc:
                logger.warning(
                    "MongoDB unavailable (%s); using in-memory demo store.", type(exc).__name__
                )
                _store = InMemoryStore()
        else:
            _store = InMemoryStore()
        return _store


def reset_store() -> None:
    """Test helper: force a fresh store."""
    global _store
    with _store_lock:
        _store = None