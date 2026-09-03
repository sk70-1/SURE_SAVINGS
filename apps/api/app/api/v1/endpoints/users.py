from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.models import User, FinancialProfile
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
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Financial profile not found.")

    for field, val in profile_in.dict(exclude_unset=True).items():
        setattr(profile, field, val)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/personas")
def list_available_personas(db: Session = Depends(get_db)):
    """Returns list of pre-seeded personas for rapid demo switching."""
    users = db.query(User).all()
    personas = []
    for u in users:
        prof = db.query(FinancialProfile).filter_by(user_id=u.id).first()
        personas.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "persona_name": prof.persona_name if prof else "Standard",
            "persona_type": prof.persona_type if prof else "standard"
        })
    return personas
