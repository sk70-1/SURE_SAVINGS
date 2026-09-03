from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token
)
from app.models.models import User, FinancialProfile, BufferAccount, AuditLog
from app.schemas.schemas import (
    UserCreate, UserLogin, Token, TokenRefreshRequest,
    UserOut, OnboardingIn, FinancialProfileOut
)

router = APIRouter()


@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
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
        target_buffer=25000.0,
        minimum_cash_reserve=2500.0,
        minimum_buffer_floor=5000.0,
        essential_weekly_expenses=5000.0,
        policy_limit_ratio=0.50
    )
    db.add(profile)

    buffer_account = BufferAccount(
        user_id=user.id,
        current_balance=0.0,  # Real user starts with 0 until deposited or onboarded
        target_amount=25000.0,
        minimum_floor=5000.0,
        policy_limit=4500.0
    )
    db.add(buffer_account)

    audit = AuditLog(
        user_id=user.id,
        action="USER_REGISTER",
        details=f"Registered account for {user.email}"
    )
    db.add(audit)
    db.commit()

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))

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
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning JWT access & refresh tokens."""
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))

    # Log login event
    audit = AuditLog(
        user_id=user.id,
        action="USER_LOGIN",
        details=f"Successful login for {user.email}"
    )
    db.add(audit)
    db.commit()

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
def refresh_token_endpoint(req: TokenRefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access token."""
    payload = decode_token(req.refresh_token, expected_type="refresh")
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive."
        )

    new_access_token = create_access_token(subject=str(user.id))
    new_refresh_token = create_refresh_token(subject=str(user.id))

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
    profile.essential_weekly_expenses = onboarding_data.essential_weekly_expenses
    profile.target_buffer = onboarding_data.target_buffer
    profile.minimum_buffer_floor = onboarding_data.minimum_buffer_floor
    profile.minimum_cash_reserve = onboarding_data.minimum_cash_reserve
    profile.persona_name = f"{current_user.full_name}'s Profile"

    buffer_acc = db.query(BufferAccount).filter(BufferAccount.user_id == current_user.id).first()
    if buffer_acc:
        buffer_acc.target_amount = onboarding_data.target_buffer
        buffer_acc.minimum_floor = onboarding_data.minimum_buffer_floor
        buffer_acc.policy_limit = round(onboarding_data.essential_weekly_expenses * 0.75, 2)
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
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Log logout event."""
    audit = AuditLog(
        user_id=current_user.id,
        action="USER_LOGOUT",
        details=f"User {current_user.email} logged out"
    )
    db.add(audit)
    db.commit()
    return {"message": "Successfully logged out."}
