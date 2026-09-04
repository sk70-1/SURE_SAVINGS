from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from decimal import Decimal
import json

from app.api.deps import get_db, get_current_user
from app.models.models import (
    User, FinancialProfile, BufferAccount, BufferTransaction,
    Transaction, AuditLog, Notification,
    MoneyAllocationPlan, FinancialGoal
)
from app.schemas.schemas import (
    AllocationPlanOut, AllocationBreakdown,
    AllocationSimulateIn, AllocationSimulateOut,
    AllocationApproveIn, AllocationApproveOut,
    FinancialGoalOut
)
from app.engine.money_allocation_service import MoneyAllocationService
from app.engine.financial_engine import FinancialEngine
from app.engine.forecast_engine import ForecastEngine

router = APIRouter()


def _get_user_financial_context(user_id: int, db: Session) -> Dict[str, Any]:
    """Helper to collect deterministic financial facts for allocation."""
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user_id).first()
    buffer_acc = db.query(BufferAccount).filter(BufferAccount.user_id == user_id).first()
    
    if not profile or not buffer_acc:
        raise HTTPException(status_code=400, detail="User financial profile or buffer not configured.")

    # Recent transactions
    txs = db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.date.asc()).all()
    incomes = [float(t.amount) for t in txs if t.transaction_type == "INCOME"]
    expenses = [float(t.amount) for t in txs if t.transaction_type == "EXPENSE"]
    essential_expenses = [float(t.amount) for t in txs if t.transaction_type == "EXPENSE" and t.is_essential]

    income_stats = FinancialEngine.calculate_income_analytics(incomes)
    forecast = ForecastEngine.forecast_next_period(incomes)

    total_exp = sum(expenses) if expenses else 1.0
    ess_exp = sum(essential_expenses) if essential_expenses else 0.65 * total_exp
    essential_ratio = ess_exp / total_exp
    recent_incomes = incomes[-4:] if len(incomes) >= 4 else incomes
    cash_flow_net = sum(recent_incomes) - (float(profile.essential_weekly_expenses) * len(recent_incomes))

    resilience = FinancialEngine.calculate_resilience_score(
        income_volatility_cv=income_stats["cv"],
        current_buffer=buffer_acc.current_balance,
        buffer_target=buffer_acc.target_amount,
        essential_ratio=essential_ratio,
        cash_flow_net=cash_flow_net
    )

    # Active goal need
    active_goal = db.query(FinancialGoal).filter(
        FinancialGoal.user_id == user_id,
        FinancialGoal.is_completed == False
    ).order_by(FinancialGoal.priority.asc()).first()
    active_goal_need = max(0.0, float(active_goal.target_amount) - float(active_goal.current_amount)) if active_goal else 0.0

    # Recent drawdown need
    recent_drawdowns = db.query(BufferTransaction).filter(
        BufferTransaction.user_id == user_id,
        BufferTransaction.transaction_type == "WITHDRAWAL"
    ).order_by(BufferTransaction.created_at.desc()).limit(2).all()
    recent_drawdown_amount = float(sum(d.amount for d in recent_drawdowns))

    # Upcoming obligations: look for upcoming essential bills or estimate 25% of essential expenses
    upcoming_obligations = round(float(profile.essential_weekly_expenses) * 0.25, 2)

    # Most recent actual income
    most_recent_income = float(incomes[-1]) if incomes else float(profile.essential_weekly_expenses)

    # Income trend calculation
    is_income_declining = False
    if len(incomes) >= 4:
        recent_2 = sum(incomes[-2:])
        prior_2 = sum(incomes[-4:-2])
        if recent_2 < prior_2 * 0.90:
            is_income_declining = True

    return {
        "profile": profile,
        "buffer_acc": buffer_acc,
        "income_stats": income_stats,
        "forecast": forecast,
        "resilience": resilience,
        "active_goal": active_goal,
        "active_goal_need": active_goal_need,
        "recent_drawdown_amount": recent_drawdown_amount,
        "upcoming_obligations": upcoming_obligations,
        "most_recent_income": most_recent_income,
        "is_income_declining": is_income_declining
    }


