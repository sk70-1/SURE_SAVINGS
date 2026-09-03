from typing import List, Optional
from datetime import datetime, date, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.models import (
    User, FinancialProfile, BufferAccount, Transaction, ScheduledObligation, AuditLog
)
from app.schemas.schemas import (
    ScheduledObligationCreate, ScheduledObligationUpdate, ScheduledObligationOut,
    CalendarMonthOut, CalendarDayDetailOut
)
from app.engine.cash_flow_calendar_service import CashFlowCalendarService

router = APIRouter()
obligations_router = APIRouter()


# ---------------------------------------------------------------------------
# Calendar Projection Endpoints
# ---------------------------------------------------------------------------

@router.get("/month", response_model=CalendarMonthOut)
def get_calendar_month(
    year: Optional[int] = Query(None, ge=2020, le=2050),
    month: Optional[int] = Query(None, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns monthly cash flow calendar projection:
    - Daily income/expense/obligation/forecast chips
    - Running daily balance
    - Risk & shortfall detection
    - Summary KPI cards
    """
    now = datetime.now(timezone.utc)
    target_year = year if year is not None else now.year
    target_month = month if month is not None else now.month

    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    buffer_acc = db.query(BufferAccount).filter(BufferAccount.user_id == current_user.id).first()
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    obligations = db.query(ScheduledObligation).filter(
        ScheduledObligation.user_id == current_user.id,
        ScheduledObligation.is_active == True
    ).all()

    projection = CashFlowCalendarService.generate_month_projection(
        user=current_user,
        year=target_year,
        month=target_month,
        profile=profile,
        buffer_account=buffer_acc,
        all_transactions=transactions,
        obligations=obligations
    )

    return projection


@router.get("/day", response_model=CalendarDayDetailOut)
def get_calendar_day(
    date_str: str = Query(..., alias="date", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns detailed inspector breakdown for a specific date:
    - Granular inflows & outflows
    - Intraday timing sequence
    - Deterministic risk diagnosis
    - Safe buffer simulation support
    """
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    buffer_acc = db.query(BufferAccount).filter(BufferAccount.user_id == current_user.id).first()
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    obligations = db.query(ScheduledObligation).filter(
        ScheduledObligation.user_id == current_user.id,
        ScheduledObligation.is_active == True
    ).all()

    day_detail = CashFlowCalendarService.get_day_detail(
        user=current_user,
        target_date=target_date,
        profile=profile,
        buffer_account=buffer_acc,
        all_transactions=transactions,
        obligations=obligations
    )

    return day_detail


# ---------------------------------------------------------------------------
# Scheduled Obligations Endpoints
# ---------------------------------------------------------------------------

def _get_user_obligations(current_user: User, db: Session) -> List[ScheduledObligation]:
    return db.query(ScheduledObligation).filter(
        ScheduledObligation.user_id == current_user.id
    ).order_by(ScheduledObligation.created_at.desc()).all()


def _create_user_obligation(obl_in: ScheduledObligationCreate, current_user: User, db: Session) -> ScheduledObligation:
    if obl_in.amount <= 0:
        raise HTTPException(status_code=422, detail="Obligation amount must be greater than zero.")

    obl = ScheduledObligation(
        user_id=current_user.id,
        title=obl_in.title.strip(),
        amount=round(float(obl_in.amount), 2),
        category=(obl_in.category or "bills").lower(),
        due_day=obl_in.due_day,
        next_due_date=obl_in.next_due_date,
        frequency=obl_in.frequency.lower(),
        is_essential=obl_in.is_essential,
        is_active=True,
        reminder_days_before=obl_in.reminder_days_before
    )
    db.add(obl)

    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE_OBLIGATION",
        details=f"Created {obl.frequency} obligation '{obl.title}' of ₹{obl.amount:,.2f}"
    )
    db.add(audit)
    db.commit()
    db.refresh(obl)
    return obl


def _update_user_obligation(obligation_id: int, obl_in: ScheduledObligationUpdate, current_user: User, db: Session) -> ScheduledObligation:
    obl = db.query(ScheduledObligation).filter(
        ScheduledObligation.id == obligation_id,
        ScheduledObligation.user_id == current_user.id
    ).first()

    if not obl:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled obligation not found or not owned by current user."
        )

    if obl_in.title is not None:
        obl.title = obl_in.title.strip()
    if obl_in.amount is not None:
        if obl_in.amount <= 0:
            raise HTTPException(status_code=422, detail="Obligation amount must be greater than zero.")
        obl.amount = round(float(obl_in.amount), 2)
    if obl_in.category is not None:
        obl.category = obl_in.category.lower()
    if obl_in.due_day is not None:
        obl.due_day = obl_in.due_day
    if obl_in.next_due_date is not None:
        obl.next_due_date = obl_in.next_due_date
    if obl_in.frequency is not None:
        obl.frequency = obl_in.frequency.lower()
    if obl_in.is_essential is not None:
        obl.is_essential = obl_in.is_essential
    if obl_in.is_active is not None:
        obl.is_active = obl_in.is_active
    if obl_in.reminder_days_before is not None:
        obl.reminder_days_before = obl_in.reminder_days_before

    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE_OBLIGATION",
        details=f"Updated obligation #{obl.id} ('{obl.title}') to amount ₹{obl.amount:,.2f}"
    )
    db.add(audit)
    db.commit()
    db.refresh(obl)
    return obl


def _delete_user_obligation(obligation_id: int, current_user: User, db: Session) -> dict:
    obl = db.query(ScheduledObligation).filter(
        ScheduledObligation.id == obligation_id,
        ScheduledObligation.user_id == current_user.id
    ).first()

    if not obl:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled obligation not found or not owned by current user."
        )

    title = obl.title
    db.delete(obl)

    audit = AuditLog(
        user_id=current_user.id,
        action="DELETE_OBLIGATION",
        details=f"Deleted scheduled obligation #{obligation_id} ('{title}')"
    )
    db.add(audit)
    db.commit()
    return {"message": "Scheduled obligation deleted successfully."}


# Mount under /api/v1/obligations
@obligations_router.get("", response_model=List[ScheduledObligationOut])
def list_obligations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _get_user_obligations(current_user, db)


@obligations_router.post("", response_model=ScheduledObligationOut, status_code=status.HTTP_201_CREATED)
def create_obligation(
    obl_in: ScheduledObligationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _create_user_obligation(obl_in, current_user, db)


@obligations_router.patch("/{obligation_id}", response_model=ScheduledObligationOut)
def patch_obligation(
    obligation_id: int,
    obl_in: ScheduledObligationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _update_user_obligation(obligation_id, obl_in, current_user, db)


@obligations_router.delete("/{obligation_id}")
def delete_obligation(
    obligation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _delete_user_obligation(obligation_id, current_user, db)


# Also mount under /api/v1/calendar/obligations as convenience alias
@router.get("/obligations", response_model=List[ScheduledObligationOut])
def list_calendar_obligations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _get_user_obligations(current_user, db)


@router.post("/obligations", response_model=ScheduledObligationOut, status_code=status.HTTP_201_CREATED)
def create_calendar_obligation(
    obl_in: ScheduledObligationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _create_user_obligation(obl_in, current_user, db)


@router.patch("/obligations/{obligation_id}", response_model=ScheduledObligationOut)
def patch_calendar_obligation(
    obligation_id: int,
    obl_in: ScheduledObligationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _update_user_obligation(obligation_id, obl_in, current_user, db)


@router.delete("/obligations/{obligation_id}")
def delete_calendar_obligation(
    obligation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _delete_user_obligation(obligation_id, current_user, db)
