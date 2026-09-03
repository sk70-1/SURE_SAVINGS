from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.models import User, Transaction, FinancialProfile
from app.schemas.schemas import IncomeSummaryOut, IncomeAnalyticsOut, IncomeForecastOut
from app.engine.financial_engine import FinancialEngine
from app.engine.forecast_engine import ForecastEngine

router = APIRouter()


def _get_user_income_series(db: Session, user_id: int) -> List[float]:
    """Extracts chronological income amounts from user transactions."""
    txs = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id, Transaction.transaction_type == "INCOME")
        .order_by(Transaction.date.asc())
        .all()
    )
    return [t.amount for t in txs]


@router.get("/summary", response_model=IncomeSummaryOut)
def get_income_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incomes = _get_user_income_series(db, current_user.id)
    if not incomes:
        return IncomeSummaryOut(
            total_income_trailing_period=0.0,
            average_weekly_income=0.0,
            median_weekly_income=0.0,
            min_weekly_income=0.0,
            max_weekly_income=0.0,
            transaction_count=0,
            period_days=0
        )

    stats = FinancialEngine.calculate_income_analytics(incomes)
    return IncomeSummaryOut(
        total_income_trailing_period=round(sum(incomes), 2),
        average_weekly_income=stats["mean"],
        median_weekly_income=stats["median"],
        min_weekly_income=stats["min"],
        max_weekly_income=stats["max"],
        transaction_count=len(incomes),
        period_days=len(incomes) * 7
    )


@router.get("/analytics", response_model=IncomeAnalyticsOut)
def get_income_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incomes = _get_user_income_series(db, current_user.id)
    stats = FinancialEngine.calculate_income_analytics(incomes)
    
    cv = stats["cv"]
    if cv < 0.20:
        vol_rating = "Low"
    elif cv < 0.45:
        vol_rating = "Moderate"
    elif cv < 0.70:
        vol_rating = "High"
    else:
        vol_rating = "Extreme"

    # Trend detection
    if len(incomes) >= 4:
        recent_2 = incomes[-2:]
        prior_2 = incomes[-4:-2]
        if sum(recent_2) > sum(prior_2) * 1.10:
            trend = "Growing"
        elif sum(recent_2) < sum(prior_2) * 0.90:
            trend = "Declining"
        else:
            trend = "Stable"
    else:
        trend = "Stable"

    return IncomeAnalyticsOut(
        stabilized_income=stats["stabilized_income"],
        mean_income=stats["mean"],
        median_income=stats["median"],
        standard_deviation=stats["stdev"],
        coefficient_of_variation=stats["cv"],
        volatility_rating=vol_rating,
        recent_actual_income=incomes[-1] if incomes else 0.0,
        income_trend=trend,
        formula_explanation="0.60 * Median + 0.40 * Average calculated over trailing 4-8 weeks"
    )


@router.get("/forecast", response_model=IncomeForecastOut)
def get_income_forecast(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incomes = _get_user_income_series(db, current_user.id)
    forecast_data = ForecastEngine.forecast_next_period(incomes)
    return IncomeForecastOut(**forecast_data)