def _plan_to_response(plan: MoneyAllocationPlan) -> AllocationPlanOut:
    """Helper to deserialize plan into Pydantic schema."""
    reasons = json.loads(plan.reasoning_snapshot) if plan.reasoning_snapshot else {}
    breakdown = AllocationBreakdown(
        essentials=plan.essential_amount,
        protected_buffer=plan.buffer_amount,
        upcoming_obligations=plan.obligation_amount,
        flexible_spending=plan.flexible_amount,
        goals=plan.goal_amount,
        recovery=plan.recovery_amount,
        total=round(
            plan.essential_amount + plan.buffer_amount + plan.obligation_amount +
            plan.flexible_amount + plan.goal_amount + plan.recovery_amount, 2
        )
    )
    return AllocationPlanOut(
        id=plan.id,
        user_id=plan.user_id,
        income_amount=plan.income_amount,
        breakdown=breakdown,
        reasoning=reasons,
        risk_level=plan.risk_level,
        resilience_before=plan.resilience_before,
        resilience_after=plan.resilience_after,
        status=plan.status,
        created_at=plan.created_at,
        approved_at=plan.approved_at
    )


@router.get("/current", response_model=AllocationPlanOut)
def get_current_allocation_plan(
    income_amount: Optional[float] = Query(None, description="Override incoming payment for simulation/demo"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the active Money Allocation Autopilot plan for the user.
    If income_amount is provided, recalculates dynamically.
    Otherwise returns pending plan or generates plan for latest income.
    """
    ctx = _get_user_financial_context(current_user.id, db)
    target_income = income_amount if (income_amount and income_amount > 0) else ctx["most_recent_income"]

    # If no override requested, check if a PENDING plan already exists for this amount
    if not income_amount:
        pending_plan = db.query(MoneyAllocationPlan).filter(
            MoneyAllocationPlan.user_id == current_user.id,
            MoneyAllocationPlan.status == "PENDING"
        ).order_by(MoneyAllocationPlan.created_at.desc()).first()

        if pending_plan:
            return _plan_to_response(pending_plan)

    # Deterministically calculate allocation
    res = MoneyAllocationService.calculate_allocation(
        income_received=target_income,
        essential_weekly_expenses=ctx["profile"].essential_weekly_expenses,
        current_buffer=ctx["buffer_acc"].current_balance,
        buffer_target=ctx["buffer_acc"].target_amount,
        minimum_buffer_floor=ctx["buffer_acc"].minimum_floor,
        stabilized_income=ctx["income_stats"]["stabilized_income"],
        income_volatility_cv=ctx["income_stats"]["cv"],
        forecast_confidence=ctx["forecast"]["confidence"],
        upcoming_obligations=ctx["upcoming_obligations"],
        active_goal_need=ctx["active_goal_need"],
        recent_drawdown_amount=ctx["recent_drawdown_amount"],
        is_income_declining=ctx["is_income_declining"]
    )

    # Validate and simulate resilience before/after
    sim = MoneyAllocationService.validate_and_simulate(
        proposed_breakdown=res["breakdown"],
        income_received=target_income,
        current_buffer=ctx["buffer_acc"].current_balance,
        buffer_target=ctx["buffer_acc"].target_amount,
        minimum_buffer_floor=ctx["buffer_acc"].minimum_floor,
        essential_weekly_expenses=ctx["profile"].essential_weekly_expenses,
        income_volatility_cv=ctx["income_stats"]["cv"],
        current_resilience=ctx["resilience"]["overall_score"],
        goal_target=ctx["active_goal"].target_amount if ctx["active_goal"] else 0.0,
        current_goal_amount=ctx["active_goal"].current_amount if ctx["active_goal"] else 0.0
    )

    # Persist as active PENDING plan
    plan = MoneyAllocationPlan(
        user_id=current_user.id,
        income_amount=target_income,
        essential_amount=res["breakdown"]["essentials"],
        buffer_amount=res["breakdown"]["protected_buffer"],
        obligation_amount=res["breakdown"]["upcoming_obligations"],
        flexible_amount=res["breakdown"]["flexible_spending"],
        goal_amount=res["breakdown"]["goals"],
        recovery_amount=res["breakdown"]["recovery"],
        status="PENDING",
        reasoning_snapshot=json.dumps(res["reasons"]),
        risk_level=sim["risk_level"],
        resilience_before=sim["current_resilience"],
        resilience_after=sim["projected_resilience"]
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    # Record audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="ALLOCATION_RECOMMENDED",
        details=f"Generated Money Allocation Autopilot plan for ₹{target_income:,.2f} income."
    )
    db.add(audit)
    db.commit()

    return _plan_to_response(plan)


@router.post("/simulate", response_model=AllocationSimulateOut)
def simulate_custom_allocation(
    req: AllocationSimulateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Real-time simulator: Evaluates proposed custom allocation amounts against
    strict safety rules (Rule 1-8), returning projected buffer, coverage, resilience,
    goal progress, and safety verdict.
    """
    ctx = _get_user_financial_context(current_user.id, db)

    sim = MoneyAllocationService.validate_and_simulate(
        proposed_breakdown=req.proposed_breakdown,
        income_received=req.income_received,
        current_buffer=ctx["buffer_acc"].current_balance,
        buffer_target=ctx["buffer_acc"].target_amount,
        minimum_buffer_floor=ctx["buffer_acc"].minimum_floor,
        essential_weekly_expenses=ctx["profile"].essential_weekly_expenses,
        income_volatility_cv=ctx["income_stats"]["cv"],
        current_resilience=ctx["resilience"]["overall_score"],
        goal_target=ctx["active_goal"].target_amount if ctx["active_goal"] else 0.0,
        current_goal_amount=ctx["active_goal"].current_amount if ctx["active_goal"] else 0.0
    )

    # Record simulator audit event if user attempted unsafe simulation
    if not sim["is_safe"]:
        db.add(AuditLog(
            user_id=current_user.id,
            action="ALLOCATION_REJECTED_SAFETY",
            details=f"Unsafe allocation simulation rejected: {'; '.join(sim['warnings'])}"
        ))
        db.commit()
    else:
        db.add(AuditLog(
            user_id=current_user.id,
            action="ALLOCATION_SIMULATED",
            details=f"Safe allocation simulation evaluated: Total ₹{sim['breakdown']['total']:,.2f}"
        ))
        db.commit()

    return AllocationSimulateOut(
        is_safe=sim["is_safe"],
        risk_level=sim["risk_level"],
        warnings=sim["warnings"],
        projected_buffer=sim["projected_buffer"],
        buffer_coverage_weeks=sim["buffer_coverage_weeks"],
        current_resilience=sim["current_resilience"],
        projected_resilience=sim["projected_resilience"],
        projected_goal_amount=sim["projected_goal_amount"],
        projected_goal_percentage=sim["projected_goal_percentage"],
        breakdown=sim["breakdown"]
    )


@router.post("/{plan_id}/approve", response_model=AllocationApproveOut)
def approve_allocation_plan(
    plan_id: int,
    req: Optional[AllocationApproveIn] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Explicit user approval flow:
    Executes the validated allocation, updates the simulated buffer account,
    updates goal balances, logs an immutable audit entry, and triggers a notification.
    Idempotent: Approving an already approved plan returns a safe response without double-crediting.
    """
    # Use row-level locking where supported (PostgreSQL with_for_update)
    query = db.query(MoneyAllocationPlan).filter(
        MoneyAllocationPlan.id == plan_id,
        MoneyAllocationPlan.user_id == current_user.id
    )
    try:
        plan = query.with_for_update().first()
    except Exception:
        plan = query.first()

    if not plan:
        raise HTTPException(status_code=404, detail="Allocation plan not found.")

    ctx = _get_user_financial_context(current_user.id, db)

    # Idempotency guard: if already approved, return success without re-crediting buffer or goals
    if plan.status == "APPROVED":
        return AllocationApproveOut(
            success=True,
            message="Allocation plan was already approved.",
            plan_id=plan.id,
            status="APPROVED",
            updated_buffer_balance=float(ctx["buffer_acc"].current_balance),
            audit_log_id=None
        )

    if plan.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve allocation plan with status '{plan.status}'. Plan must be PENDING."
        )

    # Use custom breakdown if user edited values in simulator
    if req and req.custom_breakdown:
        sim = MoneyAllocationService.validate_and_simulate(
            proposed_breakdown=req.custom_breakdown,
            income_received=float(plan.income_amount),
            current_buffer=float(ctx["buffer_acc"].current_balance),
            buffer_target=float(ctx["buffer_acc"].target_amount),
            minimum_buffer_floor=float(ctx["buffer_acc"].minimum_floor),
            essential_weekly_expenses=float(ctx["profile"].essential_weekly_expenses),
            income_volatility_cv=ctx["income_stats"]["cv"],
            current_resilience=ctx["resilience"]["overall_score"],
            goal_target=float(ctx["active_goal"].target_amount) if ctx["active_goal"] else 0.0,
            current_goal_amount=float(ctx["active_goal"].current_amount) if ctx["active_goal"] else 0.0
        )
        if not sim["is_safe"]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve unsafe allocation: {'; '.join(sim['warnings'])}"
            )

        # Update plan with user customized values
        plan.essential_amount = Decimal(str(req.custom_breakdown.get("essentials", plan.essential_amount)))
        plan.buffer_amount = Decimal(str(req.custom_breakdown.get("protected_buffer", plan.buffer_amount)))
        plan.obligation_amount = Decimal(str(req.custom_breakdown.get("upcoming_obligations", plan.obligation_amount)))
        plan.flexible_amount = Decimal(str(req.custom_breakdown.get("flexible_spending", plan.flexible_amount)))
        plan.goal_amount = Decimal(str(req.custom_breakdown.get("goals", plan.goal_amount)))
        plan.recovery_amount = Decimal(str(req.custom_breakdown.get("recovery", plan.recovery_amount)))
        plan.risk_level = sim["risk_level"]
        plan.resilience_after = sim["projected_resilience"]

    # Execute simulated updates with Decimal precision
    # 1. Update Buffer Account with buffer_amount + recovery_amount
    buffer_addition = Decimal(str(plan.buffer_amount)) + Decimal(str(plan.recovery_amount))
    if buffer_addition > Decimal("0.00"):
        ctx["buffer_acc"].current_balance = Decimal(str(ctx["buffer_acc"].current_balance)) + buffer_addition
        ctx["buffer_acc"].last_updated = datetime.now(timezone.utc)

        # Record buffer transaction
        buf_tx = BufferTransaction(
            buffer_account_id=ctx["buffer_acc"].id,
            user_id=current_user.id,
            transaction_type="CONTRIBUTION",
            amount=buffer_addition,
            resulting_balance=ctx["buffer_acc"].current_balance,
            notes=f"Autopilot Allocation (Buffer: ₹{plan.buffer_amount:,.0f}, Recovery: ₹{plan.recovery_amount:,.0f})"
        )
        db.add(buf_tx)

    # 2. Update Goal if allocated
    if Decimal(str(plan.goal_amount)) > Decimal("0.00") and ctx["active_goal"]:
        ctx["active_goal"].current_amount = Decimal(str(ctx["active_goal"].current_amount)) + Decimal(str(plan.goal_amount))
        if ctx["active_goal"].current_amount >= ctx["active_goal"].target_amount:
            ctx["active_goal"].is_completed = True

    # 3. Mark Plan as APPROVED
    plan.status = "APPROVED"
    plan.approved_at = datetime.now(timezone.utc)

    # 4. Record Audit Log
    audit = AuditLog(
        user_id=current_user.id,
        action="ALLOCATION_APPROVED",
        details=(
            f"User approved Money Allocation Autopilot plan #{plan.id}. "
            f"Essentials: ₹{plan.essential_amount:,.0f}, Buffer: ₹{plan.buffer_amount:,.0f}, "
            f"Obligations: ₹{plan.obligation_amount:,.0f}, Goals: ₹{plan.goal_amount:,.0f}, "
            f"Flexible: ₹{plan.flexible_amount:,.0f}."
        )
    )
    db.add(audit)
    db.flush()

    # 5. Create Notification
    notif = Notification(
        user_id=current_user.id,
        type="ALLOCATION_APPROVED",
        title="Allocation Plan Approved",
        message=(
            f"Successfully allocated ₹{plan.income_amount:,.0f}. "
            f"₹{buffer_addition:,.0f} secured in your Emergency Buffer, "
            f"and ₹{plan.essential_amount:,.0f} reserved for essentials."
        )
    )
    db.add(notif)
    db.commit()

    return AllocationApproveOut(
        success=True,
        message=f"Allocation of ₹{plan.income_amount:,.2f} approved and simulated successfully.",
        plan_id=plan.id,
        status="APPROVED",
        updated_buffer_balance=float(ctx["buffer_acc"].current_balance),
        audit_log_id=audit.id
    )


@router.post("/{plan_id}/dismiss")
def dismiss_allocation_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks an allocation plan as dismissed."""
    plan = db.query(MoneyAllocationPlan).filter(
        MoneyAllocationPlan.id == plan_id,
        MoneyAllocationPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Allocation plan not found.")

    plan.status = "DISMISSED"

    audit = AuditLog(
        user_id=current_user.id,
        action="ALLOCATION_DISMISSED",
        details=f"User dismissed Money Allocation plan #{plan.id} for ₹{plan.income_amount:,.2f}."
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": f"Plan #{plan.id} dismissed."}


@router.get("/history", response_model=List[AllocationPlanOut])
def get_allocation_history(
    limit: int = 15,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns historical allocation plans for the user."""
    plans = db.query(MoneyAllocationPlan).filter(
        MoneyAllocationPlan.user_id == current_user.id
    ).order_by(MoneyAllocationPlan.created_at.desc()).limit(limit).all()

    return [_plan_to_response(p) for p in plans]


@router.get("/goals", response_model=List[FinancialGoalOut])
def list_financial_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the user's active financial goals."""
    goals = db.query(FinancialGoal).filter(
        FinancialGoal.user_id == current_user.id
    ).order_by(FinancialGoal.priority.asc()).all()

    return goals
