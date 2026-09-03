from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.models import User, Recommendation, BufferAccount, BufferTransaction, AuditLog, Notification
from app.schemas.schemas import RecommendationOut
from app.engine.financial_engine import FinancialEngine

router = APIRouter()


@router.get("", response_model=List[RecommendationOut])
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.created_at.desc())
        .all()
    )


@router.post("/{rec_id}/approve", response_model=RecommendationOut)
def approve_recommendation(
    rec_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(Recommendation).filter(
        Recommendation.id == rec_id,
        Recommendation.user_id == current_user.id
    ).first()

    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")

    if rec.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Recommendation is already {rec.status.lower()}.")

    buf = db.query(BufferAccount).filter(BufferAccount.user_id == current_user.id).first()
    if not buf:
        raise HTTPException(status_code=404, detail="Buffer account not found.")

    # Execute corresponding simulation if monetary action
    if rec.type == "SAVE_SURPLUS" and rec.recommended_amount > 0:
        prev_bal = buf.current_balance
        buf.current_balance = round(prev_bal + rec.recommended_amount, 2)
        btx = BufferTransaction(
            buffer_account_id=buf.id,
            user_id=current_user.id,
            transaction_type="CONTRIBUTION",
            amount=rec.recommended_amount,
            resulting_balance=buf.current_balance,
            notes=f"Approved recommendation #{rec.id} ({rec.type})"
        )
        db.add(btx)
        notif = Notification(
            user_id=current_user.id,
            type="BUFFER_MILESTONE",
            title="Safe Savings Deposited!",
            message=f"Added ₹{rec.recommended_amount:,.2f} to Smart Buffer. New Balance: ₹{buf.current_balance:,.2f}."
        )
        db.add(notif)

    elif rec.type == "USE_BUFFER" and rec.recommended_amount > 0:
        available_safe = FinancialEngine.calculate_available_safe_buffer(buf.current_balance, buf.minimum_floor)
        if rec.recommended_amount > available_safe:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot withdraw ₹{rec.recommended_amount:,.2f}. Breaches minimum buffer floor."
            )
        prev_bal = buf.current_balance
        buf.current_balance = round(prev_bal - rec.recommended_amount, 2)
        btx = BufferTransaction(
            buffer_account_id=buf.id,
            user_id=current_user.id,
            transaction_type="WITHDRAWAL",
            amount=rec.recommended_amount,
            resulting_balance=buf.current_balance,
            notes=f"Approved emergency support release #{rec.id} ({rec.type})"
        )
        db.add(btx)
        notif = Notification(
            user_id=current_user.id,
            type="BUFFER_SUPPORT",
            title="Controlled Buffer Release Approved",
            message=f"Released ₹{rec.recommended_amount:,.2f} to cover essential expenses while preserving buffer floor."
        )
        db.add(notif)

    rec.status = "APPROVED"

    audit = AuditLog(
        user_id=current_user.id,
        action="APPROVE_RECOMMENDATION",
        details=f"Approved recommendation {rec.type} with amount ₹{rec.recommended_amount:,.2f}."
    )
    db.add(audit)
    db.commit()
    db.refresh(rec)
    return rec


@router.post("/{rec_id}/dismiss", response_model=RecommendationOut)
def dismiss_recommendation(
    rec_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(Recommendation).filter(
        Recommendation.id == rec_id,
        Recommendation.user_id == current_user.id
    ).first()

    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")

    rec.status = "DISMISSED"

    audit = AuditLog(
        user_id=current_user.id,
        action="DISMISS_RECOMMENDATION",
        details=f"Dismissed recommendation #{rec.id} ({rec.type})."
    )
    db.add(audit)
    db.commit()
    db.refresh(rec)
    return rec
