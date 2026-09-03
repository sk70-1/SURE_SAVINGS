"""
Deterministic Recommendation Engine for Smart Income Buffer.
Generates prioritized, explainable financial actions based on real-time ledger facts.
Types:
- SAVE_SURPLUS
- HOLD_CASH
- PROTECT_BUFFER
- USE_BUFFER
- REDUCE_DISCRETIONARY_SPENDING
- REVIEW_UPCOMING_EXPENSES
- BUILD_EMERGENCY_RESERVE
- MONITOR_INCOME_DECLINE
"""

from typing import List, Dict, Any
from app.engine.financial_engine import FinancialEngine


class RecommendationEngine:
    @staticmethod
    def generate_recommendations(
        recent_actual_income: float,
        stabilized_income: float,
        essential_weekly_expenses: float,
        current_buffer: float,
        buffer_target: float,
        minimum_buffer_floor: float,
        minimum_cash_reserve: float,
        income_volatility_cv: float,
        forecast_expected: float,
        forecast_confidence: float,
        is_income_declining: bool
    ) -> List[Dict[str, Any]]:
        recommendations = []

        # 1. Evaluate Financial Surplus & Safe-to-Save
        surplus = FinancialEngine.calculate_financial_surplus(
            actual_income=recent_actual_income,
            essential_expenses=essential_weekly_expenses,
            minimum_cash_reserve=minimum_cash_reserve,
            stabilized_baseline=stabilized_income
        )
        buffer_gap = FinancialEngine.calculate_buffer_gap(buffer_target, current_buffer)
        policy_limit = essential_weekly_expenses * 0.75  # Safe cap per cycle

        safe_save_eval = FinancialEngine.calculate_safe_to_save(
            financial_surplus=surplus,
            buffer_gap=buffer_gap,
            policy_limit=policy_limit,
            income_volatility_cv=income_volatility_cv,
            forecast_confidence=forecast_confidence,
            is_income_declining=is_income_declining
        )

        safe_save_amount = safe_save_eval["safe_to_save_amount"]

        # Case A: High Income Surplus Opportunity (Golden Path A)
        if safe_save_amount > 0 and surplus > 0:
            recommendations.append({
                "type": "SAVE_SURPLUS",
                "what": f"Lock in ₹{safe_save_amount:,.0f} Safe-to-Save into Smart Buffer",
                "why": (
                    f"Your recent income (₹{recent_actual_income:,.0f}) produced a disposable surplus of ₹{surplus:,.0f} "
                    f"above your essential costs (₹{essential_weekly_expenses:,.0f}) and untouchable checking floor (₹{minimum_cash_reserve:,.0f}). "
                    f"Saving ₹{safe_save_amount:,.0f} protects against future lean weeks without creating immediate cash stress."
                ),
                "impact": f"Boosts buffer to ₹{current_buffer + safe_save_amount:,.0f} ({((current_buffer + safe_save_amount)/buffer_target*100):.0f}% of target), improving Resilience Score by +4 to +6 pts.",
                "priority": "HIGH",
                "confidence": round(forecast_confidence, 2),
                "recommended_amount": safe_save_amount
            })

        # Case B: Income Shortfall / Low-Income Support (Golden Path B)
        shortfall = max(0.0, essential_weekly_expenses - recent_actual_income)
        if shortfall > 0:
            drawdown_eval = FinancialEngine.calculate_safe_drawdown(
                income_shortfall=shortfall,
                current_buffer=current_buffer,
                minimum_buffer_floor=minimum_buffer_floor,
                policy_limit=essential_weekly_expenses
            )
            authorized = drawdown_eval["authorized_drawdown"]

            if authorized > 0:
                recommendations.append({
                    "type": "USE_BUFFER",
                    "what": f"Simulate ₹{authorized:,.0f} Buffer Release for Essential Expenses",
                    "why": (
                        f"Recent weekly earnings (₹{recent_actual_income:,.0f}) are ₹{shortfall:,.0f} below essential weekly needs. "
                        f"Your Smart Buffer holds ₹{current_buffer:,.0f}, permitting a controlled release of ₹{authorized:,.0f} "
                        f"while strictly respecting your ₹{minimum_buffer_floor:,.0f} unbreakable reserve floor."
                    ),
                    "impact": f"Fully bridges your essential living commitments without taking high-interest credit.",
                    "priority": "HIGH",
                    "confidence": 0.95,
                    "recommended_amount": authorized
                })
            else:
                recommendations.append({
                    "type": "PROTECT_BUFFER",
                    "what": "Preserve Remaining Buffer Floor & Reduce Non-Essential Spending",
                    "why": (
                        f"Current buffer (₹{current_buffer:,.0f}) is at or below the minimum safety floor (₹{minimum_buffer_floor:,.0f}). "
                        f"To protect from total depletion, no further automated buffer withdrawals are authorized."
                    ),
                    "impact": "Maintains emergency survival runway while seeking incoming contract payments.",
                    "priority": "HIGH",
                    "confidence": 0.98,
                    "recommended_amount": 0.0
                })

        # Case C: High Volatility Alert
        if income_volatility_cv > 0.50:
            recommendations.append({
                "type": "HOLD_CASH",
                "what": "Maintain Elevated Liquid Checking Cushion",
                "why": (
                    f"Your income volatility coefficient is {income_volatility_cv:.2f} (High). "
                    f"Retain extra cash in your primary account before transferring aggressive amounts into long-term savings."
                ),
                "impact": "Prevents accidental overdrafts during unpredictable billing cycles.",
                "priority": "MEDIUM",
                "confidence": 0.90,
                "recommended_amount": 0.0
            })

        # Case D: Buffer Under-Target
        if current_buffer < buffer_target and safe_save_amount == 0 and shortfall == 0:
            recommendations.append({
                "type": "BUILD_EMERGENCY_RESERVE",
                "what": f"Target 4-Week Reserve Runway (₹{buffer_gap:,.0f} remaining)",
                "why": (
                    f"Your Smart Buffer is currently at ₹{current_buffer:,.0f} of the ₹{buffer_target:,.0f} target. "
                    f"Aim to contribute modest amounts during upcoming surplus periods to complete your 4-week cushion."
                ),
                "impact": "Reaching target provides 100% stress-free coverage against seasonal gig slowdowns.",
                "priority": "LOW",
                "confidence": 0.85,
                "recommended_amount": min(500.0, buffer_gap)
            })

        # Case E: Income Trend Warning
        if is_income_declining:
            recommendations.append({
                "type": "MONITOR_INCOME_DECLINE",
                "what": "Notice: Trailing Income Showing Negative Trend",
                "why": (
                    f"Forecast models indicate a downward slope over the past 3 cycles. "
                    f"Review discretionary commitments until incoming billings stabilize."
                ),
                "impact": "Protects existing reserve longevity by slowing burn rate.",
                "priority": "HIGH",
                "confidence": 0.88,
                "recommended_amount": 0.0
            })

        return recommendations
