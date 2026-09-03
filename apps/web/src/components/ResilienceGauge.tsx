"use client";

import React from "react";
import { ShieldCheck, HeartHandshake } from "lucide-react";
import { ResilienceScore } from "../lib/types";

interface ResilienceGaugeProps {
  resilience: ResilienceScore | null;
  isProMode?: boolean;
}

export const ResilienceGauge: React.FC<ResilienceGaugeProps> = ({ resilience, isProMode = false }) => {
  const defaultResilience: ResilienceScore = {
    overall_score: 75,
    rating: "Strong",
    income_stability: 80,
    buffer_coverage: 75,
    expense_health: 70,
    cash_flow_health: 75,
    breakdown_notes: ["Your emergency cushion can handle short slow periods."],
  };
  const activeResilience = resilience || defaultResilience;

  const score = Math.round(activeResilience.overall_score);

  // Friendly human rating
  let ratingText = "Healthy";
  let scoreColor = "text-[#059669]";
  let bgBadge = "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]";
  let friendlyAdvice = "Great shape! Your savings can easily handle slow work weeks.";

  if (score < 40) {
    ratingText = "Needs Care";
    scoreColor = "text-[#e11d48]";
    bgBadge = "bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]";
    friendlyAdvice = "Your savings are low right now. Try to save small amounts during good weeks.";
  } else if (score < 60) {
    ratingText = "Fair Cushion";
    scoreColor = "text-[#d97706]";
    bgBadge = "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]";
    friendlyAdvice = "Decent stability. Adding a little more will give you total peace of mind.";
  } else if (score < 80) {
    ratingText = "Strong Buffer";
    scoreColor = "text-[#059669]";
    bgBadge = "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]";
    friendlyAdvice = "Good cushion! You can absorb slower gig periods without stress.";
  } else {
    ratingText = "Very Secure";
    scoreColor = "text-[#059669]";
    bgBadge = "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]";
    friendlyAdvice = "Outstanding! You have multiple weeks of essential expenses saved.";
  }

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#111827] tracking-wide">
                Financial Health Score
              </h3>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${bgBadge}`}>
                {ratingText}
              </span>
            </div>
            <p className="text-xs text-[#6b7280] mt-1">How ready you are for slow or unpaid weeks</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">Score</span>
            <div className={`text-3xl font-black font-mono tracking-tight ${scoreColor}`}>
              {score}
              <span className="text-xs font-normal text-[#9ca3af] font-sans">/100</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 mb-3">
          <div className="w-full bg-[#f3f4f6] h-2.5 rounded-full overflow-hidden border border-[#eae8e3]">
            <div
              className="h-full bg-gradient-to-r from-[#ff5b45] via-[#f59e0b] to-[#10b981] rounded-full transition-all duration-500"
              style={{ width: `${score}%` }}
            ></div>
          </div>
        </div>

        {/* Human explanation banner */}
        <div className="bg-[#fbfbfa] p-3 rounded-xl border border-[#eae8e3] mb-3 flex items-start space-x-2">
          <HeartHandshake className="w-4 h-4 text-[#ff5b45] mt-0.5 shrink-0" />
          <p className="text-xs text-[#4b5563] leading-relaxed">{friendlyAdvice}</p>
        </div>

        {/* 4 Pillars in Simple Terms */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block font-medium">Income Consistency</span>
            <span className="text-xs font-bold text-[#111827] font-mono">
              {Math.round(activeResilience.income_stability)}%
            </span>
          </div>

          <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block font-medium">Emergency Savings</span>
            <span className="text-xs font-bold text-[#111827] font-mono">
              {Math.round(activeResilience.buffer_coverage)}%
            </span>
          </div>

          <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block font-medium">Bills & Rent Covered</span>
            <span className="text-xs font-bold text-[#111827] font-mono">
              {Math.round(activeResilience.expense_health)}%
            </span>
          </div>

          <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block font-medium">Monthly Cash In/Out</span>
            <span className="text-xs font-bold text-[#111827] font-mono">
              {Math.round(activeResilience.cash_flow_health)}%
            </span>
          </div>
        </div>
      </div>

      {isProMode && (
        <div className="mt-3 pt-2.5 border-t border-[#eae8e3] text-[10px] font-mono text-[#6b7280]">
          Formula: 0.25×Consistency + 0.30×Savings + 0.20×Bills + 0.25×CashFlow
        </div>
      )}
    </div>
  );
};
