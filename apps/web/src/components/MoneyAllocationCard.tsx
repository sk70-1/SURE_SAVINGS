"use client";

import React from "react";
import {
  Sliders, ShieldCheck, AlertTriangle, XCircle, ArrowRight,
  Sparkles, TrendingUp, PowerOff
} from "lucide-react";
import { AllocationPlan } from "../lib/types";

interface MoneyAllocationCardProps {
  plan: AllocationPlan | null;
  onOpenReview: () => void;
  loading?: boolean;
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
}

export const MoneyAllocationCard: React.FC<MoneyAllocationCardProps> = ({
  plan,
  onOpenReview,
  loading = false,
  isActive,
  onToggleActive,
}) => {
  const defaultPlan: AllocationPlan = {
    id: 1,
    user_id: 1,
    income_amount: 20000,
    breakdown: {
      essentials: 9000,
      protected_buffer: 4000,
      upcoming_obligations: 3000,
      flexible_spending: 2000,
      goals: 2000,
      recovery: 0,
      total: 20000,
    },
    reasoning: {
      essentials: "Covers baseline weekly living expenses.",
      protected_buffer: "Gradually fills your protected emergency cushion.",
      upcoming_obligations: "Reserves for upcoming bills and rent.",
      flexible_spending: "Discretionary spending money.",
      goals: "Contributes to your priority financial milestones.",
    },
    risk_level: "SAFE",
    resilience_before: 70,
    resilience_after: 76,
    status: "PENDING",
    created_at: new Date().toISOString(),
  };
  const activePlan = plan || defaultPlan;

  const b = activePlan.breakdown;
  const income = activePlan.income_amount;

  // Category percentages
  const pct = (val: number) => (income > 0 ? Math.round((val / income) * 100) : 0);

  // Risk badge
  let riskBadge = (
    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] flex items-center space-x-1">
      <ShieldCheck className="w-3.5 h-3.5" />
      <span>Safe Plan</span>
    </span>
  );

  if (activePlan.risk_level === "CAUTION") {
    riskBadge = (
      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#fffbeb] text-[#d97706] border border-[#fef3c7] flex items-center space-x-1">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Caution</span>
      </span>
    );
  } else if (activePlan.risk_level === "UNSAFE") {
    riskBadge = (
      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3] flex items-center space-x-1">
        <XCircle className="w-3.5 h-3.5" />
        <span>Unsafe</span>
      </span>
    );
  }

  const resilienceDiff = Math.round(activePlan.resilience_after - activePlan.resilience_before);

  return (
    <div
      className={`glass-panel rounded-2xl p-6 border-2 transition-all relative overflow-hidden shadow-sm ${
        isActive
          ? "border-[#ff5b45]/25 hover:border-[#ff5b45]/40"
          : "border-[#e5e7eb] bg-[#fafafa]/80 opacity-95"
      }`}
    >
      {/* Card Header with Feature Toggle Button */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isActive ? "pb-4 border-b border-[#eae8e3]" : ""}`}>
        <div className="flex items-center space-x-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              isActive
                ? "bg-gradient-to-tr from-[#ff5b45] to-[#f59e0b] text-white shadow-md shadow-[#ff5b45]/25"
                : "bg-[#e5e7eb] text-[#6b7280]"
            }`}
          >
            {isActive ? <Sparkles className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#111827] tracking-tight">
                Money Allocation Autopilot
              </h3>
              {isActive ? (
                riskBadge
              ) : (
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-[#f3f4f6] text-[#6b7280] border border-[#d1d5db]">
                  Paused
                </span>
              )}
            </div>
            <p className="text-xs text-[#6b7280] mt-0.5">
              {isActive
                ? "Intelligent recommendation for incoming pay — safe, prioritized, and floor-guarded"
                : "Feature is currently turned off. Toggle the button to activate intelligent recommendations."}
            </p>
          </div>
        </div>

        {/* Tactile Toggle Switch Button */}
        <div className="flex items-center space-x-3 self-start sm:self-auto bg-white/90 px-3.5 py-2 rounded-2xl border border-[#eae8e3] shadow-sm">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-[#111827]">
              {isActive ? "Autopilot Active" : "Autopilot Off"}
            </span>
            <span className="text-[10px] text-[#6b7280]">
              {isActive ? "Click to deactivate" : "Click to activate"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onToggleActive(!isActive)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isActive ? "bg-[#ff5b45]" : "bg-[#d1d5db]"
            }`}
            role="switch"
            aria-checked={isActive}
            title={isActive ? "Deactivate Money Allocation Autopilot" : "Activate Money Allocation Autopilot"}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* When Feature is Active: Full Rich Breakdown & Simulator Access */}
      {isActive && (
        <>
          <div className="my-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#6b7280] mb-2 font-medium gap-1">
              <span>Recommended Split for Incoming Pay</span>
              <div className="flex items-center space-x-2">
                <span className="text-[#9ca3af]">Analyzed Payout:</span>
                <span className="text-base font-black text-[#111827] font-mono">
                  ₹{Math.round(income).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Proportional Segmented Progress Bar */}
            <div className="w-full h-4 bg-[#f3f4f6] rounded-full overflow-hidden flex border border-[#eae8e3]">
              {b.essentials > 0 && (
                <div
                  style={{ width: `${pct(b.essentials)}%` }}
                  className="bg-[#3b82f6] h-full transition-all"
                  title={`Essentials: ₹${b.essentials} (${pct(b.essentials)}%)`}
                ></div>
              )}
              {b.protected_buffer > 0 && (
                <div
                  style={{ width: `${pct(b.protected_buffer)}%` }}
                  className="bg-[#f59e0b] h-full transition-all"
                  title={`Protected Buffer: ₹${b.protected_buffer} (${pct(b.protected_buffer)}%)`}
                ></div>
              )}
              {b.upcoming_obligations > 0 && (
                <div
                  style={{ width: `${pct(b.upcoming_obligations)}%` }}
                  className="bg-[#8b5cf6] h-full transition-all"
                  title={`Obligations: ₹${b.upcoming_obligations} (${pct(b.upcoming_obligations)}%)`}
                ></div>
              )}
              {b.recovery > 0 && (
                <div
                  style={{ width: `${pct(b.recovery)}%` }}
                  className="bg-[#059669] h-full transition-all"
                  title={`Recovery: ₹${b.recovery} (${pct(b.recovery)}%)`}
                ></div>
              )}
              {b.goals > 0 && (
                <div
                  style={{ width: `${pct(b.goals)}%` }}
                  className="bg-[#10b981] h-full transition-all"
                  title={`Goals: ₹${b.goals} (${pct(b.goals)}%)`}
                ></div>
              )}
              {b.flexible_spending > 0 && (
                <div
                  style={{ width: `${pct(b.flexible_spending)}%` }}
                  className="bg-[#ff7461] h-full transition-all"
                  title={`Flexible Spending: ₹${b.flexible_spending} (${pct(b.flexible_spending)}%)`}
                ></div>
              )}
            </div>

            {/* 6 Category Summary Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4">
              <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
                  <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Essentials</span>
                </div>
                <div className="text-xs font-bold text-[#111827] font-mono">
                  ₹{Math.round(b.essentials).toLocaleString("en-IN")}
                </div>
                <span className="text-[10px] text-[#9ca3af]">{pct(b.essentials)}%</span>
              </div>

              <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
                  <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Buffer</span>
                </div>
                <div className="text-xs font-bold text-[#d97706] font-mono">
                  ₹{Math.round(b.protected_buffer).toLocaleString("en-IN")}
                </div>
                <span className="text-[10px] text-[#9ca3af]">{pct(b.protected_buffer)}%</span>
              </div>

              <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#8b5cf6]"></span>
                  <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Obligations</span>
                </div>
                <div className="text-xs font-bold text-[#111827] font-mono">
                  ₹{Math.round(b.upcoming_obligations).toLocaleString("en-IN")}
                </div>
                <span className="text-[10px] text-[#9ca3af]">{pct(b.upcoming_obligations)}%</span>
              </div>

              <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
                  <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Recovery</span>
                </div>
                <div className="text-xs font-bold text-[#111827] font-mono">
                  ₹{Math.round(b.recovery).toLocaleString("en-IN")}
                </div>
                <span className="text-[10px] text-[#9ca3af]">{pct(b.recovery)}%</span>
              </div>

              <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Goals</span>
                </div>
                <div className="text-xs font-bold text-[#059669] font-mono">
                  ₹{Math.round(b.goals).toLocaleString("en-IN")}
                </div>
                <span className="text-[10px] text-[#9ca3af]">{pct(b.goals)}%</span>
              </div>

              <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#ff7461]"></span>
                  <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Flexible</span>
                </div>
                <div className="text-xs font-bold text-[#111827] font-mono">
                  ₹{Math.round(b.flexible_spending).toLocaleString("en-IN")}
                </div>
                <span className="text-[10px] text-[#9ca3af]">{pct(b.flexible_spending)}%</span>
              </div>
            </div>
          </div>

          {/* Footer Bar: Resilience impact + Review CTA */}
          <div className="pt-4 border-t border-[#eae8e3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5 text-[#4b5563]">
                <TrendingUp className="w-4 h-4 text-[#059669]" />
                <span>Projected Resilience:</span>
                <strong className="text-[#111827] font-mono font-bold">
                  {Math.round(activePlan.resilience_before)} → {Math.round(activePlan.resilience_after)}
                </strong>
                {resilienceDiff > 0 && (
                  <span className="text-[#059669] font-bold font-mono text-[11px]">(+{resilienceDiff} pts)</span>
                )}
              </div>
            </div>

            <button
              onClick={onOpenReview}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-[#ff5b45]/25 active:scale-95 transition-all"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Review & Customize Allocation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
