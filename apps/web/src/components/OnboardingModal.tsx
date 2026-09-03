"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { api } from "../lib/api";
import { OnboardingPayload } from "../lib/types";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  currencySymbol?: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  currencySymbol = "₹",
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [payFrequency, setPayFrequency] = useState("weekly");
  const [essentialExpenses, setEssentialExpenses] = useState<number>(5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-calculated recommendations based on weekly essentials
  const recommendedTarget = essentialExpenses * 4; // 4 weeks of essentials
  const recommendedFloor = essentialExpenses * 1; // 1 week minimum floor

  const handleFinish = async () => {
    setError(null);
    setLoading(true);
    try {
      const payload: OnboardingPayload = {
        currency: "INR",
        country: "India",
        pay_frequency: payFrequency,
        essential_weekly_expenses: Number(essentialExpenses),
        target_buffer: Number(recommendedTarget),
        minimum_buffer_floor: Number(recommendedFloor),
        minimum_cash_reserve: 2500,
      };

      await api.completeOnboarding(payload);
      onComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save configuration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border border-[#eae8e3] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#ff5b45]/15 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header & Progress Indicator */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#f3f4f6]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff5b45] to-[#f59e0b] flex items-center justify-center text-white shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#111827] tracking-tight">
                Set Up Your Money Plan
              </h3>
              <p className="text-xs text-[#6b7280]">Step {step} of 3</p>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center space-x-1.5">
            <span className={`w-2.5 h-2.5 rounded-full transition-colors ${step >= 1 ? "bg-[#ff5b45]" : "bg-[#e5e7eb]"}`} />
            <span className={`w-2.5 h-2.5 rounded-full transition-colors ${step >= 2 ? "bg-[#ff5b45]" : "bg-[#e5e7eb]"}`} />
            <span className={`w-2.5 h-2.5 rounded-full transition-colors ${step === 3 ? "bg-[#ff5b45]" : "bg-[#e5e7eb]"}`} />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-[#fff1f2] border border-[#fecdd3] text-[#e11d48] text-xs font-medium">
            {error}
          </div>
        )}

        {/* STEP 1: How often do you get paid? */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h4 className="text-lg font-black text-[#111827] mb-1">
                How often do you get paid?
              </h4>
              <p className="text-xs text-[#6b7280]">
                We use this to pace your savings without making cash feel tight.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {[
                { id: "weekly", title: "Weekly payouts", desc: "Zomato, Swiggy, Blinkit, Zepto, Uber" },
                { id: "daily", title: "Daily or per gig", desc: "Paid right after each completed trip or task" },
                { id: "irregular", title: "Irregular / Client milestones", desc: "Freelance projects, design, coding, writing" },
                { id: "monthly", title: "Monthly invoices", desc: "Fixed monthly retainer or client contract" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPayFrequency(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                    payFrequency === opt.id
                      ? "border-[#ff5b45] bg-[#fff5f3] ring-1 ring-[#ff5b45]/30 shadow-xs"
                      : "border-[#eae8e3] bg-[#fbfbfa] hover:border-[#ffdad4]"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-[#111827]">{opt.title}</div>
                    <div className="text-[11px] text-[#6b7280] mt-0.5">{opt.desc}</div>
                  </div>
                  {payFrequency === opt.id && (
                    <CheckCircle2 className="w-4 h-4 text-[#ff5b45] shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#ff5b45]/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: About how much do you need each week for essentials? */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h4 className="text-lg font-black text-[#111827] mb-1">
                About how much do you need each week for essentials?
              </h4>
              <p className="text-xs text-[#6b7280]">
                A rough estimate is fine. Include groceries, rent share, petrol, and utility bills.
              </p>
            </div>

            <div className="pt-2">
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-lg font-bold text-[#9ca3af]">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={essentialExpenses || ""}
                  onChange={(e) => setEssentialExpenses(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#fbfbfa] border border-[#eae8e3] rounded-2xl pl-10 pr-4 py-3 text-lg font-black font-mono text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ff5b45] focus:border-transparent"
                  placeholder="5000"
                />
              </div>

              {/* Quick suggestion pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[3000, 5000, 7500, 10000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setEssentialExpenses(val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      essentialExpenses === val
                        ? "bg-[#ff5b45] text-white border-[#ff5b45]"
                        : "bg-[#fbfbfa] text-[#4b5563] border-[#eae8e3] hover:bg-[#f3f4f6]"
                    }`}
                  >
                    {currencySymbol}{val.toLocaleString("en-IN")}/wk
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3.5 px-4 rounded-2xl border border-[#eae8e3] text-xs font-bold text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] flex items-center space-x-1 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={essentialExpenses <= 0}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#ff5b45]/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>Calculate My Recommended Goal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Recommended Emergency-Savings Goal */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h4 className="text-lg font-black text-[#111827] mb-1">
                Your Recommended Savings Plan
              </h4>
              <p className="text-xs text-[#6b7280]">
                We calculated this automatically based on your {currencySymbol}{essentialExpenses.toLocaleString("en-IN")}/week living costs.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {/* Emergency Goal Box */}
              <div className="bg-[#fff5f3] border border-[#ffdad4] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-[#ff5b45]" />
                    <span className="text-xs font-bold text-[#111827]">
                      Recommended Savings Goal
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white text-[#ff5b45] border border-[#ffdad4]">
                    4 Weeks Cushion
                  </span>
                </div>
                <div className="text-2xl font-black text-[#ff5b45] font-mono mt-1">
                  {currencySymbol}{recommendedTarget.toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-[#6b7280] mt-1">
                  Protects you for an entire month if freelance gigs or platform orders dry up.
                </p>
              </div>

              {/* Minimum Safe Floor Box */}
              <div className="bg-[#fbfbfa] border border-[#eae8e3] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-[#f59e0b]" />
                    <span className="text-xs font-bold text-[#111827]">
                      Minimum Safe Savings
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6b7280]">1 week minimum</span>
                </div>
                <div className="text-lg font-black text-[#111827] font-mono mt-1">
                  {currencySymbol}{recommendedFloor.toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-[#6b7280] mt-1">
                  Your untouchable emergency floor for food and shelter.
                </p>
              </div>

              {/* Friendly Safety Disclaimer */}
              <div className="p-3 bg-[#ecfdf5] rounded-2xl border border-[#a7f3d0] text-xs text-[#065f46] space-y-1">
                <p className="font-bold">🛡️ Non-Custodial Simulation</p>
                <p className="text-[11px] text-[#047857]">
                  Sure-Savings is your friendly money guide. We never move real money out of your bank account automatically. You can tweak your goals anytime under settings.
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3.5 px-4 rounded-2xl border border-[#eae8e3] text-xs font-bold text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] flex items-center space-x-1 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#ff5b45]/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? "Saving Plan..." : "Looks Great, Finish Setup"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
