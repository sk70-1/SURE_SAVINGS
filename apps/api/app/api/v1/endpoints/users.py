from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.models.models import User, FinancialProfile, BufferAccount, AuditLog
from app.schemas.schemas import UserOut, FinancialProfileOut, FinancialProfileUpdate

router = APIRouter()


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/profile", response_model=FinancialProfileOut)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Financial profile not found.")
    return profile


@router.put("/profile", response_model=FinancialProfileOut)
def update_profile(
    profile_in: FinancialProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update financial profile parameters with safety validations and
    synchronize BufferAccount in the same database transaction.
    """
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Financial profile not found.")

    # Validate constraints across new and existing values
    target_buffer = Decimal(str(profile_in.target_buffer)) if profile_in.target_buffer is not None else profile.target_buffer
    min_floor = Decimal(str(profile_in.minimum_buffer_floor)) if profile_in.minimum_buffer_floor is not None else profile.minimum_buffer_floor

    if target_buffer <= Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target buffer must be greater than zero.")
    if min_floor < Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Minimum buffer floor cannot be negative.")
    if min_floor > target_buffer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum buffer floor cannot exceed total buffer target."
        )

    if profile_in.minimum_cash_reserve is not None and profile_in.minimum_cash_reserve < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Minimum cash reserve cannot be negative.")
    if profile_in.essential_weekly_expenses is not None and profile_in.essential_weekly_expenses <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Essential weekly expenses must be greater than zero.")
    if profile_in.policy_limit_ratio is not None and not (0 < profile_in.policy_limit_ratio <= 1.0):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Policy limit ratio must be between 0 and 1.0.")

    # Update profile fields
    changed_fields = []
    for field, val in profile_in.model_dump(exclude_unset=True).items():
        if val is not None:
            if field in ["target_buffer", "minimum_cash_reserve", "minimum_buffer_floor", "essential_weekly_expenses", "policy_limit_ratio"]:
                setattr(profile, field, Decimal(str(val)))
            else:
                setattr(profile, field, val)
            changed_fields.append(field)

    # Synchronize BufferAccount parameters
    buffer_acc = db.query(BufferAccount).filter(BufferAccount.user_id == current_user.id).first()
    if buffer_acc:
        buffer_acc.target_amount = profile.target_buffer
        buffer_acc.minimum_floor = profile.minimum_buffer_floor
        if profile.essential_weekly_expenses and profile.policy_limit_ratio:
            buffer_acc.policy_limit = round(profile.essential_weekly_expenses * profile.policy_limit_ratio, 2)
        db.add(buffer_acc)

    # Record structured audit event
    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE_PROFILE",
        details=f"Updated financial parameters: {', '.join(changed_fields)}"
    )
    db.add(audit)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/personas")
def list_available_personas(db: Session = Depends(get_db)):
    """
    Returns list of pre-seeded synthetic personas for rapid demo switching.
    Strictly forbidden in production or when demo mode is disabled.
    Strictly filters to User.is_demo == True to protect user privacy.
    """
    if not settings.is_demo_mode:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo personas are disabled in this environment."
        )

    # Strictly select only synthetic demo accounts
    demo_users = db.query(User).filter(User.is_demo == True).all()
    personas = []
    for u in demo_users:
        prof = db.query(FinancialProfile).filter_by(user_id=u.id).first()
        personas.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "persona_name": prof.persona_name if prof else "Standard",
            "persona_type": prof.persona_type if prof else "standard"
        })
    return personas
