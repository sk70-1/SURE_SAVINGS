"use client";

import React, { useState } from "react";
import { Sparkles, Shield, ArrowRight, DollarSign, Calendar, CheckCircle2 } from "lucide-react";
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
  const [payFrequency, setPayFrequency] = useState("weekly");
  const [currency, setCurrency] = useState("INR");
  const [essentialExpenses, setEssentialExpenses] = useState<number>(6000);
  const [targetBuffer, setTargetBuffer] = useState<number>(24000);
  const [minimumFloor, setMinimumFloor] = useState<number>(5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (minimumFloor > targetBuffer) {
      setError("The protected buffer floor cannot exceed your total target buffer.");
      return;
    }

    if (essentialExpenses <= 0) {
      setError("Please specify your essential weekly expenses.");
      return;
    }

    setLoading(true);
    try {
      const payload: OnboardingPayload = {
        currency,
        country: "India",
        pay_frequency: payFrequency,
        essential_weekly_expenses: Number(essentialExpenses),
        target_buffer: Number(targetBuffer),
        minimum_buffer_floor: Number(minimumFloor),
        minimum_cash_reserve: 2500,
      };

      await api.completeOnboarding(payload);
      onComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
      <div className="bg-white border border-[#eae8e3] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#ff5b45]/15 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center space-x-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff5b45] to-[#f59e0b] flex items-center justify-center text-white shadow-md shadow-[#ff5b45]/30 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#111827] tracking-tight">
              Welcome to Sure-Savings!
            </h3>
            <p className="text-xs text-[#6b7280]">
              Let's tailor your Smart Money Cushion in under 60 seconds
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#fff1f2] border border-[#fecdd3] text-[#e11d48] text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Income Frequency */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#ff5b45]" />
              <span>How do you get paid?</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "weekly", label: "Weekly Payouts" },
                { id: "biweekly", label: "Bi-Weekly" },
                { id: "monthly", label: "Monthly" },
                { id: "irregular", label: "Irregular / Gigs" },
              ].map((freq) => (
                <button
                  key={freq.id}
                  type="button"
                  onClick={() => setPayFrequency(freq.id)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                    payFrequency === freq.id
                      ? "bg-[#fff5f3] border-[#ff5b45] text-[#ff5b45] shadow-sm font-bold"
                      : "bg-[#fbfbfa] border-[#eae8e3] text-[#4b5563] hover:border-[#d1d5db]"
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Essential Weekly Expenses */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Essential Weekly Expenses ({currencySymbol})
            </label>
            <p className="text-[11px] text-[#6b7280] mb-1.5">
              Approximate cost of food, rent, utility bills, and travel you MUST pay each week.
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#9ca3af]">
                {currencySymbol}
              </span>
              <input
                type="number"
                min={500}
                step={500}
                required
                value={essentialExpenses}
                onChange={(e) => setEssentialExpenses(Number(e.target.value))}
                className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-[#fbfbfa] border border-[#eae8e3] rounded-xl focus:outline-none focus:border-[#ff5b45] font-mono font-bold"
              />
            </div>
          </div>

          {/* Target Buffer & Minimum Floor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                Target Buffer Goal
              </label>
              <p className="text-[10px] text-[#6b7280] mb-1.5">
                Ideal cushion (usually 3–4 weeks of living costs).
              </p>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#9ca3af]">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  value={targetBuffer}
                  onChange={(e) => setTargetBuffer(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-[#fbfbfa] border border-[#eae8e3] rounded-xl focus:outline-none focus:border-[#ff5b45] font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-[#059669]" />
                <span>Protected Floor</span>
              </label>
              <p className="text-[10px] text-[#6b7280] mb-1.5">
                Emergency minimum that can never be drained.
              </p>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#9ca3af]">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  required
                  value={minimumFloor}
                  onChange={(e) => setMinimumFloor(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-[#fbfbfa] border border-[#eae8e3] rounded-xl focus:outline-none focus:border-[#ff5b45] font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl text-xs text-[#065f46] flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#059669] mt-0.5 shrink-0" />
            <p className="leading-snug">
              <strong>Floor Protection Guarantee:</strong> The platform mathematically enforces that your cushion will never drop below {currencySymbol}{Number(minimumFloor).toLocaleString("en-IN")}.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 rounded-xl shadow-lg shadow-[#ff5b45]/25 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Saving Configuration...</span>
            ) : (
              <>
                <span>Save Settings & Launch Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
