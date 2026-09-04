from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.core.security import (
    hash_password, verify_and_update_password, hash_token,
    create_access_token, create_refresh_token, decode_token
)
from app.models.models import User, FinancialProfile, BufferAccount, AuditLog, RefreshToken, utcnow
from app.schemas.schemas import (
    UserCreate, UserLogin, Token, TokenRefreshRequest,
    UserOut, OnboardingIn, FinancialProfileOut
)

router = APIRouter()


def set_refresh_cookie(response: Response, refresh_token: str):
    """Sets secure HttpOnly cookie for refresh token."""
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        path=settings.REFRESH_COOKIE_PATH,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )


def clear_refresh_cookie(response: Response):
    """Clears refresh token cookie."""
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.REFRESH_COOKIE_SAMESITE
    )


def record_refresh_token(
    db: Session,
    user_id: int,
    token_str: str,
    token_jti: str,
    expires_at: datetime,
    request: Optional[Request] = None
) -> RefreshToken:
    """Stores a new refresh token session in database."""
    session = RefreshToken(
        user_id=user_id,
        token_jti=token_jti,
        token_hash=hash_token(token_str),
        expires_at=expires_at,
        revoked=False,
        user_agent=request.headers.get("user-agent", "")[:255] if request else None,
        ip_address=request.client.host[:45] if (request and request.client) else None
    )
    db.add(session)
    return session


@router.post("/register", response_model=Token)
def register(
    user_in: UserCreate,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new individual user account with isolated financial profile."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        is_active=True,
        is_demo=False,
        onboarding_completed=False,
        currency=user_in.currency or "INR",
        country=user_in.country or "India"
    )
    db.add(user)
    db.flush()

    # Create initial starter profile & buffer account for new user
    profile = FinancialProfile(
        user_id=user.id,
        persona_name=f"{user.full_name}'s Profile",
        persona_type="custom_earner",
        pay_frequency="weekly",
        target_buffer=Decimal("25000.00"),
        minimum_cash_reserve=Decimal("2500.00"),
        minimum_buffer_floor=Decimal("5000.00"),
        essential_weekly_expenses=Decimal("5000.00"),
        policy_limit_ratio=Decimal("0.5000")
    )
    db.add(profile)

    buffer_account = BufferAccount(
        user_id=user.id,
        current_balance=Decimal("0.00"),  # Real user starts with 0 until deposited or onboarded
        target_amount=Decimal("25000.00"),
        minimum_floor=Decimal("5000.00"),
        policy_limit=Decimal("4500.00")
    )
    db.add(buffer_account)

    # Issue tokens & persist refresh session
    access_token = create_access_token(subject=str(user.id))
    refresh_token, jti, expire = create_refresh_token(subject=str(user.id))
    record_refresh_token(db, user.id, refresh_token, jti, expire, request)

    audit = AuditLog(
        user_id=user.id,
        action="USER_REGISTER",
        details=f"Registered account for {user.email}"
    )
    db.add(audit)
    db.commit()

    set_refresh_cookie(response, refresh_token)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_demo=user.is_demo,
        onboarding_completed=user.onboarding_completed,
        currency=user.currency
    )


