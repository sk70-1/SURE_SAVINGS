"""
Deterministic Money Allocation Autopilot Service.
Calculates, validates, and simulates recommended allocations across:
1. Essentials
2. Protected Buffer
3. Upcoming Obligations
4. Recovery
5. Financial Goals
6. Flexible Spending

All arithmetic executes with exact Decimal precision and ROUND_HALF_UP.
Recommendation-first: All real money movement remains strictly simulated
and requires explicit user approval in the UI.
"""

from typing import Dict, Any, List, Union
from decimal import Decimal
from app.engine.financial_engine import FinancialEngine


def _to_dec(val: Any) -> Decimal:
    return FinancialEngine.to_decimal(val)


def _round_2(val: Any) -> float:
    return float(FinancialEngine.round_money(val))


class MoneyAllocationService:
    @staticmethod
    def calculate_allocation(
        income_received: Union[float, Decimal],
        essential_weekly_expenses: Union[float, Decimal],
        current_buffer: Union[float, Decimal],
        buffer_target: Union[float, Decimal],
        minimum_buffer_floor: Union[float, Decimal],
        stabilized_income: Union[float, Decimal],
        income_volatility_cv: float,
        forecast_confidence: float = 0.90,
        upcoming_obligations: Union[float, Decimal] = 0.0,
        active_goal_need: Union[float, Decimal] = 0.0,
        recent_drawdown_amount: Union[float, Decimal] = 0.0,
        is_income_declining: bool = False
    ) -> Dict[str, Any]:
        """
        Deterministic prioritization engine for incoming money with Decimal precision:
        Priority 1: Essentials
        Priority 2: Protected Buffer
        Priority 3: Upcoming Obligations
        Priority 4: Recovery (from recent distress/drawdown)
        Priority 5: Financial Goals
        Priority 6: Flexible Spending
        """
        income = max(Decimal("0.00"), _to_dec(income_received))
        essential_expenses = max(Decimal("0.00"), _to_dec(essential_weekly_expenses))
        curr_buffer = max(Decimal("0.00"), _to_dec(current_buffer))
        buf_target = max(Decimal("0.00"), _to_dec(buffer_target))
        min_floor = max(Decimal("0.00"), _to_dec(minimum_buffer_floor))
        stab_income = max(Decimal("0.00"), _to_dec(stabilized_income))
        upcoming_obs = max(Decimal("0.00"), _to_dec(upcoming_obligations))
        goal_need = max(Decimal("0.00"), _to_dec(active_goal_need))
        recent_drawdown = max(Decimal("0.00"), _to_dec(recent_drawdown_amount))

        remaining = income

        # Priority 1: Financial Safety — Essentials
        essential_allocation = min(essential_expenses, remaining)
        remaining = max(Decimal("0.00"), remaining - essential_allocation)

        # Priority 2: Protected Buffer
        buffer_gap = max(Decimal("0.00"), buf_target - curr_buffer)
        policy_limit = max(Decimal("500.00"), essential_expenses * Decimal("0.50"))
        
        safe_save_eval = FinancialEngine.calculate_safe_to_save(
            financial_surplus=remaining,
            buffer_gap=buffer_gap,
            policy_limit=policy_limit,
            income_volatility_cv=income_volatility_cv,
            forecast_confidence=forecast_confidence,
            is_income_declining=is_income_declining
        )
        safe_save_amount = _to_dec(safe_save_eval["safe_to_save_amount"])
        buffer_allocation = min(remaining, safe_save_amount)
        remaining = max(Decimal("0.00"), remaining - buffer_allocation)

        # Priority 3: Upcoming Mandatory Obligations
        obligation_allocation = min(upcoming_obs, remaining)
        remaining = max(Decimal("0.00"), remaining - obligation_allocation)

        # Priority 4: Recovery
        recovery_need = max(Decimal("0.00"), recent_drawdown)
        if recovery_need > Decimal("0.00") and curr_buffer < buf_target:
            recovery_allocation = min(remaining, recovery_need, essential_expenses * Decimal("0.30"))
            remaining = max(Decimal("0.00"), remaining - recovery_allocation)
        else:
            recovery_allocation = Decimal("0.00")

        # Priority 5: Financial Goals
        can_fund_goals = (essential_allocation >= (essential_expenses * Decimal("0.80"))) and (curr_buffer >= min_floor)
        if can_fund_goals and goal_need > Decimal("0.00") and remaining > Decimal("0.00"):
            max_goal_portion = max(Decimal("100.00"), remaining * Decimal("0.40"))
            goal_allocation = min(remaining, goal_need, max_goal_portion)
            remaining = max(Decimal("0.00"), remaining - goal_allocation)
        else:
            goal_allocation = Decimal("0.00")

        # Priority 6: Flexible / Discretionary Spending
        is_severely_low = income < (stab_income * Decimal("0.60")) if stab_income > Decimal("0.00") else False
        if is_severely_low:
            extra_buffer = min(remaining, buffer_gap)
            buffer_allocation += extra_buffer
            remaining = max(Decimal("0.00"), remaining - extra_buffer)
            flexible_allocation = remaining
        else:
            flexible_allocation = remaining

        # Round all values to 2 decimal places using ROUND_HALF_UP
        ess_f = _round_2(essential_allocation)
        buf_f = _round_2(buffer_allocation)
        obl_f = _round_2(obligation_allocation)
        rec_f = _round_2(recovery_allocation)
        gol_f = _round_2(goal_allocation)
        flx_f = _round_2(flexible_allocation)
        total_f = round(ess_f + buf_f + obl_f + rec_f + gol_f + flx_f, 2)

        allocations = {
            "essentials": ess_f,
            "protected_buffer": buf_f,
            "upcoming_obligations": obl_f,
            "recovery": rec_f,
            "goals": gol_f,
            "flexible_spending": flx_f,
            "total": total_f
        }

        # Build clear, explainable reasoning for each category
        reasons = {
            "essentials": (
                f"₹{allocations['essentials']:,.0f} reserved for essential food, housing, and bills "
                f"based on your ₹{float(essential_expenses):,.0f}/wk baseline."
            ),
            "protected_buffer": (
                f"₹{allocations['protected_buffer']:,.0f} allocated to emergency savings. "
                f"Current cushion is ₹{float(curr_buffer):,.0f} towards your ₹{float(buf_target):,.0f} goal."
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
            "income_received": float(income),
            "breakdown": allocations,
            "reasons": reasons,
            "buffer_gap": float(buffer_gap),
            "policy_limit": float(policy_limit),
            "is_severely_low": is_severely_low
        }

    @staticmethod
    def validate_and_simulate(
        proposed_breakdown: Dict[str, Any],
        income_received: Union[float, Decimal],
        current_buffer: Union[float, Decimal],
        buffer_target: Union[float, Decimal],
        minimum_buffer_floor: Union[float, Decimal],
        essential_weekly_expenses: Union[float, Decimal],
        income_volatility_cv: float,
        current_resilience: float,
        goal_target: Union[float, Decimal] = 0.0,
        current_goal_amount: Union[float, Decimal] = 0.0
    ) -> Dict[str, Any]:
        """
        Validates a proposed allocation against strict financial safety rules
        and simulates projected state using exact Decimal arithmetic.
        """
        dec_vals = {
            "essentials": _to_dec(proposed_breakdown.get("essentials", 0.0)),
            "protected_buffer": _to_dec(proposed_breakdown.get("protected_buffer", 0.0)),
            "upcoming_obligations": _to_dec(proposed_breakdown.get("upcoming_obligations", 0.0)),
            "recovery": _to_dec(proposed_breakdown.get("recovery", 0.0)),
            "goals": _to_dec(proposed_breakdown.get("goals", 0.0)),
            "flexible_spending": _to_dec(proposed_breakdown.get("flexible_spending", 0.0))
        }

        warnings: List[str] = []
        is_safe = True
        risk_level = "SAFE"

        # Check negative values
        for cat, val in dec_vals.items():
            if val < Decimal("0.00"):
                is_safe = False
                risk_level = "UNSAFE"
                warnings.append(f"Category '{cat}' cannot be negative (got ₹{float(val):,.2f}).")

        essentials = max(Decimal("0.00"), dec_vals["essentials"])
        buffer_amt = max(Decimal("0.00"), dec_vals["protected_buffer"])
        obligations = max(Decimal("0.00"), dec_vals["upcoming_obligations"])
        recovery = max(Decimal("0.00"), dec_vals["recovery"])
        goals = max(Decimal("0.00"), dec_vals["goals"])
        flexible = max(Decimal("0.00"), dec_vals["flexible_spending"])

        total_dec = essentials + buffer_amt + obligations + recovery + goals + flexible
        total_proposed = _round_2(total_dec)
        dec_income = _to_dec(income_received)
        income_f = _round_2(dec_income)

        # Rule 1: Sum cannot exceed income received (tolerance 0.01 for rounding)
        if total_dec > (dec_income + Decimal("0.01")):
            is_safe = False
            risk_level = "UNSAFE"
            diff = float(total_dec - dec_income)
            warnings.append(
                f"Total allocation (₹{total_proposed:,.2f}) exceeds received income (₹{income_f:,.2f}) by ₹{diff:,.2f}."
            )

        # Rule 3: Protected Floor Breach Check
        dec_curr_buf = _to_dec(current_buffer)
        dec_min_floor = _to_dec(minimum_buffer_floor)
        projected_buffer_dec = dec_curr_buf + buffer_amt + recovery
        projected_buffer = _round_2(projected_buffer_dec)

        if projected_buffer_dec < dec_min_floor:
            is_safe = False
            risk_level = "UNSAFE"
            warnings.append(
                f"Projected buffer (₹{projected_buffer:,.0f}) breaches the untouchable minimum floor of ₹{float(dec_min_floor):,.0f}."
            )

        # Rule 4: Essential coverage check
        dec_ess_exp = _to_dec(essential_weekly_expenses)
        if essentials < (dec_ess_exp * Decimal("0.50")) and flexible > (dec_income * Decimal("0.25")):
            risk_level = "CAUTION" if risk_level != "UNSAFE" else "UNSAFE"
            warnings.append("High flexible spending while essential expenses are underfunded.")

        # Calculate projected resilience impact
        dec_buf_target = _to_dec(buffer_target)
        buffer_pts = float((buffer_amt + recovery) / max(Decimal("1000.00"), dec_buf_target) * Decimal("15.0"))
        
        flex_penalty = 0.0
        if projected_buffer_dec < (dec_min_floor * Decimal("1.2")) and flexible > (dec_income * Decimal("0.40")):
            flex_penalty = 6.0
            if risk_level == "SAFE":
                risk_level = "CAUTION"
                warnings.append("High discretionary spending with a thin emergency reserve.")

        projected_resilience = round(
            max(10.0, min(100.0, current_resilience + buffer_pts - flex_penalty)), 1
        )

        coverage_weeks = round(float(projected_buffer_dec / dec_ess_exp), 1) if dec_ess_exp > Decimal("0.00") else 0.0

        dec_goal_target = _to_dec(goal_target)
        dec_curr_goal = _to_dec(current_goal_amount)
        projected_goal_dec = dec_curr_goal + goals
        projected_goal = _round_2(projected_goal_dec)
        goal_pct = min(100.0, round(float(projected_goal_dec / dec_goal_target * Decimal("100.0")), 1)) if dec_goal_target > Decimal("0.00") else 0.0

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
                "essentials": _round_2(essentials),
                "protected_buffer": _round_2(buffer_amt),
                "upcoming_obligations": _round_2(obligations),
                "recovery": _round_2(recovery),
                "goals": _round_2(goals),
                "flexible_spending": _round_2(flexible),
                "total": total_proposed
            }
        }
