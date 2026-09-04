import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.models import (
    User, BufferAccount, FinancialProfile, Transaction, Recommendation,
    AiMessage, MoneyAllocationPlan, FinancialGoal
)
from app.schemas.schemas import AiChatRequest, AiChatResponse
from app.services.ai_service import AiExplanationService
from app.engine.financial_engine import FinancialEngine
from app.engine.forecast_engine import ForecastEngine

router = APIRouter()


@router.post("/chat", response_model=AiChatResponse)
def chat_with_ai(
    chat_req: AiChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Collect read-only backend facts
    buf = db.query(BufferAccount).filter(BufferAccount.user_id == current_user.id).first()
    prof = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    recs = db.query(Recommendation).filter(Recommendation.user_id == current_user.id, Recommendation.status == "PENDING").all()
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.date.asc()).all()

    incomes = [float(t.amount) for t in txs if t.transaction_type == "INCOME"]
    expenses = [float(t.amount) for t in txs if t.transaction_type == "EXPENSE"]
    essential_expenses = [float(t.amount) for t in txs if t.transaction_type == "EXPENSE" and t.is_essential]

    income_stats = FinancialEngine.calculate_income_analytics(incomes)
    forecast = ForecastEngine.forecast_next_period(incomes)

    total_exp = sum(expenses) if expenses else 1.0
    ess_exp = sum(essential_expenses) if essential_expenses else 0.65 * total_exp
    essential_ratio = ess_exp / total_exp
    recent_incomes = incomes[-4:] if len(incomes) >= 4 else incomes
    cash_flow_net = sum(recent_incomes) - (float(prof.essential_weekly_expenses) * len(recent_incomes))

    resilience = FinancialEngine.calculate_resilience_score(
        income_volatility_cv=income_stats["cv"],
        current_buffer=float(buf.current_balance),
        buffer_target=float(buf.target_amount),
        essential_ratio=essential_ratio,
        cash_flow_net=cash_flow_net
    )

    safe_available = FinancialEngine.calculate_available_safe_buffer(float(buf.current_balance), float(buf.minimum_floor))
    coverage_wks = round(buf.current_balance / prof.essential_weekly_expenses, 1) if prof.essential_weekly_expenses > 0 else 0.0

    buffer_status = {
        "current_balance": buf.current_balance,
        "target_amount": buf.target_amount,
        "minimum_floor": buf.minimum_floor,
        "available_safe_buffer": safe_available,
        "coverage_weeks": coverage_wks
    }

    recent_tx_summaries = [
        {"desc": t.description, "amt": t.amount, "type": t.transaction_type}
        for t in txs[-10:]
    ]

    # Query Money Allocation Autopilot plan and goals
    latest_plan = db.query(MoneyAllocationPlan).filter(
        MoneyAllocationPlan.user_id == current_user.id
    ).order_by(MoneyAllocationPlan.created_at.desc()).first()

    active_goals = db.query(FinancialGoal).filter(
        FinancialGoal.user_id == current_user.id
    ).order_by(FinancialGoal.priority.asc()).all()

    allocation_summary = None
    if latest_plan:
        allocation_summary = {
            "income_received": latest_plan.income_amount,
            "status": latest_plan.status,
            "risk_level": latest_plan.risk_level,
            "breakdown": {
                "essentials": latest_plan.essential_amount,
                "protected_buffer": latest_plan.buffer_amount,
                "upcoming_obligations": latest_plan.obligation_amount,
                "recovery": latest_plan.recovery_amount,
                "goals": latest_plan.goal_amount,
                "flexible_spending": latest_plan.flexible_amount,
            },
            "reasons": json.loads(latest_plan.reasoning_snapshot) if latest_plan.reasoning_snapshot else {}
        }

    fact_sheet = AiExplanationService.build_fact_sheet(
        user_name=current_user.full_name,
        financial_summary=income_stats,
        buffer_status=buffer_status,
        resilience_score=resilience,
        forecast=forecast,
        recommendations=[
            {
                "type": r.type,
                "what": r.what,
                "why": r.why,
                "impact": r.impact,
                "recommended_amount": r.recommended_amount
            }
            for r in recs
        ],
        recent_transactions=recent_tx_summaries,
        allocation_plan=allocation_summary,
        goals=[{"title": g.title, "target": g.target_amount, "current": g.current_amount} for g in active_goals]
    )

    # 2. Generate grounded explanation
    explanation = AiExplanationService.explain_financial_status(
        user_message=chat_req.message,
        fact_sheet=fact_sheet
    )

    # 3. Log conversation record
    user_msg_log = AiMessage(
        user_id=current_user.id,
        role="user",
        content=chat_req.message
    )
    db.add(user_msg_log)

    ai_msg_log = AiMessage(
        user_id=current_user.id,
        role="assistant",
        content=explanation["reply"],
        context_snapshot=str(fact_sheet)
    )
    db.add(ai_msg_log)
    db.commit()

    return AiChatResponse(
        reply=explanation["reply"],
        grounded_context=explanation["grounded_context"],
        model_used=explanation["model_used"]
    )