@router.post("/login", response_model=Token)
def login(
    login_in: UserLogin,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticate user with email and password, returning JWT access & refresh tokens.
    Supports transparent migration of legacy SHA-256 password hashes to modern bcrypt.
    """
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # In production, demo accounts cannot be logged into
    if settings.is_production and user.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo accounts are disabled in production."
        )

    # Verify password with automatic legacy upgrade
    is_valid, needs_rehash, new_hash = verify_and_update_password(login_in.password, user.hashed_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )

    # Seamlessly update password hash to bcrypt if upgraded from legacy SHA-256
    if needs_rehash and new_hash:
        user.hashed_password = new_hash
        db.add(user)

    access_token = create_access_token(subject=str(user.id))
    refresh_token, jti, expire = create_refresh_token(subject=str(user.id))
    record_refresh_token(db, user.id, refresh_token, jti, expire, request)

    # Log login event
    audit = AuditLog(
        user_id=user.id,
        action="USER_LOGIN",
        details=f"Successful login for {user.email}"
    )
    db.add(audit)
    db.commit()

    set_refresh_cookie(response, refresh_token)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_demo=user.is_demo,
        onboarding_completed=user.onboarding_completed,
        currency=user.currency
    )


@router.post("/refresh", response_model=Token)
def refresh_token_endpoint(
    response: Response,
    request: Request,
    req: Optional[TokenRefreshRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Exchange a valid refresh token for a new access token and rotated refresh token.
    Reads token from HttpOnly cookie or request body fallback.
    Implements Token Rotation and Reuse Detection.
    """
    token_str = request.cookies.get(settings.REFRESH_COOKIE_NAME)
    if not token_str and req and req.refresh_token:
        token_str = req.refresh_token

    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing."
        )

    payload = decode_token(token_str, expected_type="refresh")
    if not payload or "sub" not in payload or "jti" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    user_id = int(payload["sub"])
    token_jti = payload["jti"]

    token_record = db.query(RefreshToken).filter(RefreshToken.token_jti == token_jti).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token session not found."
        )

    # Reuse Detection Triggered: token was already revoked!
    if token_record.revoked:
        # Revoke ALL active sessions for this compromised user
        db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({
            RefreshToken.revoked: True,
            RefreshToken.revoked_at: utcnow()
        })
        db.commit()
        clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token reuse detected. All active sessions have been terminated."
        )

    # Check expiration in DB
    now = datetime.now(timezone.utc)
    exp = token_record.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now:
        token_record.revoked = True
        token_record.revoked_at = now
        db.commit()
        clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive."
        )

    # 1. Revoke the old session
    token_record.revoked = True
    token_record.revoked_at = now

    # 2. Token Rotation: issue brand new pair
    new_access_token = create_access_token(subject=str(user.id))
    new_refresh_token, new_jti, new_expire = create_refresh_token(subject=str(user.id))

    # 3. Persist new session
    record_refresh_token(db, user.id, new_refresh_token, new_jti, new_expire, request)
    db.commit()

    set_refresh_cookie(response, new_refresh_token)

    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_demo=user.is_demo,
        onboarding_completed=user.onboarding_completed,
        currency=user.currency
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Fetch profile of currently authenticated user."""
    return current_user


@router.post("/onboarding", response_model=FinancialProfileOut)
def complete_onboarding(
    onboarding_data: OnboardingIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete user onboarding: set financial parameters, target buffer, and floor."""
    if onboarding_data.minimum_buffer_floor > onboarding_data.target_buffer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum buffer floor cannot exceed total buffer target."
        )

    current_user.currency = onboarding_data.currency
    current_user.country = onboarding_data.country
    current_user.onboarding_completed = True
    db.add(current_user)

    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    if not profile:
        profile = FinancialProfile(user_id=current_user.id)
        db.add(profile)

    profile.pay_frequency = onboarding_data.pay_frequency
    profile.essential_weekly_expenses = Decimal(str(onboarding_data.essential_weekly_expenses))
    profile.target_buffer = Decimal(str(onboarding_data.target_buffer))
    profile.minimum_buffer_floor = Decimal(str(onboarding_data.minimum_buffer_floor))
    profile.minimum_cash_reserve = Decimal(str(onboarding_data.minimum_cash_reserve))
    profile.persona_name = f"{current_user.full_name}'s Profile"

    buffer_acc = db.query(BufferAccount).filter(BufferAccount.user_id == current_user.id).first()
    if buffer_acc:
        buffer_acc.target_amount = Decimal(str(onboarding_data.target_buffer))
        buffer_acc.minimum_floor = Decimal(str(onboarding_data.minimum_buffer_floor))
        buffer_acc.policy_limit = Decimal(str(round(onboarding_data.essential_weekly_expenses * 0.75, 2)))
        db.add(buffer_acc)

    audit = AuditLog(
        user_id=current_user.id,
        action="ONBOARDING_COMPLETED",
        details=f"Completed financial onboarding. Target: {onboarding_data.target_buffer}, Floor: {onboarding_data.minimum_buffer_floor}"
    )
    db.add(audit)
    db.commit()
    db.refresh(profile)

    return profile


@router.post("/logout")
def logout(
    response: Response,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke active refresh token session and clear cookie."""
    token_str = request.cookies.get(settings.REFRESH_COOKIE_NAME)
    if token_str:
        payload = decode_token(token_str, expected_type="refresh")
        if payload and "jti" in payload:
            db.query(RefreshToken).filter(RefreshToken.token_jti == payload["jti"]).update({
                RefreshToken.revoked: True,
                RefreshToken.revoked_at: utcnow()
            })

    clear_refresh_cookie(response)

    audit = AuditLog(
        user_id=current_user.id,
        action="USER_LOGOUT",
        details=f"User {current_user.email} logged out"
    )
    db.add(audit)
    db.commit()
    return {"message": "Successfully logged out."}


@router.post("/logout-all")
def logout_all(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke all active refresh sessions for the current user."""
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked == False
    ).update({
        RefreshToken.revoked: True,
        RefreshToken.revoked_at: utcnow()
    })

    clear_refresh_cookie(response)

    audit = AuditLog(
        user_id=current_user.id,
        action="USER_LOGOUT_ALL",
        details=f"User {current_user.email} revoked all active sessions"
    )
    db.add(audit)
    db.commit()
    return {"message": "Successfully logged out of all active sessions."}
