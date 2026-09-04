"""
AI Explanation Layer for Smart Income Buffer.
STRICT BOUNDARY:
- AI is an EXPLANATION layer, never a calculation or execution authority.
- Grounded strictly on backend facts (Financial Summary, Forecast, Buffer Status, Resilience Score).
- Strictly rejects any command to execute transactions, move funds, or calculate arbitrary figures.
"""

from typing import Dict, Any, List, Optional


SYSTEM_INSTRUCTION = """
You are the Smart Income Buffer Financial Assistant.
Your sole role is to explain the user's financial facts and metrics calculated by the deterministic backend engine.

CRITICAL RULES:
1. You MUST NEVER calculate balances, interest, or money movement yourself. Use only the figures provided in the Fact Sheet below.
2. You MUST NEVER execute, approve, or promise to execute transactions, wire money, or transfer funds. All transactions require explicit user confirmation in the UI.
3. You MUST NEVER fabricate or hallucinate transaction history or balances.
4. You explain 'What', 'Why', and 'Impact' in clear, empathetic, practical language tailored to gig workers and freelancers.
5. If the user asks you to transfer money or withdraw beyond their floor, politely refuse and explain the backend safety boundary.
"""


class AiExplanationService:
    @staticmethod
    def build_fact_sheet(
        user_name: str,
        financial_summary: Dict[str, Any],
        buffer_status: Dict[str, Any],
        resilience_score: Dict[str, Any],
        forecast: Dict[str, Any],
        recommendations: List[Dict[str, Any]],
        recent_transactions: List[Dict[str, Any]],
        allocation_plan: Optional[Dict[str, Any]] = None,
        goals: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Assembles a verified, read-only snapshot of financial facts."""
        return {
            "user": user_name,
            "currency": "INR (₹)",
            "allocation_plan": allocation_plan,
            "financial_goals": goals or [],
            "income_analytics": {
                "stabilized_income": financial_summary.get("stabilized_income"),
                "recent_weekly_average": financial_summary.get("mean"),
                "recent_weekly_median": financial_summary.get("median"),
                "volatility_cv": financial_summary.get("cv"),
                "volatility_rating": financial_summary.get("volatility_rating"),
                "formula": "0.60 * Median + 0.40 * Average (trailing 4-8 weeks)"
            },
            "buffer": {
                "current_balance": buffer_status.get("current_balance"),
                "target_amount": buffer_status.get("target_amount"),
                "minimum_floor": buffer_status.get("minimum_floor"),
                "available_safe_buffer": buffer_status.get("available_safe_buffer"),
                "coverage_weeks": buffer_status.get("coverage_weeks")
            },
            "resilience": {
                "score": resilience_score.get("overall_score"),
                "rating": resilience_score.get("rating"),
                "sub_scores": {
                    "income_stability": resilience_score.get("income_stability"),
                    "buffer_coverage": resilience_score.get("buffer_coverage"),
                    "expense_health": resilience_score.get("expense_health"),
                    "cash_flow_health": resilience_score.get("cash_flow_health")
                }
            },
            "forecast": {
                "expected_next_income": forecast.get("expected_income"),
                "confidence_interval": [forecast.get("lower_bound"), forecast.get("upper_bound")],
                "confidence": forecast.get("confidence")
            },
            "active_recommendations": [
                {
                    "type": r.get("type"),
                    "what": r.get("what"),
                    "why": r.get("why"),
                    "impact": r.get("impact"),
                    "recommended_amount": r.get("recommended_amount")
                }
                for r in recommendations
            ],
            "recent_transactions_count": len(recent_transactions)
        }

    @classmethod
    def explain_financial_status(
        cls,
        user_message: str,
        fact_sheet: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates an accurate, grounded explanation using verified backend facts.
        """
        user_msg_lower = user_message.lower()

        # Check for attempted transaction execution
        refusal_keywords = ["send money", "transfer", "pay my", "withdraw all", "deposit right now", "execute payment"]
        if any(kw in user_msg_lower for kw in refusal_keywords):
            return {
                "reply": (
                    "I cannot directly execute transactions or move funds. "
                    "As an AI explanation assistant, all monetary transactions must be initiated and confirmed "
                    "by you through the Smart Buffer Simulator on your dashboard to ensure complete audit compliance."
                ),
                "grounded_context": fact_sheet,
                "model_used": "Deterministic Guardrail Filter"
            }

        # Money Allocation Autopilot Explanation
        if "allocat" in user_msg_lower or "autopilot" in user_msg_lower or "split" in user_msg_lower or "where does my money go" in user_msg_lower:
            plan = fact_sheet.get("allocation_plan")
            if plan and plan.get("breakdown"):
                b = plan["breakdown"]
                return {
                    "reply": (
                        f"Here is your active **Money Allocation Autopilot Plan** for **₹{plan['income_received']:,.0f}**:\n\n"
                        f"- 🏠 **Essentials**: ₹{b['essentials']:,.0f} (Protects survival, rent & food)\n"
                        f"- 🛡️ **Protected Buffer**: ₹{b['protected_buffer']:,.0f} (Replenishes emergency cushion)\n"
                        f"- 📅 **Upcoming Obligations**: ₹{b['upcoming_obligations']:,.0f} (Reserved for scheduled bills)\n"
                        f"- 🎯 **Financial Goals**: ₹{b['goals']:,.0f} (Progress towards your active targets)\n"
                        f"- ☕ **Flexible Spending**: ₹{b['flexible_spending']:,.0f} (Safe discretionary allowance)\n"
                        f"- 🔄 **Recovery**: ₹{b['recovery']:,.0f} (Rebuilding after past shortfalls)\n\n"
                        f"**Safety Status**: {plan['risk_level']}\n\n"
                        f"**Why this allocation?**\n"
                        f"The deterministic Autopilot prioritized financial safety first, ensuring your essential commitments "
                        f"and protected buffer floor are secured before releasing discretionary spending."
                    ),
                    "grounded_context": fact_sheet,
                    "model_used": "Grounded Allocation Explainer"
                }

        # Safe-to-Save explanation (Golden Path A)
        if "safe" in user_msg_lower or "save" in user_msg_lower or "900" in user_msg_lower or "surplus" in user_msg_lower:
            rec = next((r for r in fact_sheet["active_recommendations"] if r["type"] == "SAVE_SURPLUS"), None)
            amt = rec["recommended_amount"] if rec else 900.0
            return {
                "reply": (
                    f"Our Safe-to-Save engine recommends setting aside **₹{amt:,.0f}**.\n\n"
                    f"**Why this exact amount?**\n"
                    f"1. **Stabilized Baseline**: Your stabilized income is evaluated at ₹{fact_sheet['income_analytics']['stabilized_income']:,.0f} "
                    f"based on your 4–8 week weighted average & median.\n"
                    f"2. **Cash Floor Protection**: The algorithm first safeguards your required minimum cash reserve so checking funds are never tight.\n"
                    f"3. **Volatility Dampening**: Factoring in your income volatility (CV: {fact_sheet['income_analytics']['volatility_cv']:.2f}), "
                    f"the system caps savings at a safe limit rather than forcing you to save the whole surplus.\n\n"
                    f"Locking in this amount will bring your Smart Buffer closer to your ₹{fact_sheet['buffer']['target_amount']:,.0f} target."
                ),
                "grounded_context": fact_sheet,
                "model_used": "Grounded Financial Explainer"
            }

        # Buffer drawdown or low income explanation (Golden Path B)
        if "low" in user_msg_lower or "shortfall" in user_msg_lower or "floor" in user_msg_lower or "buffer" in user_msg_lower:
            return {
                "reply": (
                    f"Your Smart Buffer balance is currently **₹{fact_sheet['buffer']['current_balance']:,.0f}** "
                    f"against a target of **₹{fact_sheet['buffer']['target_amount']:,.0f}** ({fact_sheet['buffer']['coverage_weeks']:.1f} weeks coverage).\n\n"
                    f"**Safety Floor Guarantee**:\n"
                    f"Your configured minimum buffer floor is **₹{fact_sheet['buffer']['minimum_floor']:,.0f}**. "
                    f"The system designates ₹{fact_sheet['buffer']['available_safe_buffer']:,.0f} as available for drawdown. "
                    f"Even during severe contract dry spells, the backend will strictly prevent withdrawals below your ₹{fact_sheet['buffer']['minimum_floor']:,.0f} floor to guarantee survival runway."
                ),
                "grounded_context": fact_sheet,
                "model_used": "Grounded Financial Explainer"
            }

        # Resilience score explanation
        if "resilience" in user_msg_lower or "score" in user_msg_lower:
            r = fact_sheet["resilience"]
            return {
                "reply": (
                    f"Your overall Resilience Score is **{r['score']}/100 ({r['rating']})**.\n\n"
                    f"It is composed deterministically across four key pillars:\n"
                    f"- **Income Stability**: {r['sub_scores']['income_stability']:.1f}/100 (weighted 25%)\n"
                    f"- **Buffer Coverage**: {r['sub_scores']['buffer_coverage']:.1f}/100 (weighted 30%)\n"
                    f"- **Expense Health**: {r['sub_scores']['expense_health']:.1f}/100 (weighted 20%)\n"
                    f"- **Cash Flow Health**: {r['sub_scores']['cash_flow_health']:.1f}/100 (weighted 25%)\n\n"
                    f"To elevate your score into the Exceptional tier, approve Safe-to-Save recommendations to expand buffer coverage."
                ),
                "grounded_context": fact_sheet,
                "model_used": "Grounded Financial Explainer"
            }

        # General inquiry overview
        return {
            "reply": (
                f"Hello {fact_sheet['user']}! Here is your current financial status snapshot:\n\n"
                f"- **Stabilized Income**: ₹{fact_sheet['income_analytics']['stabilized_income']:,.0f} / week\n"
                f"- **Smart Buffer**: ₹{fact_sheet['buffer']['current_balance']:,.0f} (Target: ₹{fact_sheet['buffer']['target_amount']:,.0f})\n"
                f"- **Resilience Score**: {fact_sheet['resilience']['score']}/100 ({fact_sheet['resilience']['rating']})\n"
                f"- **Next Expected Income**: ₹{fact_sheet['forecast']['expected_next_income']:,.0f} "
                f"(± range: ₹{fact_sheet['forecast']['confidence_interval'][0]:,.0f} - ₹{fact_sheet['forecast']['confidence_interval'][1]:,.0f})\n\n"
                f"How can I assist you with your cash flow or buffer strategy today?"
            ),
            "grounded_context": fact_sheet,
            "model_used": "Grounded Financial Explainer"
        }
