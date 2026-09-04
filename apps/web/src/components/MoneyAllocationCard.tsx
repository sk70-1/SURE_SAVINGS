"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { AllocationPlan } from "../lib/types";
import { formatCurrency } from "../lib/formatters";

interface MoneyAllocationCardProps {
  plan: AllocationPlan | null;
  onOpenReview: () => void;
  loading?: boolean;
  isActive: boolean;
  onToggleActive?: (active: boolean) => void;
}

export const MoneyAllocationCard: React.FC<MoneyAllocationCardProps> = ({
  plan,
  onOpenReview,
  loading = false,
  isActive,
  onToggleActive,
}) => {
  const t = useTranslations("automaticMoneyPlan");
  const locale = useLocale();
  const [showFullBreakdown, setShowFullBreakdown] = useState(false);

  // If no plan is passed, use standard safe values or zero state
  const income = plan ? Math.round(plan.income_amount) : 20000;
  const essentials = plan ? Math.round(plan.breakdown.essentials) : 9000;
  const emergencySavings = plan ? Math.round(plan.breakdown.protected_buffer) : 4000;
  // Spending money: flexible spending + goals (or remainder after essentials and savings)
  const spendingMoney = plan
    ? Math.round(Math.max(0, income - essentials - emergencySavings))
    : 7000;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eae8e3] shadow-sm relative overflow-hidden transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#f3f4f6]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-[#111827] tracking-tight">
                {t("title")}
              </h3>
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                {t("badge")}
              </span>
            </div>
            <p className="text-xs text-[#6b7280] mt-0.5">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Edit Plan Button */}
        <button
          onClick={onOpenReview}
          className="px-4 py-2 text-xs font-bold text-[#ff5b45] bg-[#fff5f3] hover:bg-[#ffe8e4] border border-[#ffdad4] rounded-xl flex items-center justify-center space-x-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{t("editPlan")}</span>
        </button>
      </div>

      {/* Simplified 3-Tier Split (Default View) */}
      <div className="py-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-3">
          {t("fromPayout", { amount: formatCurrency(income, "INR", locale) })}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 1. Essentials */}
          <div className="bg-[#fbfbfa] rounded-2xl p-4 border border-[#eae8e3]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#374151]">{t("essentials")}</span>
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
            </div>
            <div className="text-xl font-black text-[#111827] font-mono">
              {formatCurrency(essentials, "INR", locale)}
            </div>
            <p className="text-[11px] text-[#6b7280] mt-1">
              {t("essentialsDesc")}
            </p>
          </div>

          {/* 2. Emergency Savings */}
          <div className="bg-[#fffdfb] rounded-2xl p-4 border border-[#fed7aa]/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#9a3412]">{t("emergencySavings")}</span>
              <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
            </div>
            <div className="text-xl font-black text-[#ea580c] font-mono">
              {formatCurrency(emergencySavings, "INR", locale)}
            </div>
            <p className="text-[11px] text-[#6b7280] mt-1">
              {emergencySavings === 0
                ? t("emergencySavingsZeroDesc", { amount: formatCurrency(income, "INR", locale) })
                : t("emergencySavingsDesc")}
            </p>
          </div>

          {/* 3. Spending Money */}
          <div className="bg-[#fbfbfa] rounded-2xl p-4 border border-[#eae8e3]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#374151]">{t("spendingMoney")}</span>
              <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            </div>
            <div className="text-xl font-black text-[#059669] font-mono">
              {formatCurrency(spendingMoney, "INR", locale)}
            </div>
            <p className="text-[11px] text-[#6b7280] mt-1">
              {spendingMoney === 0 ? t("spendingMoneyZeroDesc") : t("spendingMoneyDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Reassurance Disclaimer Banner */}
      <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-2xl p-3.5 flex items-start space-x-2.5 text-xs text-[#92400e]">
        <Info className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>{t("disclaimerTitle")}</strong> {t("disclaimerText")}
        </p>
      </div>

      {/* Progressive Disclosure: "See full breakdown" for advanced users */}
      <div className="mt-4 pt-3 border-t border-[#f3f4f6]">
        <button
          onClick={() => setShowFullBreakdown(!showFullBreakdown)}
          className="text-xs font-bold text-[#6b7280] hover:text-[#111827] flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <span>{showFullBreakdown ? t("hideFullBreakdown") : t("seeFullBreakdown")}</span>
          {showFullBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showFullBreakdown && plan && (
          <div className="mt-4 pt-3 border-t border-[#f3f4f6] space-y-3 animate-fadeIn">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
              {t("detailedBreakdown")}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-[#fbfbfa] p-3 rounded-xl border border-[#eae8e3]">
                <span className="text-[#6b7280] block text-[11px]">{t("livingEssentials")}</span>
                <span className="font-bold text-[#111827] font-mono">{formatCurrency(Math.round(plan.breakdown.essentials), "INR", locale)}</span>
              </div>
              <div className="bg-[#fbfbfa] p-3 rounded-xl border border-[#eae8e3]">
                <span className="text-[#6b7280] block text-[11px]">{t("protectedCushion")}</span>
                <span className="font-bold text-[#ea580c] font-mono">{formatCurrency(Math.round(plan.breakdown.protected_buffer), "INR", locale)}</span>
              </div>
              <div className="bg-[#fbfbfa] p-3 rounded-xl border border-[#eae8e3]">
                <span className="text-[#6b7280] block text-[11px]">{t("upcomingBills")}</span>
                <span className="font-bold text-[#7c3aed] font-mono">{formatCurrency(Math.round(plan.breakdown.upcoming_obligations || 0), "INR", locale)}</span>
              </div>
              <div className="bg-[#fbfbfa] p-3 rounded-xl border border-[#eae8e3]">
                <span className="text-[#6b7280] block text-[11px]">{t("flexibleSpending")}</span>
                <span className="font-bold text-[#059669] font-mono">{formatCurrency(Math.round(plan.breakdown.flexible_spending), "INR", locale)}</span>
              </div>
              <div className="bg-[#fbfbfa] p-3 rounded-xl border border-[#eae8e3]">
                <span className="text-[#6b7280] block text-[11px]">{t("savingsGoals")}</span>
                <span className="font-bold text-[#0284c7] font-mono">{formatCurrency(Math.round(plan.breakdown.goals || 0), "INR", locale)}</span>
              </div>
              <div className="bg-[#fbfbfa] p-3 rounded-xl border border-[#eae8e3]">
                <span className="text-[#6b7280] block text-[11px]">{t("moneySafety")}</span>
                <span className="font-bold text-[#059669] font-mono">
                  {plan.resilience_before} → {plan.resilience_after}/100
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
