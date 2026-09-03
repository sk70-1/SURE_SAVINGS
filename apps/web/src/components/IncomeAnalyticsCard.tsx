"use client";

import React from "react";
import { TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import { IncomeAnalytics } from "../lib/types";

interface IncomeAnalyticsCardProps {
  analytics: IncomeAnalytics | null;
  isProMode?: boolean;
}

export const IncomeAnalyticsCard: React.FC<IncomeAnalyticsCardProps> = ({ analytics, isProMode = false }) => {
  if (!analytics) {
    return (
      <div className="glass-panel rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-36 bg-[#f3f4f6] rounded mb-4"></div>
        <div className="h-24 bg-[#f3f4f6] rounded"></div>
      </div>
    );
  }

  const diff = analytics.recent_actual_income - analytics.stabilized_income;
  const isAbove = diff >= 0;

  let predictability = "Normal Fluctuations";
  let predBadge = "bg-[#fffbeb] text-[#b45309] border-[#fef3c7]";
  if (analytics.volatility_rating === "Low") {
    predictability = "Steady Pay";
    predBadge = "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]";
  } else if (analytics.volatility_rating === "High" || analytics.volatility_rating === "Extreme") {
    predictability = "Unpredictable Pay";
    predBadge = "bg-[#fff5f3] text-[#b91c1c] border-[#fecdd3]";
  }

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#111827] tracking-wide">
                Average Weekly Pay
              </h3>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${predBadge}`}>
                {predictability}
              </span>
            </div>
            <p className="text-xs text-[#6b7280] mt-1">Your normal weekly pay based on past history</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">Normal Pay</span>
            <div className="text-3xl font-black text-[#111827] tracking-tight font-mono">
              ₹{Math.round(analytics.stabilized_income).toLocaleString("en-IN")}
              <span className="text-xs font-normal text-[#9ca3af] font-sans">/wk</span>
            </div>
          </div>
        </div>

        {/* Comparison to This Week */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-[#fbfbfa] p-3 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block font-medium">This Week's Pay</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-sm font-bold text-[#111827] font-mono">
                ₹{Math.round(analytics.recent_actual_income).toLocaleString("en-IN")}
              </span>
              <span className={`text-[10px] font-bold font-mono ${isAbove ? "text-[#059669]" : "text-[#dc2626]"}`}>
                {isAbove ? `+₹${Math.round(diff).toLocaleString("en-IN")}` : `-₹${Math.round(Math.abs(diff)).toLocaleString("en-IN")}`}
              </span>
            </div>
          </div>

          <div className="bg-[#fbfbfa] p-3 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block font-medium">Week Status</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              {isAbove ? (
                <div className="flex items-center space-x-1 text-[#059669] text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Good Week 🎉</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-[#dc2626] text-xs font-bold">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Slow Week</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isProMode ? (
        <div className="mt-3 pt-2.5 border-t border-[#eae8e3] text-[10px] font-mono text-[#6b7280] flex justify-between">
          <span>0.60×Median + 0.40×Average</span>
          <span>CV: {analytics.coefficient_of_variation.toFixed(2)}</span>
        </div>
      ) : (
        <div className="mt-3 pt-2.5 border-t border-[#eae8e3] text-[11px] text-[#6b7280] flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#ff5b45] shrink-0" />
          <span>Filters out temporary spikes so you don't overspend</span>
        </div>
      )}
    </div>
  );
};
