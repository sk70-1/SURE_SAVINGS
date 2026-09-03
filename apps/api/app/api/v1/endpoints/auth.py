from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.models import User, FinancialProfile, BufferAccount, AuditLog
from app.schemas.schemas import UserCreate, UserLogin, Token

router = APIRouter()


@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
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
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create default profile & buffer
    profile = FinancialProfile(
        user_id=user.id,
        persona_name="Custom Earner",
        persona_type="moderate_volatile",
        minimum_cash_reserve=2500.0,
        minimum_buffer_floor=5000.0,
        essential_weekly_expenses=6000.0,
        policy_limit_ratio=0.50
    )
    db.add(profile)

    buffer_account = BufferAccount(
        user_id=user.id,
        current_balance=5000.0,
        target_amount=24000.0,
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

    token = create_access_token(subject=str(user.id))
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name
    )


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token(subject=str(user.id))
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name
    )
