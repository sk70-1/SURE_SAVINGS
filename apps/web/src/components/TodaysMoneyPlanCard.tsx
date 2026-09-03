"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Recommendation, BufferStatus, AllocationPlan, IncomeAnalytics } from "../lib/types";

interface TodaysMoneyPlanCardProps {
  recommendations: Recommendation[];
  buffer: BufferStatus | null;
  allocationPlan: AllocationPlan | null;
  analytics: IncomeAnalytics | null;
  onApproveRecommendation?: (id: number) => Promise<void>;
  onDismissRecommendation?: (id: number) => Promise<void>;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onOpenEditPlan?: () => void;
  onOpenAddTransaction?: () => void;
}

export const TodaysMoneyPlanCard: React.FC<TodaysMoneyPlanCardProps> = ({
  recommendations,
  buffer,
  allocationPlan,
  analytics,
  onApproveRecommendation,
  onDismissRecommendation,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenEditPlan,
  onOpenAddTransaction,
}) => {
  const [whyExpanded, setWhyExpanded] = useState(false);
  const [isActing, setIsActing] = useState(false);

  // Pick the primary pending recommendation if available
  const pendingRec = recommendations.find((r) => r.status === "PENDING");

  // Determine Safe-to-spend cash
  const safeToSpend = allocationPlan?.breakdown?.flexible_spending ?? 
    Math.max(0, (analytics?.recent_actual_income || 0) - (allocationPlan?.breakdown?.essentials || 6000));

  type CtaAction = "APPROVE_REC" | "DEPOSIT" | "WITHDRAW" | "REVIEW_PLAN";

  // Build the single primary plain-language action and status
  let statusBadge = "Safe this week";
  let statusBadgeStyle = "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]";
  let headline = "You are safe this week";
  let recommendedAction = "Save ₹1,000";
  let amount = 1000;
  let reason = "Your upcoming bills are covered, and you still have plenty left for daily expenses.";
  let impact = `You will still have ₹${Math.round(safeToSpend).toLocaleString("en-IN")} available for food, petrol, and daily spending.`;
  let ctaLabel = "Save ₹1,000 to Emergency Savings";
  let ctaType: CtaAction = "DEPOSIT";
  let whyDetails = [
    "Your essential expenses and upcoming bills are already secured.",
    "Stashing extra earnings now protects you during slow gig weeks.",
    "This never moves real money from your bank account automatically.",
  ];

  if (pendingRec) {
    amount = Math.round(pendingRec.recommended_amount || 0);
    if (pendingRec.type === "SAVE_SURPLUS") {
      statusBadge = "Good Week! Extra Income";
      statusBadgeStyle = "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]";
      headline = "You have extra earnings this week";
      recommendedAction = `Set aside ₹${amount.toLocaleString("en-IN")}`;
      reason = pendingRec.why || "Your upcoming bills are secured, making this a safe time to build your emergency savings.";
      impact = `After saving ₹${amount.toLocaleString("en-IN")}, you will still have ₹${Math.round(safeToSpend).toLocaleString("en-IN")} for daily living.`;
      ctaLabel = `Save ₹${amount.toLocaleString("en-IN")} to Emergency Savings`;
      ctaType = "APPROVE_REC";
      whyDetails = [
        `Your recent income (₹${Math.round(analytics?.recent_actual_income || 0).toLocaleString("en-IN")}) exceeded your weekly baseline.`,
        "This recommendation leaves your essential bills and living costs fully funded.",
        "Your emergency savings will stay protected for when gig demand slows down.",
      ];
    } else if (pendingRec.type === "USE_BUFFER") {
      statusBadge = "Slow Week";
      statusBadgeStyle = "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]";
      headline = "Use your emergency savings to cover bills";
      recommendedAction = `Draw ₹${amount.toLocaleString("en-IN")} from savings`;
      reason = pendingRec.why || "Income is lower than usual this week. Your emergency savings are here exactly for this.";
      impact = `This safely covers your essential bills without missing payments or taking high-cost loans.`;
      ctaLabel = `Use ₹${amount.toLocaleString("en-IN")} from Savings`;
      ctaType = "APPROVE_REC";
      whyDetails = [
        "Your emergency savings are meant to smooth out slow or unpaid weeks.",
        `Drawing ₹${amount.toLocaleString("en-IN")} keeps you above your minimum safe floor.`,
        "You can replenish your cushion once payouts pick back up.",
      ];
    } else if (pendingRec.type === "PROTECT_BUFFER" || pendingRec.type === "HOLD_CASH") {
      statusBadge = "Bills Ahead";
      statusBadgeStyle = "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]";
      headline = "Keep money ready for upcoming bills";
      recommendedAction = "Keep cash in your account";
      reason = pendingRec.why || "You have essential bills coming due soon. Keep this cash available rather than spending it.";
      impact = "This avoids overdraft fees and keeps all your bills on time.";
      ctaLabel = "Review Upcoming Bills";
      ctaType = "REVIEW_PLAN";
      whyDetails = [
        "Upcoming bills require funds in your regular bank account.",
        "Keeping cash ready now prevents cash-flow pinches later this month.",
        "We'll alert you when it's safe to start saving again.",
      ];
    }
  } else if (allocationPlan && allocationPlan.breakdown.protected_buffer > 0) {
    amount = Math.round(allocationPlan.breakdown.protected_buffer);
    recommendedAction = `Save ₹${amount.toLocaleString("en-IN")}`;
    reason = "Your planned weekly allocation recommends stashing this amount to keep your cushion on track.";
    impact = `You will still have ₹${Math.round(safeToSpend).toLocaleString("en-IN")} for daily spending.`;
    ctaLabel = `Save ₹${amount.toLocaleString("en-IN")} to Emergency Savings`;
    ctaType = "DEPOSIT";
  }

  const handlePrimaryClick = async () => {
    setIsActing(true);
    try {
      const action = ctaType as string;
      if (action === "APPROVE_REC" && pendingRec && onApproveRecommendation) {
        await onApproveRecommendation(pendingRec.id);
      } else if (action === "DEPOSIT" && onOpenDeposit) {
        onOpenDeposit();
      } else if (action === "WITHDRAW" && onOpenWithdraw) {
        onOpenWithdraw();
      } else if (action === "REVIEW_PLAN" && onOpenEditPlan) {
        onOpenEditPlan();
      }
    } finally {
      setIsActing(false);
    }
  };

  const handleNotNow = async () => {
    if (pendingRec && onDismissRecommendation) {
      await onDismissRecommendation(pendingRec.id);
    }
  };

  return (
    <section className="bg-gradient-to-br from-white via-[#fffdfc] to-[#fff7f5] border border-[#ffdad4] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all">
      {/* Decorative calm background glow */}
      <div className="absolute -top-12 -right-12 w-56 h-56 bg-gradient-to-bl from-[#ff5b45]/10 via-[#f59e0b]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Top row: Label and status badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff5b45] to-[#f59e0b] text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff5b45]">
              Today's Money Plan
            </span>
            <span className="text-xs text-[#6b7280] block font-medium">Your daily recommendation</span>
          </div>
        </div>

        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusBadgeStyle} flex items-center space-x-1.5 shadow-xs`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>{statusBadge}</span>
        </span>
      </div>

      {/* Main recommendation headline & amount */}
      <div className="my-3">
        <h2 className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight leading-tight">
          {headline}
        </h2>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-black text-[#ff5b45] font-mono tracking-tight">
            {recommendedAction}
          </span>
        </div>
      </div>

      {/* Short friendly reason & impact */}
      <div className="mt-3 bg-white/80 border border-[#eae8e3] rounded-2xl p-4 space-y-2">
        <p className="text-sm font-medium text-[#374151] leading-relaxed">
          {reason}
        </p>
        <p className="text-xs text-[#059669] font-bold flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{impact}</span>
        </p>
      </div>

      {/* Primary Action Button & "Not now" button */}
      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={handlePrimaryClick}
          disabled={isActing}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 text-white text-sm font-black shadow-md shadow-[#ff5b45]/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {pendingRec && (
          <button
            onClick={handleNotNow}
            className="px-4 py-3 text-xs font-bold text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] rounded-2xl transition-all text-center cursor-pointer"
          >
            Not now
          </button>
        )}

        {/* Expandable "Why?" link */}
        <button
          onClick={() => setWhyExpanded(!whyExpanded)}
          className="ml-auto text-xs font-bold text-[#ff5b45] hover:text-[#e04835] flex items-center space-x-1 py-2 px-2 rounded-xl transition-all self-center cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Why this recommendation?</span>
          {whyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Explanation Details */}
      {whyExpanded && (
        <div className="mt-4 pt-4 border-t border-[#ffdad4]/60 space-y-2 text-xs text-[#4b5563] animate-fadeIn">
          <h4 className="font-bold text-[#111827]">Why we recommend this:</h4>
          <ul className="space-y-1.5 list-disc list-inside text-[#4b5563] pl-1">
            {whyDetails.map((point, idx) => (
              <li key={idx} className="leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-[#9ca3af] pt-1 italic">
            Note: Sure-Savings is your friendly guide and simulation. We never move real money out of your bank automatically.
          </p>
        </div>
      )}
    </section>
  );
};
