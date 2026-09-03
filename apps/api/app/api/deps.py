from typing import Generator, Optional
from fastapi import Depends, HTTPException, Header, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import decode_token
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
    x_demo_persona: Optional[str] = Header(None, alias="X-Demo-Persona"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    query_demo_persona: Optional[str] = Query(None, alias="demo_persona")
) -> User:
    """
    Authenticated User Resolver:
    1. If a JWT Bearer token is provided, strictly validates and resolves the user.
    2. In demo mode (DEMO_MODE_ENABLED=True), allows accessing seeded demo sandbox
       personas (User.is_demo == True) via header/param or fallback.
    3. If not in demo mode and no valid token, strictly rejects with 401 Unauthorized.
    """
    # 1. Check Bearer Token (Primary path for all real users)
    if token:
        payload = decode_token(token, expected_type="access")
        if payload and "sub" in payload:
            user = db.query(User).filter(User.id == int(payload["sub"])).first()
            if user and user.is_active:
                return user
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account inactive or not found.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # 2. Demo Sandbox Mode (Only active when DEMO_MODE_ENABLED is True)
    if settings.DEMO_MODE_ENABLED:
        target_email = x_demo_persona or query_demo_persona or x_user_email
        if target_email:
            demo_user = db.query(User).filter(
                User.email == target_email,
                User.is_demo == True
            ).first()
            if demo_user:
                return demo_user

        # Demo fallback for testing and sandbox view
        primary_demo = db.query(User).filter(
            User.email == "arjun@example.com",
            User.is_demo == True
        ).first()
        if primary_demo:
            return primary_demo

    # 3. Deny unauthenticated access
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please provide a valid Bearer token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
