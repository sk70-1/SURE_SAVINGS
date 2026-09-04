from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional, Tuple
import hashlib
import re
import uuid
import secrets
from passlib.context import CryptContext
from jose import jwt, JWTError
from app.core.config import settings

# Bcrypt CryptContext with auto salt generation
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Legacy SHA-256 salt maintained strictly for transparent login-time migration
LEGACY_PASSWORD_SALT = "sure_savings_cryptographic_salt_v1"


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Enforces strong password rules:
    - Minimum 12 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one symbol/special character
    """
    if len(password) < 12:
        return False, "Password must be at least 12 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?~`]", password):
        return False, "Password must contain at least one symbol or special character."
    return True, ""


def hash_password(password: str) -> str:
    """Hash password using bcrypt with automatic unique salt."""
    return pwd_context.hash(password)


def _legacy_sha256_hash(password: str) -> str:
    """Legacy SHA-256 hashing used strictly for backward compatibility verification."""
    salted = f"{password}:{LEGACY_PASSWORD_SALT}".encode("utf-8")
    return hashlib.sha256(salted).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against hashed password (bcrypt or legacy SHA-256).
    """
    is_valid, _, _ = verify_and_update_password(plain_password, hashed_password)
    return is_valid


def verify_and_update_password(plain_password: str, hashed_password: str) -> Tuple[bool, bool, str]:
    """
    Verifies password and determines if it requires rehashing to bcrypt.
    Returns:
        (is_valid: bool, needs_rehash: bool, new_bcrypt_hash: str)
    """
    if not hashed_password or not plain_password:
        return False, False, ""

    # 1. Try bcrypt verification first
    try:
        if hashed_password.startswith("$2") or hashed_password.startswith("$bcrypt"):
            if pwd_context.verify(plain_password, hashed_password):
                # Check if bcrypt rounds or algorithm needs an upgrade
                if pwd_context.needs_update(hashed_password):
                    return True, True, hash_password(plain_password)
                return True, False, ""
            return False, False, ""
    except Exception:
        pass

    # 2. Backward-compatible fallback: check legacy 64-char SHA-256 hash
    if len(hashed_password) == 64:
        expected_legacy = _legacy_sha256_hash(plain_password)
        # Constant-time comparison
        if secrets.compare_digest(expected_legacy, hashed_password):
            # Valid legacy password! Generate modern bcrypt hash for automatic migration
            new_hash = hash_password(plain_password)
            return True, True, new_hash

    return False, False, ""


def hash_token(token: str) -> str:
    """Produce SHA-256 hash of a JWT for secure database indexing without storing raw token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    jti: Optional[str] = None
) -> str:
    """Generate JWT access token with JTI and short-lived expiration."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": str(subject),
        "type": "access",
        "jti": jti or uuid.uuid4().hex,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    jti: Optional[str] = None
) -> Tuple[str, str, datetime]:
    """
    Generate JWT refresh token.
    Returns: (token_str, jti, expire_datetime)
    """
    token_jti = jti or uuid.uuid4().hex
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = {
        "sub": str(subject),
        "type": "refresh",
        "jti": token_jti,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, token_jti, expire


def decode_token(token: str, expected_type: str = "access") -> Optional[dict]:
    """Decode, check type, and validate JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_type = payload.get("type", "access")
        if token_type != expected_type:
            return None
        return payload
    except JWTError:
        return None
    except Exception:
        return None


def decode_access_token(token: str) -> Optional[dict]:
    """Legacy helper for access tokens."""
    return decode_token(token, expected_type="access")
