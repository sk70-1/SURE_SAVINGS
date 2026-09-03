"""
Deterministic Money Allocation Autopilot Service.
Calculates, validates, and simulates recommended allocations across:
1. Essentials
2. Protected Buffer
3. Upcoming Obligations
4. Recovery
5. Financial Goals
6. Flexible Spending

Recommendation-first: All real money movement remains strictly simulated
and requires explicit user approval in the UI.
"""

from typing import Dict, Any, List, Optional
import json
from app.engine.financial_engine import FinancialEngine


class MoneyAllocationService:
    @staticmethod
    def calculate_allocation(
        income_received: float,
        essential_weekly_expenses: float,
        current_buffer: float,
        buffer_target: float,
        minimum_buffer_floor: float,
        stabilized_income: float,
        income_volatility_cv: float,
        forecast_confidence: float = 0.90,
        upcoming_obligations: float = 0.0,
        active_goal_need: float = 0.0,
        recent_drawdown_amount: float = 0.0,
        is_income_declining: bool = False
    ) -> Dict[str, Any]:
        """
        Deterministic prioritization engine for incoming money:
        Priority 1: Essentials
        Priority 2: Protected Buffer
        Priority 3: Upcoming Obligations
        Priority 4: Recovery (from recent distress/drawdown)
        Priority 5: Financial Goals
        Priority 6: Flexible Spending
        """
        income = max(0.0, float(income_received))
        remaining = income

        # Priority 1: Financial Safety — Essentials
        # Covers essential food, housing, utilities for the period
        essential_allocation = min(essential_weekly_expenses, remaining)
        remaining = max(0.0, remaining - essential_allocation)

        # Priority 2: Protected Buffer
        # If buffer is below target, allocate toward emergency cushion
        buffer_gap = FinancialEngine.calculate_buffer_gap(buffer_target, current_buffer)
        policy_limit = max(500.0, essential_weekly_expenses * 0.50)  # Safe single-cycle cap
        
        # Calculate safe buffer portion considering volatility
        safe_save_eval = FinancialEngine.calculate_safe_to_save(
            financial_surplus=remaining,
            buffer_gap=buffer_gap,
            policy_limit=policy_limit,
            income_volatility_cv=income_volatility_cv,
            forecast_confidence=forecast_confidence,
            is_income_declining=is_income_declining
        )
        buffer_allocation = min(remaining, safe_save_eval["safe_to_save_amount"])
        remaining = max(0.0, remaining - buffer_allocation)

        # Priority 3: Upcoming Mandatory Obligations (e.g. bills/rent due in next 7-10 days)
        obligation_allocation = min(upcoming_obligations, remaining)
        remaining = max(0.0, remaining - obligation_allocation)

        # Priority 4: Recovery
        # If user recently experienced a buffer drawdown or shortfall, rebuild safety
        recovery_need = max(0.0, recent_drawdown_amount)
        if recovery_need > 0 and current_buffer < buffer_target:
            recovery_allocation = min(remaining, recovery_need, essential_weekly_expenses * 0.30)
            remaining = max(0.0, remaining - recovery_allocation)
        else:
            recovery_allocation = 0.0

        # Priority 5: Financial Goals
        # Only allocate when essentials are funded and buffer is at or above minimum floor
        can_fund_goals = (essential_allocation >= (essential_weekly_expenses * 0.80)) and (current_buffer >= minimum_buffer_floor)
        if can_fund_goals and active_goal_need > 0 and remaining > 0:
            # Allocate up to 30% of remaining cash or the goal need
            max_goal_portion = max(100.0, remaining * 0.40)
            goal_allocation = min(remaining, active_goal_need, max_goal_portion)
            remaining = max(0.0, remaining - goal_allocation)
        else:
            goal_allocation = 0.0

        # Priority 6: Flexible / Discretionary Spending
        # Only discretionary money after safety-related categories have been satisfied
        # If income is severely below stabilized baseline (< 60%), hold or minimize flexible
        is_severely_low = income < (stabilized_income * 0.60) if stabilized_income > 0 else False
        if is_severely_low:
            # Re-route remaining into buffer or obligations for safety
            extra_buffer = min(remaining, buffer_gap)
            buffer_allocation += extra_buffer
            remaining = max(0.0, remaining - extra_buffer)
            flexible_allocation = remaining
        else:
            flexible_allocation = remaining

        # Round all values to 2 decimal places
        allocations = {
            "essentials": round(essential_allocation, 2),
            "protected_buffer": round(buffer_allocation, 2),
            "upcoming_obligations": round(obligation_allocation, 2),
            "recovery": round(recovery_allocation, 2),
            "goals": round(goal_allocation, 2),
            "flexible_spending": round(flexible_allocation, 2),
            "total": round(
                essential_allocation + buffer_allocation + obligation_allocation +
                recovery_allocation + goal_allocation + flexible_allocation, 2
            )
        }

        # Build clear, explainable reasoning for each category
        reasons = {
            "essentials": (
                f"₹{allocations['essentials']:,.0f} reserved for essential food, housing, and bills "
                f"based on your ₹{essential_weekly_expenses:,.0f}/wk baseline."
            ),
            "protected_buffer": (
                f"₹{allocations['protected_buffer']:,.0f} allocated to emergency savings. "
                f"Current cushion is ₹{current_buffer:,.0f} towards your ₹{buffer_target:,.0f} goal."
            ),
            "upcoming_obligations": (
                f"₹{allocations['upcoming_obligations']:,.0f} earmarked for upcoming scheduled bills "
                f"before your next expected payout."
                if allocations["upcoming_obligations"] > 0 else
                "No urgent upcoming mandatory obligations pending."
            ),
            "recovery": (
                f"₹{allocations['recovery']:,.0f} dedicated to restoring buffer reserves after recent drawdowns."
                if allocations["recovery"] > 0 else
                "No active recovery needed; emergency buffer is in stable standing."
            ),
            "goals": (
                f"₹{allocations['goals']:,.0f} directed to your active financial goals, "
                f"safe because essential needs and emergency floor are secure."
                if allocations["goals"] > 0 else
                "Goal contribution held until emergency buffer and essential bills are satisfied."
            ),
            "flexible_spending": (
                f"₹{allocations['flexible_spending']:,.0f} available for discretionary spending "
                f"without endangering your emergency floor."
                if allocations["flexible_spending"] > 0 else
                "Discretionary spending minimized to protect survival necessities."
            )
        }

        return {
            "income_received": income,
            "breakdown": allocations,
            "reasons": reasons,
            "buffer_gap": buffer_gap,
            "policy_limit": policy_limit,
            "is_severely_low": is_severely_low
        }

    @staticmethod
    def validate_and_simulate(
        proposed_breakdown: Dict[str, float],
        income_received: float,
        current_buffer: float,
        buffer_target: float,
        minimum_buffer_floor: float,
        essential_weekly_expenses: float,
        income_volatility_cv: float,
        current_resilience: float,
        goal_target: float = 0.0,
        current_goal_amount: float = 0.0
    ) -> Dict[str, Any]:
        """
        Validates a proposed allocation (recommended or user-customized)
        against strict financial safety rules and simulates projected state.
        """
        raw_values = {
            "essentials": float(proposed_breakdown.get("essentials", 0.0)),
            "protected_buffer": float(proposed_breakdown.get("protected_buffer", 0.0)),
            "upcoming_obligations": float(proposed_breakdown.get("upcoming_obligations", 0.0)),
            "recovery": float(proposed_breakdown.get("recovery", 0.0)),
            "goals": float(proposed_breakdown.get("goals", 0.0)),
            "flexible_spending": float(proposed_breakdown.get("flexible_spending", 0.0))
        }

        warnings: List[str] = []
        is_safe = True
        risk_level = "SAFE"

        # Rule 2: Check negative values
        for cat, val in raw_values.items():
            if val < 0:
                is_safe = False
                risk_level = "UNSAFE"
                warnings.append(f"Category '{cat}' cannot be negative (got ₹{val:,.2f}).")

        essentials = max(0.0, raw_values["essentials"])
        buffer_amt = max(0.0, raw_values["protected_buffer"])
        obligations = max(0.0, raw_values["upcoming_obligations"])
        recovery = max(0.0, raw_values["recovery"])
        goals = max(0.0, raw_values["goals"])
        flexible = max(0.0, raw_values["flexible_spending"])

        total_proposed = round(
            raw_values["essentials"] + raw_values["protected_buffer"] + raw_values["upcoming_obligations"] +
            raw_values["recovery"] + raw_values["goals"] + raw_values["flexible_spending"], 2
        )
        income = round(float(income_received), 2)

        # Rule 1: Sum cannot exceed income received (tolerance 0.05 for float rounding)
        if total_proposed > (income + 0.05):
            is_safe = False
            risk_level = "UNSAFE"
            warnings.append(
                f"Total allocation (₹{total_proposed:,.2f}) exceeds received income (₹{income:,.2f}) by ₹{total_proposed - income:,.2f}."
            )

        # Rule 3: Protected Floor Breach Check
        projected_buffer = round(current_buffer + buffer_amt + recovery, 2)
        if projected_buffer < minimum_buffer_floor:
            is_safe = False
            risk_level = "UNSAFE"
            warnings.append(
                f"Projected buffer (₹{projected_buffer:,.0f}) breaches the untouchable minimum floor of ₹{minimum_buffer_floor:,.0f}."
            )

        # Rule 4: Essential coverage check
        if essentials < (essential_weekly_expenses * 0.50) and flexible > (income * 0.25):
            risk_level = "CAUTION" if risk_level != "UNSAFE" else "UNSAFE"
            warnings.append(
                "High flexible spending while essential expenses are underfunded."
            )

        # Calculate projected resilience impact
        # More buffer and lower debt improves score
        buffer_coverage_pct = min(100.0, (projected_buffer / buffer_target * 100.0)) if buffer_target > 0 else 50.0
        buffer_pts = (buffer_amt + recovery) / max(1000.0, buffer_target) * 15.0
        
        # Penalize if flexible spending is excessive during low buffer
        flex_penalty = 0.0
        if projected_buffer < minimum_buffer_floor * 1.2 and flexible > (income * 0.40):
            flex_penalty = 6.0
            if risk_level == "SAFE":
                risk_level = "CAUTION"
                warnings.append("High discretionary spending with a thin emergency reserve.")

        projected_resilience = round(
            max(10.0, min(100.0, current_resilience + buffer_pts - flex_penalty)), 1
        )

        # Coverage weeks projected
        coverage_weeks = round(projected_buffer / essential_weekly_expenses, 1) if essential_weekly_expenses > 0 else 0.0

        # Goal progress projected
        projected_goal = round(current_goal_amount + goals, 2)
        goal_pct = min(100.0, round((projected_goal / goal_target * 100.0), 1)) if goal_target > 0 else 0.0

        return {
            "is_safe": is_safe,
            "risk_level": risk_level,
            "warnings": warnings,
            "projected_buffer": projected_buffer,
            "buffer_coverage_weeks": coverage_weeks,
            "current_resilience": round(current_resilience, 1),
            "projected_resilience": projected_resilience,
            "projected_goal_amount": projected_goal,
            "projected_goal_percentage": goal_pct,
            "breakdown": {
                "essentials": essentials,
                "protected_buffer": buffer_amt,
                "upcoming_obligations": obligations,
                "recovery": recovery,
                "goals": goals,
                "flexible_spending": flexible,
                "total": total_proposed
            }
        }
