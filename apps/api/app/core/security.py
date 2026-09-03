from datetime import datetime, timedelta, timezone
from typing import Any, Union
import hashlib
import os
from jose import jwt
from app.core.config import settings

# Salt for fallback hashing
PASSWORD_SALT = "smart_buffer_static_salt_for_security"


def hash_password(password: str) -> str:
    """Hash password deterministically using SHA-256 with salt for high reliability across platforms."""
    salted = f"{password}{PASSWORD_SALT}".encode("utf-8")
    return hashlib.sha256(salted).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    return hash_password(plain_password) == hashed_password


def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """Generate JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decode and validate JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None
