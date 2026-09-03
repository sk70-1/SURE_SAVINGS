from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.models import User, BufferAccount, BufferTransaction, FinancialProfile, AuditLog
from app.schemas.schemas import BufferStatusOut, BufferTransactionOut, BufferSimulateAction, BufferActionResult
from app.engine.financial_engine import FinancialEngine

router = APIRouter()


@router.get("", response_model=BufferStatusOut)
def get_buffer_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    buf = db.query(BufferAccount).filter(BufferAccount.user_id == current_user.id).first()
    prof = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    
    if not buf:
        raise HTTPException(status_code=404, detail="Buffer account not found.")

    essential_exp = prof.essential_weekly_expenses if prof else 5000.0
    safe_available = FinancialEngine.calculate_available_safe_buffer(buf.current_balance, buf.minimum_floor)
    buffer_gap = FinancialEngine.calculate_buffer_gap(buf.target_amount, buf.current_balance)
    coverage = round(buf.current_balance / essential_exp, 1) if essential_exp > 0 else 0.0

    if buf.current_balance >= buf.target_amount:
        status_label = "Healthy"
    elif buf.current_balance > buf.minimum_floor:
        status_label = "Warning"
    else:
        status_label = "Critical"

    return BufferStatusOut(
        current_balance=buf.current_balance,
        target_amount=buf.target_amount,
        minimum_floor=buf.minimum_floor,
        available_safe_buffer=safe_available,
        buffer_gap=buffer_gap,
        coverage_weeks=coverage,
        status=status_label
    )


@router.get("/history", response_model=List[BufferTransactionOut])
def get_buffer_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    buf = db.query(BufferAccount).filter(BufferAccount.user_id == current_user.id).first()
    if not buf:
        return []
    return (
        db.query(BufferTransaction)
        .filter(BufferTransaction.buffer_account_id == buf.id)
        .order_by(BufferTransaction.created_at.desc())
        .all()
    )


@router.post("/simulate", response_model=BufferActionResult)
def simulate_buffer_action(
    action_in: BufferSimulateAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes an audited simulation of a contribution or withdrawal.
    Financial Safety Rules Enforced:
    1. Withdrawals cannot breach minimum buffer floor.
    2. All movements are ledgered with previous and new balances.
    """
    buf = db.query(BufferAccount).filter(BufferAccount.user_id == current_user.id).first()
    if not buf:
        raise HTTPException(status_code=404, detail="Buffer account not found.")

    prev_balance = buf.current_balance
    amount = action_in.amount
    action = action_in.action.upper()

    if action == "WITHDRAWAL":
        available_safe = FinancialEngine.calculate_available_safe_buffer(prev_balance, buf.minimum_floor)
        if amount > available_safe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Withdrawal of ₹{amount:,.2f} rejected. "
                    f"Only ₹{available_safe:,.2f} can be safely drawn without breaching your ₹{buf.minimum_floor:,.2f} protected floor."
                )
            )
        new_balance = round(prev_balance - amount, 2)
    else:  # CONTRIBUTION
        new_balance = round(prev_balance + amount, 2)

    buf.current_balance = new_balance
    db.flush()

    # Record buffer transaction ledger entry
    btx = BufferTransaction(
        buffer_account_id=buf.id,
        user_id=current_user.id,
        transaction_type=action,
        amount=amount,
        resulting_balance=new_balance,
        notes=action_in.notes or "User Interactive Simulation"
    )
    db.add(btx)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action=f"BUFFER_{action}",
        details=f"{action} of ₹{amount:,.2f}. Balance shifted from ₹{prev_balance:,.2f} to ₹{new_balance:,.2f}."
    )
    db.add(audit)
    db.commit()

    safe_avail_after = FinancialEngine.calculate_available_safe_buffer(new_balance, buf.minimum_floor)

    return BufferActionResult(
        success=True,
        message=f"Successfully simulated {action.lower()} of ₹{amount:,.2f}.",
        previous_balance=prev_balance,
        new_balance=new_balance,
        available_safe_buffer=safe_avail_after,
        is_floor_protected=True
    )


@router.post("/contribute", response_model=BufferActionResult)
def contribute(
    action_in: BufferSimulateAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    action_in.action = "CONTRIBUTION"
    return simulate_buffer_action(action_in, current_user, db)


@router.post("/withdraw", response_model=BufferActionResult)
def withdraw(
    action_in: BufferSimulateAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    action_in.action = "WITHDRAWAL"
    return simulate_buffer_action(action_in, current_user, db)
