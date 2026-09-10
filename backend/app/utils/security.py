"""Small security helpers (hashing, id generation).

NidhiSetu uses Google OAuth / demo login (no passwords), but these primitives
are provided so the auth layer has tested utilities for hashing any
server-side secret material if ever needed.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets


def generate_request_id() -> str:
    return secrets.token_hex(8)


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def constant_time_equals(left: str, right: str) -> bool:
    return hmac.compare_digest(left.encode("utf-8"), right.encode("utf-8"))
