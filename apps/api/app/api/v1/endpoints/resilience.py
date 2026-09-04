from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.models import User, BufferAccount, FinancialProfile, Transaction
from app.schemas.schemas import ResilienceScoreOut
from app.engine.financial_engine import FinancialEngine

router = APIRouter()


@router.get("/score", response_model=ResilienceScoreOut)
def get_resilience_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    buf = db.query(BufferAccount).filter(BufferAccount.user_id == current_user.id).first()
    prof = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    
    if not buf or not prof:
        raise HTTPException(status_code=404, detail="User financial profile or buffer not found.")

    # Calculate real-time metrics
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    incomes = [float(t.amount) for t in txs if t.transaction_type == "INCOME"]
    expenses = [float(t.amount) for t in txs if t.transaction_type == "EXPENSE"]
    essential_expenses = [float(t.amount) for t in txs if t.transaction_type == "EXPENSE" and t.is_essential]

    stats = FinancialEngine.calculate_income_analytics(incomes)
    total_exp = sum(expenses) if expenses else 1.0
    ess_exp = sum(essential_expenses) if essential_expenses else 0.65 * total_exp
    essential_ratio = ess_exp / total_exp

    recent_incomes = incomes[-4:] if len(incomes) >= 4 else incomes
    cash_flow_net = sum(recent_incomes) - (float(prof.essential_weekly_expenses) * len(recent_incomes))

    resilience = FinancialEngine.calculate_resilience_score(
        income_volatility_cv=stats["cv"],
        current_buffer=float(buf.current_balance),
        buffer_target=float(buf.target_amount),
        essential_ratio=essential_ratio,
        cash_flow_net=cash_flow_net
    )

    notes = [
        f"Income Stability: {resilience['income_stability']:.1f}/100 (CV: {stats['cv']:.2f})",
        f"Buffer Coverage: {resilience['buffer_coverage']:.1f}/100 ({buf.current_balance:,.0f} / {buf.target_amount:,.0f})",
        f"Expense Health: {resilience['expense_health']:.1f}/100 ({essential_ratio*100:.0f}% essential ratio)",
        f"Cash Flow Health: {resilience['cash_flow_health']:.1f}/100 (₹{cash_flow_net:,.0f} net trailing 4-week)"
    ]

    return ResilienceScoreOut(
        overall_score=resilience["overall_score"],
        rating=resilience["rating"],
        income_stability=resilience["income_stability"],
        buffer_coverage=resilience["buffer_coverage"],
        expense_health=resilience["expense_health"],
        cash_flow_health=resilience["cash_flow_health"],
        breakdown_notes=notes
    )
