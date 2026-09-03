"use client";

import React from "react";
import { ShieldCheck, HeartHandshake } from "lucide-react";
import { ResilienceScore } from "../lib/types";

interface ResilienceGaugeProps {
  resilience: ResilienceScore | null;
  isProMode?: boolean;
}

export const ResilienceGauge: React.FC<ResilienceGaugeProps> = ({ resilience, isProMode = false }) => {
  if (!resilience) {
    return (
      <div className="glass-panel rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-36 bg-[#f3f4f6] rounded mb-4"></div>
        <div className="h-24 bg-[#f3f4f6] rounded"></div>
      </div>
    );
  }

  const score = Math.round(resilience.overall_score);

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
    ratingText = "Strong";
    scoreColor = "text-[#ff5b45]";
    bgBadge = "bg-[#fff5f3] text-[#ff5b45] border-[#ffdad4]";
    friendlyAdvice = "You're in great shape! Enough savings to comfortably handle a dry spell.";
  }

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#111827] tracking-wide">
                Financial Safety Score
              </h3>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${bgBadge}`}>
                {ratingText}
              </span>
            </div>
            <p className="text-xs text-[#6b7280] mt-1">How prepared you are for unexpected expenses</p>
          </div>

          <div className="text-right">
            <div className={`text-4xl font-black tracking-tight font-mono ${scoreColor}`}>
              {score}
              <span className="text-sm font-normal text-[#9ca3af] font-sans">/100</span>
            </div>
          </div>
        </div>

        {/* Friendly Advice Box */}
        <div className="bg-[#fbfbfa] p-3 rounded-xl border border-[#eae8e3] text-xs text-[#4b5563] leading-relaxed mb-4 flex items-start space-x-2.5">
          <HeartHandshake className="w-4 h-4 text-[#ff5b45] shrink-0 mt-0.5" />
          <span>{friendlyAdvice}</span>
        </div>

        {/* 4 Pillars in Simple Terms */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block font-medium">Income Consistency</span>
            <span className="text-xs font-bold text-[#111827] font-mono">
              {Math.round(resilience.income_stability)}%
            </span>
          </div>

          <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block font-medium">Emergency Savings</span>
            <span className="text-xs font-bold text-[#111827] font-mono">
              {Math.round(resilience.buffer_coverage)}%
            </span>
          </div>

          <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block font-medium">Bills & Rent Covered</span>
            <span className="text-xs font-bold text-[#111827] font-mono">
              {Math.round(resilience.expense_health)}%
            </span>
          </div>

          <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block font-medium">Monthly Cash In/Out</span>
            <span className="text-xs font-bold text-[#111827] font-mono">
              {Math.round(resilience.cash_flow_health)}%
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
