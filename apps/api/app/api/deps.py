from typing import Generator, Optional
from fastapi import Depends, HTTPException, Header, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    query_email: Optional[str] = Query(None, alias="user_email")
) -> User:
    """
    Returns current authenticated user. Supports token or X-User-Email header
    for effortless persona switching in demo environments.
    """
    # 1. Check for explicit persona header/query param
    target_email = x_user_email or query_email
    if target_email:
        user = db.query(User).filter(User.email == target_email).first()
        if user:
            return user

    # 2. Check JWT token
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.id == int(payload["sub"])).first()
            if user:
                return user
    
    # 3. Demo convenience fallback: Arjun Mehta
    user = db.query(User).filter(User.email == "arjun@example.com").first()
    if not user:
        user = db.query(User).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No user found. Please run seed or register.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

