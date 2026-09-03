"""
Deterministic Financial Engine for Smart Income Buffer.
All monetary calculations, volatility indices, reserve checks, and resilience scoring
MUST execute through this deterministic module.
"""

from typing import List, Dict, Any, Optional
import math
import statistics


class FinancialEngine:
    @staticmethod
    def calculate_income_analytics(weekly_incomes: List[float]) -> Dict[str, float]:
        """
        Calculates descriptive statistics and canonical Stabilized Income.
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

        # Canonical Formula: 0.60 * Median + 0.40 * Average
        stabilized = (0.60 * median_val) + (0.40 * mean_val)

        return {
            "mean": round(mean_val, 2),
            "median": round(median_val, 2),
            "stdev": round(stdev_val, 2),
            "cv": round(cv_val, 4),
            "stabilized_income": round(stabilized, 2),
            "min": round(float(min(recent_window)), 2),
            "max": round(float(max(recent_window)), 2),
        }

    @staticmethod
    def calculate_financial_surplus(
        actual_income: float,
        essential_expenses: float,
        minimum_cash_reserve: float,
        stabilized_baseline: Optional[float] = None
    ) -> float:
        """
        Formula: max(0, Actual Income - Essential Expenses - Minimum Cash Reserve)
        Rule: Income above stabilized baseline is evaluated carefully; preserves cash floor.
        """
        raw_surplus = actual_income - essential_expenses - minimum_cash_reserve
        return round(max(0.0, raw_surplus), 2)

    @staticmethod
    def calculate_buffer_target(essential_weekly_expenses: float, target_weeks: int = 4) -> float:
        """
        Formula: Essential Weekly Expenses * 4
        One-month MVP safety cushion baseline.
        """
        return round(max(0.0, essential_weekly_expenses * target_weeks), 2)

    @staticmethod
    def calculate_buffer_gap(buffer_target: float, current_buffer: float) -> float:
        """
        Formula: max(0, Buffer Target - Current Buffer)
        How much room remains before the target is reached.
        """
        return round(max(0.0, buffer_target - current_buffer), 2)

    @staticmethod
    def calculate_available_safe_buffer(current_buffer: float, minimum_buffer_floor: float) -> float:
        """
        Formula: max(0, Current Buffer - Minimum Buffer Floor)
        Only the amount strictly above the protected floor can be safely released.
        """
        return round(max(0.0, current_buffer - minimum_buffer_floor), 2)

    @staticmethod
    def calculate_safe_to_save(
        financial_surplus: float,
        buffer_gap: float,
        policy_limit: float,
        income_volatility_cv: float,
        forecast_confidence: float = 0.90,
        is_income_declining: bool = False
    ) -> Dict[str, Any]:
        """
        Formula: min(Financial Surplus, Buffer Gap, Policy Limit) * Adjustment Factor
        Adjustment factor dampens savings recommendation if volatility is extreme or income is declining.
        """
        # Base candidate amount
        base_candidate = min(financial_surplus, buffer_gap, policy_limit)
        if base_candidate <= 0:
            return {
                "safe_to_save_amount": 0.0,
                "adjustment_factor": 1.0,
                "limiting_factor": "No surplus or buffer full",
                "explanation": "No disposable surplus available or buffer target already satisfied."
            }

        # Dynamic adjustment factor
        # Higher volatility (CV > 0.4) -> save slightly less aggressively to hold liquid cash
        # Declining income -> hold cash
        adjustment = 1.0
        if income_volatility_cv > 0.6:
            adjustment *= 0.75  # High volatility: retain more checking liquidity
        elif income_volatility_cv > 0.3:
            adjustment *= 0.85
        
        if is_income_declining:
            adjustment *= 0.60
        
        # Scale by forecast confidence [0.7 to 1.0]
        adjustment *= min(1.0, max(0.5, forecast_confidence))

        recommended = round(base_candidate * adjustment, 2)

        # Identify which factor was the binding constraint
        if base_candidate == financial_surplus:
            limiting = "Financial Surplus"
        elif base_candidate == buffer_gap:
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
        income_shortfall: float,
        current_buffer: float,
        minimum_buffer_floor: float,
        policy_limit: float
    ) -> Dict[str, Any]:
        """
        Formula: Supported shortfall = min(Income Shortfall, Available Safe Buffer, Policy Limit)
        Protects the minimum buffer floor under all circumstances.
        """
        available_safe_buffer = FinancialEngine.calculate_available_safe_buffer(current_buffer, minimum_buffer_floor)
        authorized_drawdown = min(income_shortfall, available_safe_buffer, policy_limit)
        authorized_drawdown = round(max(0.0, authorized_drawdown), 2)

        is_floor_reached = (current_buffer - authorized_drawdown) <= minimum_buffer_floor

        return {
            "authorized_drawdown": authorized_drawdown,
            "available_safe_buffer": available_safe_buffer,
            "remaining_shortfall": round(max(0.0, income_shortfall - authorized_drawdown), 2),
            "is_floor_reached": is_floor_reached,
            "message": (
                f"Approved ₹{authorized_drawdown:,.2f} drawdown while preserving ₹{minimum_buffer_floor:,.2f} protected floor."
                if authorized_drawdown > 0 else "Cannot withdraw: minimum buffer floor reached."
            )
        }

    @staticmethod
    def calculate_resilience_score(
        income_volatility_cv: float,
        current_buffer: float,
        buffer_target: float,
        essential_ratio: float,  # essential_expenses / total_expenses
        cash_flow_net: float     # recent 30-day net cash flow
    ) -> Dict[str, Any]:
        """
        Formula:
        Resilience Score = 0.25 * Income Stability + 0.30 * Buffer Coverage + 0.20 * Expense Health + 0.25 * Cash Flow Health
        Bounded between 0 and 100.
        """
        # 1. Income Stability (0 - 100): Lower CV means higher stability
        # CV 0.0 -> 100; CV >= 1.0 -> 10
        income_stability = max(10.0, min(100.0, 100.0 - (income_volatility_cv * 90.0)))

        # 2. Buffer Coverage (0 - 100): current_buffer / buffer_target * 100
        coverage_ratio = (current_buffer / buffer_target) if buffer_target > 0 else 0.0
        buffer_coverage = max(0.0, min(100.0, coverage_ratio * 100.0))

        # 3. Expense Health (0 - 100): Lower essential ratio or controlled commitments
        # essential ratio of 50% is healthy (85 score), 95% leaves zero wiggle room (25 score)
        expense_health = max(15.0, min(100.0, 100.0 - (essential_ratio * 80.0)))

        # 4. Cash Flow Health (0 - 100): Positive cash flow boosts score
        if cash_flow_net >= 10000:
            cf_health = 95.0
        elif cash_flow_net >= 0:
            cf_health = 70.0 + (cash_flow_net / 10000.0) * 25.0
        else:
            cf_health = max(10.0, 70.0 + (cash_flow_net / 5000.0) * 30.0)

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
