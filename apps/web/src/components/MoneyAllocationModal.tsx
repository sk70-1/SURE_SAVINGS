"use client";

import React, { useState, useEffect } from "react";
import {
  X, ShieldCheck, AlertTriangle, XCircle, Check,
  Sparkles, RefreshCw, Lock, ArrowRight, HelpCircle
} from "lucide-react";
import { AllocationPlan, AllocationSimulationResult } from "../lib/types";
import { api } from "../lib/api";

interface MoneyAllocationModalProps {
  isOpen: boolean;
  plan: AllocationPlan | null;
  onClose: () => void;
  onApproved: () => Promise<void>;
  showToast: (msg: string) => void;
}

export const MoneyAllocationModal: React.FC<MoneyAllocationModalProps> = ({
  isOpen,
  plan,
  onClose,
  onApproved,
  showToast,
}) => {
  const [breakdown, setBreakdown] = useState<Record<string, number>>({
    essentials: 0,
    protected_buffer: 0,
    upcoming_obligations: 0,
    recovery: 0,
    goals: 0,
    flexible_spending: 0,
  });

  const [simResult, setSimResult] = useState<AllocationSimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const runSimulation = async (values: Record<string, number>, incomeAmt: number) => {
    setSimulating(true);
    try {
      const res = await api.simulateAllocation(incomeAmt, values);
      setSimResult(res);
    } catch (err: any) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  // Initialize values from plan
  useEffect(() => {
    if (plan) {
      const initial = {
        essentials: plan.breakdown.essentials,
        protected_buffer: plan.breakdown.protected_buffer,
        upcoming_obligations: plan.breakdown.upcoming_obligations,
        recovery: plan.breakdown.recovery,
        goals: plan.breakdown.goals,
        flexible_spending: plan.breakdown.flexible_spending,
      };
      setBreakdown(initial);
      runSimulation(initial, plan.income_amount);
    }
  }, [plan]);

  if (!isOpen || !plan) return null;

  const income = plan.income_amount;
  const currentTotal = Object.values(breakdown).reduce((a, b) => a + b, 0);

  function round(n: number) {
    return Math.round(n * 100) / 100;
  }

  const diff = round(income - currentTotal);

  const handleSliderChange = (category: string, value: number) => {
    const updated = { ...breakdown, [category]: Math.max(0, value) };
    setBreakdown(updated);
    runSimulation(updated, income);
  };

  const resetToRecommended = () => {
    const rec = {
      essentials: plan.breakdown.essentials,
      protected_buffer: plan.breakdown.protected_buffer,
      upcoming_obligations: plan.breakdown.upcoming_obligations,
      recovery: plan.breakdown.recovery,
      goals: plan.breakdown.goals,
      flexible_spending: plan.breakdown.flexible_spending,
    };
    setBreakdown(rec);
    runSimulation(rec, income);
    setShowConfirm(false);
  };

  const handleApprove = async () => {
    if (simResult && !simResult.is_safe) {
      showToast("Cannot approve unsafe allocation. Please fix safety warnings.");
      return;
    }

    setApproving(true);
    try {
      await api.approveAllocation(plan.id, breakdown);
      showToast("✅ Autopilot Allocation successfully approved & simulated!");
      await onApproved();
      onClose();
    } catch (err: any) {
      showToast(`Error: ${err.message || "Failed to approve allocation"}`);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-7 border border-[#eae8e3] shadow-2xl relative my-8 max-h-[92vh] flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#eae8e3]">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff5b45] to-[#f59e0b] flex items-center justify-center text-white shadow-md shadow-[#ff5b45]/25">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-[#111827]">
                Money Allocation Autopilot
              </h3>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#fff5f3] text-[#ff5b45] border border-[#ffdad4] uppercase tracking-wider">
                What-If Simulator
              </span>
            </div>
            <p className="text-xs text-[#6b7280] mt-1">
              Customize how ₹{Math.round(income).toLocaleString("en-IN")} is split. Changes are simulated in real-time.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#9ca3af] hover:text-[#111827] bg-[#f9fafb] hover:bg-[#f3f4f6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Center Content */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">

          {/* Real-time Safety / Risk Banner */}
          {simResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start space-x-2.5 ${
                !simResult.is_safe
                  ? "bg-[#fff1f2] border-[#fecdd3] text-[#be123c]"
                  : simResult.risk_level === "CAUTION"
                  ? "bg-[#fffbeb] border-[#fef3c7] text-[#92400e]"
                  : "bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]"
              }`}
            >
              {!simResult.is_safe ? (
                <XCircle className="w-4 h-4 shrink-0 text-[#e11d48] mt-0.5" />
              ) : simResult.risk_level === "CAUTION" ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#d97706] mt-0.5" />
              ) : (
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#059669] mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between font-bold">
                  <span>
                    {!simResult.is_safe
                      ? "Unsafe Allocation Configuration"
                      : simResult.risk_level === "CAUTION"
                      ? "Caution: Sub-optimal Financial Strategy"
                      : "Verified Safe Allocation"}
                  </span>
                  <span className="font-mono text-[11px] uppercase">
                    Status: {simResult.risk_level}
                  </span>
                </div>
                {simResult.warnings.length > 0 ? (
                  <ul className="mt-1 space-y-0.5 text-[11px] list-disc list-inside">
                    {simResult.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] mt-0.5">
                    Maintains emergency buffer floor, covers essential living costs, and enhances resilience score.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Allocation Sliders & Inputs */}
          <div className="space-y-3.5 bg-[#fbfbfa] p-4 rounded-2xl border border-[#eae8e3]">
            <div className="flex justify-between items-center text-xs font-bold text-[#111827] pb-2 border-b border-[#eae8e3]">
              <span>Category</span>
              <span>Allocated Amount (₹ INR)</span>
            </div>

            {/* Category: Essentials */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-[#111827] flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>
                  <span>1. Essentials (Rent & Groceries)</span>
                </span>
                <span className="font-mono font-bold text-[#111827]">
                  ₹{Math.round(breakdown.essentials).toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={income}
                step="100"
                value={breakdown.essentials}
                onChange={(e) => handleSliderChange("essentials", parseFloat(e.target.value))}
                className="w-full accent-[#3b82f6] cursor-pointer"
              />
            </div>

            {/* Category: Protected Buffer */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-[#111827] flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                  <span>2. Protected Emergency Buffer</span>
                </span>
                <span className="font-mono font-bold text-[#d97706]">
                  ₹{Math.round(breakdown.protected_buffer).toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={income}
                step="100"
                value={breakdown.protected_buffer}
                onChange={(e) => handleSliderChange("protected_buffer", parseFloat(e.target.value))}
                className="w-full accent-[#f59e0b] cursor-pointer"
              />
            </div>

            {/* Category: Upcoming Obligations */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-[#111827] flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></span>
                  <span>3. Upcoming Scheduled Obligations</span>
                </span>
                <span className="font-mono font-bold text-[#111827]">
                  ₹{Math.round(breakdown.upcoming_obligations).toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={income}
                step="100"
                value={breakdown.upcoming_obligations}
                onChange={(e) => handleSliderChange("upcoming_obligations", parseFloat(e.target.value))}
                className="w-full accent-[#8b5cf6] cursor-pointer"
              />
            </div>

            {/* Category: Recovery */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-[#111827] flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
                  <span>4. Recovery (Restore Past Drawdowns)</span>
                </span>
                <span className="font-mono font-bold text-[#111827]">
                  ₹{Math.round(breakdown.recovery).toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={income}
                step="100"
                value={breakdown.recovery}
                onChange={(e) => handleSliderChange("recovery", parseFloat(e.target.value))}
                className="w-full accent-[#059669] cursor-pointer"
              />
            </div>

            {/* Category: Goals */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-[#111827] flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                  <span>5. Financial Goals</span>
                </span>
                <span className="font-mono font-bold text-[#059669]">
                  ₹{Math.round(breakdown.goals).toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={income}
                step="100"
                value={breakdown.goals}
                onChange={(e) => handleSliderChange("goals", parseFloat(e.target.value))}
                className="w-full accent-[#10b981] cursor-pointer"
              />
            </div>

            {/* Category: Flexible Spending */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-[#111827] flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff7461]"></span>
                  <span>6. Flexible Spending (Discretionary)</span>
                </span>
                <span className="font-mono font-bold text-[#111827]">
                  ₹{Math.round(breakdown.flexible_spending).toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={income}
                step="100"
                value={breakdown.flexible_spending}
                onChange={(e) => handleSliderChange("flexible_spending", parseFloat(e.target.value))}
                className="w-full accent-[#ff7461] cursor-pointer"
              />
            </div>

            {/* Total Balance Check */}
            <div className="pt-2 border-t border-[#eae8e3] flex justify-between items-center text-xs">
              <span className="font-semibold text-[#4b5563]">Total Assigned:</span>
              <div className="flex items-baseline space-x-2">
                <span className="font-black text-sm font-mono text-[#111827]">
                  ₹{Math.round(currentTotal).toLocaleString("en-IN")} / ₹{Math.round(income).toLocaleString("en-IN")}
                </span>
                {diff !== 0 && (
                  <span className={`text-[11px] font-bold font-mono ${diff < 0 ? "text-[#e11d48]" : "text-[#059669]"}`}>
                    ({diff < 0 ? `Exceeds by ₹${Math.abs(diff)}` : `₹${diff} unassigned`})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Projected Financial State */}
          {simResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
                <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block">Projected Buffer</span>
                <span className="text-xs font-bold text-[#111827] font-mono">
                  ₹{Math.round(simResult.projected_buffer).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
                <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block">Buffer Runway</span>
                <span className="text-xs font-bold text-[#d97706] font-mono">
                  {simResult.buffer_coverage_weeks.toFixed(1)} Weeks
                </span>
              </div>

              <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
                <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block">Resilience Score</span>
                <span className="text-xs font-bold text-[#059669] font-mono">
                  {Math.round(simResult.current_resilience)} → {Math.round(simResult.projected_resilience)}
                </span>
              </div>

              <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
                <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block">Goal Funding</span>
                <span className="text-xs font-bold text-[#111827] font-mono">
                  {simResult.projected_goal_percentage.toFixed(0)}% Funded
                </span>
              </div>
            </div>
          )}

          {/* Why Did Autopilot Recommend This? Accordion */}
          <div className="bg-[#fbfbfa] p-3.5 rounded-2xl border border-[#eae8e3]">
            <span className="text-xs font-bold text-[#111827] block mb-2">
              Why this allocation was created:
            </span>
            <ul className="space-y-1.5 text-xs text-[#4b5563] leading-relaxed">
              <li>• <strong>Essentials</strong>: {plan.reasoning.essentials}</li>
              <li>• <strong>Buffer</strong>: {plan.reasoning.protected_buffer}</li>
              {plan.reasoning.upcoming_obligations && (
                <li>• <strong>Obligations</strong>: {plan.reasoning.upcoming_obligations}</li>
              )}
              {plan.reasoning.goals && (
                <li>• <strong>Goals</strong>: {plan.reasoning.goals}</li>
              )}
              <li>• <strong>Flexible</strong>: {plan.reasoning.flexible_spending}</li>
            </ul>
          </div>

          {/* Confirmation Prompt if Triggered */}
          {showConfirm && (
            <div className="p-4 rounded-2xl bg-[#fff5f3] border border-[#ffdad4] animate-fade-in text-xs space-y-2">
              <div className="font-bold text-[#111827] flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#ff5b45]" />
                <span>Confirm Simulated Allocation</span>
              </div>
              <p className="text-[#4b5563]">
                You are about to simulate allocating <strong>₹{Math.round(currentTotal).toLocaleString("en-IN")}</strong>.
                This will update your Emergency Buffer balance, adjust goal savings, and record an immutable audit log.
              </p>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#6b7280] hover:text-[#111827] bg-white rounded-lg border border-[#eae8e3]"
                >
                  Edit Further
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] rounded-lg shadow-md shadow-[#ff5b45]/30 active:scale-95"
                >
                  {approving ? "Simulating..." : "Confirm & Execute Simulation"}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#eae8e3] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-[11px] text-[#6b7280] font-mono">
            <Lock className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Zero real money movement • Recommendation-first</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={resetToRecommended}
              className="px-3 py-2 text-xs font-semibold text-[#6b7280] hover:text-[#111827] bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-xl transition-all flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {!showConfirm && (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={simResult !== null && !simResult.is_safe}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center space-x-1.5 ${
                  simResult !== null && !simResult.is_safe
                    ? "bg-gray-300 opacity-50 cursor-not-allowed text-gray-500"
                    : "bg-gradient-to-r from-[#ff5b45] to-[#f05138] shadow-[#ff5b45]/30 active:scale-95 hover:opacity-95"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve Allocation</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
