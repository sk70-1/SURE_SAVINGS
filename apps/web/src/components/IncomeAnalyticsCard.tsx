"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import { IncomeAnalytics } from "../lib/types";
import { formatCurrency } from "../lib/formatters";

interface IncomeAnalyticsCardProps {
  analytics: IncomeAnalytics | null;
  isProMode?: boolean;
}

export const IncomeAnalyticsCard: React.FC<IncomeAnalyticsCardProps> = ({ analytics, isProMode = false }) => {
  const t = useTranslations("incomeAnalyticsCard");
  const locale = useLocale();

  if (!analytics) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-[#eae8e3] flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-bold text-[#111827]">{t("title")}</h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#f3f4f6] text-[#6b7280]">
              {t("needsHistory")}
            </span>
          </div>
          <p className="text-xs text-[#6b7280]">
            {t("stabilizedDesc")}
          </p>
          <div className="my-6 text-center py-4 bg-[#fbfbfa] rounded-2xl border border-[#eae8e3]">
            <span className="text-3xl font-black text-[#9ca3af] font-mono">₹0 / wk</span>
            <p className="text-xs text-[#6b7280] mt-1">
              {t("needsHistoryDesc")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const diff = analytics.recent_actual_income - analytics.stabilized_income;
  const isAbove = diff >= 0;

  let predictability = t("normalFluctuations");
  let predBadge = "bg-[#fffbeb] text-[#b45309] border-[#fef3c7]";
  if (analytics.volatility_rating === "Low") {
    predictability = t("volatilityLow");
    predBadge = "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]";
  } else if (analytics.volatility_rating === "High" || analytics.volatility_rating === "Extreme") {
    predictability = t("volatilityHigh");
    predBadge = "bg-[#fff5f3] text-[#b91c1c] border-[#fecdd3]";
  }

  const trendLabel =
    analytics.income_trend === "Growing"
      ? t("trendGrowing")
      : analytics.income_trend === "Declining"
      ? t("trendDeclining")
      : t("trendStable");

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#eae8e3] flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#111827]">
                {t("title")}
              </h3>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${predBadge}`}>
                {predictability}
              </span>
            </div>
            <p className="text-xs text-[#6b7280] mt-1">{t("stabilizedDesc")}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">{t("stabilizedIncome")}</span>
            <div className="text-3xl font-black text-[#111827] tracking-tight font-mono">
              {formatCurrency(Math.round(analytics.stabilized_income), "INR", locale)}
              <span className="text-xs font-normal text-[#9ca3af] font-sans">/wk</span>
            </div>
          </div>
        </div>

        {/* Comparison to This Week */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-[#fbfbfa] p-3 rounded-2xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block font-medium">{t("thisWeekPay")}</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-sm font-bold text-[#111827] font-mono">
                {formatCurrency(Math.round(analytics.recent_actual_income), "INR", locale)}
              </span>
              <span className={`text-[10px] font-bold ${isAbove ? "text-[#059669]" : "text-[#ea580c]"}`}>
                {isAbove ? `+${formatCurrency(Math.round(diff), "INR", locale)}` : `-${formatCurrency(Math.round(Math.abs(diff)), "INR", locale)}`}
              </span>
            </div>
          </div>

          <div className="bg-[#fbfbfa] p-3 rounded-2xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block font-medium">{t("earningsTrend")}</span>
            <div className="flex items-center space-x-1.5 mt-1">
              {analytics.income_trend === "Growing" && <TrendingUp className="w-4 h-4 text-[#059669]" />}
              {analytics.income_trend === "Declining" && <TrendingDown className="w-4 h-4 text-[#e11d48]" />}
              {analytics.income_trend === "Stable" && <CheckCircle2 className="w-4 h-4 text-[#0284c7]" />}
              <span className="text-xs font-bold text-[#111827]">{trendLabel}</span>
            </div>
          </div>
        </div>

        {/* Explainability in human terms */}
        <div className="mt-3 p-3 bg-[#fbfbfa] rounded-2xl border border-[#eae8e3] text-xs text-[#4b5563]">
          <p className="leading-relaxed">
            {analytics.formula_explanation || t("formulaFallback")}
          </p>
        </div>
      </div>
    </div>
  );
};
