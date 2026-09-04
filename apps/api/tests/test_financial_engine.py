import sys
import os

# Add apps/api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.engine.financial_engine import FinancialEngine
from app.engine.forecast_engine import ForecastEngine


def test_stabilized_income_canonical_formula():
    """
    Stabilized Income = 0.60 * Recent Median + 0.40 * Recent Average (trailing 4-8 weeks)
    """
    incomes = [10000.0, 12000.0, 11000.0, 15000.0]
    # Median of [10000, 11000, 12000, 15000] = (11000 + 12000)/2 = 11500
    # Mean of [10000, 11000, 12000, 15000] = 48000 / 4 = 12000
    # Stabilized = 0.60 * 11500 + 0.40 * 12000 = 6900 + 4800 = 11700
    analytics = FinancialEngine.calculate_income_analytics(incomes)
    assert analytics["median"] == 11500.0
    assert analytics["mean"] == 12000.0
    assert analytics["stabilized_income"] == 11700.0
    assert analytics["cv"] > 0


def test_financial_surplus_preserves_cash_reserve():
    """
    Formula: max(0, Actual Income - Essential Expenses - Minimum Cash Reserve)
    """
    actual_income = 20000.0
    essential_expenses = 12000.0
    min_reserve = 3000.0

    surplus = FinancialEngine.calculate_financial_surplus(actual_income, essential_expenses, min_reserve)
    assert surplus == 5000.0

    # Deficit case
    low_income = 14000.0
    zero_surplus = FinancialEngine.calculate_financial_surplus(low_income, essential_expenses, min_reserve)
    assert zero_surplus == 0.0


def test_buffer_target_and_gap():
    """
    Buffer Target = Essential Weekly Expenses * 4
    Buffer Gap = max(0, Target - Current)
    """
    target = FinancialEngine.calculate_buffer_target(5000.0, target_weeks=4)
    assert target == 20000.0

    gap = FinancialEngine.calculate_buffer_gap(buffer_target=20000.0, current_buffer=14000.0)
    assert gap == 6000.0

    # Over-target case
    surplus_buffer_gap = FinancialEngine.calculate_buffer_gap(buffer_target=20000.0, current_buffer=25000.0)
    assert surplus_buffer_gap == 0.0


def test_available_safe_buffer_protects_minimum_floor():
    """
    Available Safe Buffer = max(0, Current Buffer - Minimum Buffer Floor)
    """
    current_buffer = 15000.0
    floor = 5000.0
    safe_buf = FinancialEngine.calculate_available_safe_buffer(current_buffer, floor)
    assert safe_buf == 10000.0

    # At or below floor
    depleted_buffer = 4500.0
    depleted_safe = FinancialEngine.calculate_available_safe_buffer(depleted_buffer, floor)
    assert depleted_safe == 0.0


def test_safe_drawdown_refuses_breaching_floor():
    """
    Shortfall withdrawal must never penetrate the minimum buffer floor.
    """
    current_buffer = 6000.0
    floor = 5000.0
    shortfall = 3000.0

    drawdown = FinancialEngine.calculate_safe_drawdown(
        income_shortfall=shortfall,
        current_buffer=current_buffer,
        minimum_buffer_floor=floor,
        policy_limit=5000.0
    )
    # Only 1000 is available above the 5000 floor
    assert drawdown["authorized_drawdown"] == 1000.0
    assert drawdown["remaining_shortfall"] == 2000.0
    assert drawdown["is_floor_reached"] is True


def test_safe_to_save_calculation():
    """
    Safe-to-Save = min(Surplus, Gap, Policy Limit) * Adjustment Factor
    """
    res = FinancialEngine.calculate_safe_to_save(
        financial_surplus=5000.0,
        buffer_gap=10000.0,
        policy_limit=2000.0,
        income_volatility_cv=0.20,
        forecast_confidence=0.95
    )
    # base is 2000 (policy limit)
    # low volatility CV (0.20), confidence 0.95 -> 2000 * 0.95 = 1900
    assert res["safe_to_save_amount"] > 0
    assert res["limiting_factor"] == "Policy Limit"


def test_resilience_score_bounded():
    """
    Resilience Score is bounded in [0, 100].
    """
    high_score = FinancialEngine.calculate_resilience_score(
        income_volatility_cv=0.10,
        current_buffer=25000.0,
        buffer_target=20000.0,
        essential_ratio=0.50,
        cash_flow_net=15000.0
    )
    assert 0 <= high_score["overall_score"] <= 100
    assert high_score["rating"] in ["Strong", "Exceptional"]

    low_score = FinancialEngine.calculate_resilience_score(
        income_volatility_cv=0.90,
        current_buffer=2000.0,
        buffer_target=20000.0,
        essential_ratio=0.95,
        cash_flow_net=-8000.0
    )
    assert 0 <= low_score["overall_score"] <= 100
    assert low_score["rating"] in ["Vulnerable", "Critical"]


def test_forecast_engine():
    """
    Forecast outputs valid confidence and bounds.
    """
    series = [8000.0, 9500.0, 9000.0, 11000.0, 10500.0]
    forecast = ForecastEngine.forecast_next_period(series)
    assert forecast["expected_income"] > 0
    assert forecast["lower_bound"] <= forecast["expected_income"] <= forecast["upper_bound"]
    assert 0.0 <= forecast["confidence"] <= 1.0
    assert len(forecast["forecast_points"]) == 4
