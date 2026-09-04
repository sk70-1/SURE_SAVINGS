"""
Deterministic Financial Engine for Smart Income Buffer.
All monetary calculations, volatility indices, reserve checks, and resilience scoring
execute with exact Decimal precision and ROUND_HALF_UP rounding.
"""

from typing import List, Dict, Any, Optional, Union
from decimal import Decimal, ROUND_HALF_UP
import math
import statistics


def _to_decimal(val: Any) -> Decimal:
    if isinstance(val, Decimal):
        return val
    return Decimal(str(val))


def _round_money(val: Decimal) -> float:
    return float(val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


class FinancialEngine:
    @staticmethod
    def to_decimal(val: Any) -> Decimal:
        return _to_decimal(val)

    @staticmethod
    def round_money(val: Any) -> Decimal:
        return _to_decimal(val).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def calculate_income_analytics(weekly_incomes: List[float]) -> Dict[str, float]:
        """
        Calculates descriptive statistics and canonical Stabilized Income with exact Decimal precision.
        Stabilized Income Formula: 0.60 * Recent Median + 0.40 * Recent Average (4-8 weeks)
        Income Volatility Formula: CV = Standard Deviation / Mean
        """
        if not weekly_incomes:
            return {
                "mean": 0.0,
                "median": 0.0,
                "stdev": 0.0,
                "cv": 0.0,
                "stabilized_income": 0.0,
                "min": 0.0,
                "max": 0.0,
            }

        # Take trailing 4 to 8 weeks if available
        recent_window = weekly_incomes[-8:] if len(weekly_incomes) >= 4 else weekly_incomes

        mean_val = float(statistics.mean(recent_window))
        median_val = float(statistics.median(recent_window))
        stdev_val = float(statistics.stdev(recent_window)) if len(recent_window) > 1 else 0.0
        
        cv_val = (stdev_val / mean_val) if mean_val > 0 else 0.0

        # Canonical Formula using Decimal arithmetic: 0.60 * Median + 0.40 * Average
        dec_median = _to_decimal(str(round(median_val, 4)))
        dec_mean = _to_decimal(str(round(mean_val, 4)))
        stabilized = (Decimal("0.60") * dec_median) + (Decimal("0.40") * dec_mean)

        return {
            "mean": round(mean_val, 2),
            "median": round(median_val, 2),
            "stdev": round(stdev_val, 2),
            "cv": round(cv_val, 4),
            "stabilized_income": _round_money(stabilized),
            "min": round(float(min(recent_window)), 2),
            "max": round(float(max(recent_window)), 2),
        }

    @staticmethod
    def calculate_financial_surplus(
        actual_income: Union[float, Decimal],
        essential_expenses: Union[float, Decimal],
        minimum_cash_reserve: Union[float, Decimal],
        stabilized_baseline: Optional[Union[float, Decimal]] = None
    ) -> float:
        """
        Formula: max(0, Actual Income - Essential Expenses - Minimum Cash Reserve)
        Evaluated with exact Decimal precision using ROUND_HALF_UP.
        """
        dec_income = _to_decimal(actual_income)
        dec_essential = _to_decimal(essential_expenses)
        dec_reserve = _to_decimal(minimum_cash_reserve)

        raw_surplus = dec_income - dec_essential - dec_reserve
        return _round_money(max(Decimal("0.00"), raw_surplus))

    @staticmethod
    def calculate_buffer_target(
        essential_weekly_expenses: Union[float, Decimal],
        target_weeks: int = 4
    ) -> float:
        """
        Formula: Essential Weekly Expenses * 4
        One-month safety cushion baseline.
        """
        dec_essential = _to_decimal(essential_weekly_expenses)
        target = dec_essential * Decimal(str(target_weeks))
        return _round_money(max(Decimal("0.00"), target))

    @staticmethod
    def calculate_buffer_gap(
        buffer_target: Union[float, Decimal],
        current_buffer: Union[float, Decimal]
    ) -> float:
        """
        Formula: max(0, Buffer Target - Current Buffer)
        """
        dec_target = _to_decimal(buffer_target)
        dec_current = _to_decimal(current_buffer)
        gap = dec_target - dec_current
        return _round_money(max(Decimal("0.00"), gap))

    @staticmethod
    def calculate_available_safe_buffer(
        current_buffer: Union[float, Decimal],
        minimum_buffer_floor: Union[float, Decimal]
    ) -> float:
        """
        Formula: max(0, Current Buffer - Minimum Buffer Floor)
        Only the amount strictly above the protected floor can be safely released.
        """
        dec_current = _to_decimal(current_buffer)
        dec_floor = _to_decimal(minimum_buffer_floor)
        safe = dec_current - dec_floor
        return _round_money(max(Decimal("0.00"), safe))

    @staticmethod
    def calculate_safe_to_save(
        financial_surplus: Union[float, Decimal],
        buffer_gap: Union[float, Decimal],
        policy_limit: Union[float, Decimal],
        income_volatility_cv: float,
        forecast_confidence: float = 0.90,
        is_income_declining: bool = False
    ) -> Dict[str, Any]:
        """
        Formula: min(Financial Surplus, Buffer Gap, Policy Limit) * Adjustment Factor
        Calculated using Decimal arithmetic.
        """
        dec_surplus = _to_decimal(financial_surplus)
        dec_gap = _to_decimal(buffer_gap)
        dec_limit = _to_decimal(policy_limit)

        base_candidate = min(dec_surplus, dec_gap, dec_limit)
        if base_candidate <= Decimal("0.00"):
            return {
                "safe_to_save_amount": 0.0,
                "adjustment_factor": 1.0,
                "limiting_factor": "No surplus or buffer full",
                "explanation": "No disposable surplus available or buffer target already satisfied."
            }

        adjustment = 1.0
        if income_volatility_cv > 0.6:
            adjustment *= 0.75
        elif income_volatility_cv > 0.3:
            adjustment *= 0.85
        
        if is_income_declining:
            adjustment *= 0.60
        
        adjustment *= min(1.0, max(0.5, forecast_confidence))

        dec_adj = _to_decimal(str(round(adjustment, 4)))
        recommended_dec = base_candidate * dec_adj
        recommended = _round_money(recommended_dec)

        if base_candidate == dec_surplus:
            limiting = "Financial Surplus"
        elif base_candidate == dec_gap:
            limiting = "Buffer Gap"
        else:
            limiting = "Policy Limit"

        return {
            "safe_to_save_amount": recommended,
            "adjustment_factor": round(adjustment, 2),
            "limiting_factor": limiting,
            "explanation": f"Recommended ₹{recommended:,.2f} based on {limiting} with volatility adjustment factor of {adjustment:.2f}."
        }

    @staticmethod
    def calculate_safe_drawdown(
        income_shortfall: Union[float, Decimal],
        current_buffer: Union[float, Decimal],
        minimum_buffer_floor: Union[float, Decimal],
        policy_limit: Union[float, Decimal]
    ) -> Dict[str, Any]:
        """
        Formula: Supported shortfall = min(Income Shortfall, Available Safe Buffer, Policy Limit)
        Protects the minimum buffer floor under all circumstances.
        """
        dec_shortfall = _to_decimal(income_shortfall)
        dec_current = _to_decimal(current_buffer)
        dec_floor = _to_decimal(minimum_buffer_floor)
        dec_policy = _to_decimal(policy_limit)

        available_safe_dec = max(Decimal("0.00"), dec_current - dec_floor)
        authorized_dec = min(dec_shortfall, available_safe_dec, dec_policy)
        authorized_dec = max(Decimal("0.00"), authorized_dec)
        authorized_drawdown = _round_money(authorized_dec)

        remaining_shortfall = _round_money(max(Decimal("0.00"), dec_shortfall - authorized_dec))
        is_floor_reached = (dec_current - authorized_dec) <= dec_floor

        return {
            "authorized_drawdown": authorized_drawdown,
            "available_safe_buffer": _round_money(available_safe_dec),
            "remaining_shortfall": remaining_shortfall,
            "is_floor_reached": is_floor_reached,
            "message": (
                f"Approved ₹{authorized_drawdown:,.2f} drawdown while preserving ₹{_round_money(dec_floor):,.2f} protected floor."
                if authorized_drawdown > 0 else "Cannot withdraw: minimum buffer floor reached."
            )
        }

    @staticmethod
    def calculate_resilience_score(
        income_volatility_cv: float,
        current_buffer: Union[float, Decimal],
        buffer_target: Union[float, Decimal],
        essential_ratio: float,
        cash_flow_net: Union[float, Decimal]
    ) -> Dict[str, Any]:
        """
        Formula:
        Resilience Score = 0.25 * Income Stability + 0.30 * Buffer Coverage + 0.20 * Expense Health + 0.25 * Cash Flow Health
        Bounded between 0 and 100.
        """
        fl_curr = float(current_buffer)
        fl_target = float(buffer_target)
        fl_cf = float(cash_flow_net)

        # 1. Income Stability (0 - 100): Lower CV means higher stability
        income_stability = max(10.0, min(100.0, 100.0 - (income_volatility_cv * 90.0)))

        # 2. Buffer Coverage (0 - 100): current_buffer / buffer_target * 100
        coverage_ratio = (fl_curr / fl_target) if fl_target > 0 else 0.0
        buffer_coverage = max(0.0, min(100.0, coverage_ratio * 100.0))

        # 3. Expense Health (0 - 100): Lower essential ratio or controlled commitments
        expense_health = max(15.0, min(100.0, 100.0 - (essential_ratio * 80.0)))

        # 4. Cash Flow Health (0 - 100): Positive cash flow boosts score
        if fl_cf >= 10000:
            cf_health = 95.0
        elif fl_cf >= 0:
            cf_health = 70.0 + (fl_cf / 10000.0) * 25.0
        else:
            cf_health = max(10.0, 70.0 + (fl_cf / 5000.0) * 30.0)

        composite = (
            (0.25 * income_stability) +
            (0.30 * buffer_coverage) +
            (0.20 * expense_health) +
            (0.25 * cf_health)
        )
        composite = round(max(0.0, min(100.0, composite)), 1)

        # Rating label
        if composite >= 80:
            rating = "Exceptional"
        elif composite >= 65:
            rating = "Strong"
        elif composite >= 50:
            rating = "Moderate"
        elif composite >= 35:
            rating = "Vulnerable"
        else:
            rating = "Critical"

        return {
            "overall_score": composite,
            "rating": rating,
            "income_stability": round(income_stability, 1),
            "buffer_coverage": round(buffer_coverage, 1),
            "expense_health": round(expense_health, 1),
            "cash_flow_health": round(cf_health, 1),
        }
