"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, HeartHandshake, HelpCircle } from "lucide-react";
import { ResilienceScore } from "../lib/types";

interface ResilienceGaugeProps {
  resilience: ResilienceScore | null;
  isProMode?: boolean;
}

export const ResilienceGauge: React.FC<ResilienceGaugeProps> = ({ resilience, isProMode = false }) => {
  const t = useTranslations("resilienceGauge");

  // If no score exists yet
  if (!resilience) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-[#eae8e3] flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-bold text-[#111827]">{t("title")}</h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#f3f4f6] text-[#6b7280]">
              {t("newAccount")}
            </span>
          </div>
          <p className="text-xs text-[#6b7280]">
            {t("subtitle")}
          </p>
          <div className="my-6 text-center py-4 bg-[#fbfbfa] rounded-2xl border border-[#eae8e3]">
            <span className="text-3xl font-black text-[#9ca3af] font-mono">— / 100</span>
            <p className="text-xs text-[#6b7280] mt-1">
              {t("newAccountDesc")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const score = Math.round(resilience.overall_score);

  // Friendly human rating
  let ratingText = t("scoreGood");
  let scoreColor = "text-[#059669]";
  let bgBadge = "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]";
  let friendlyAdvice = t("adviceGood");

  if (score < 40) {
    ratingText = t("scoreAtRisk");
    scoreColor = "text-[#e11d48]";
    bgBadge = "bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]";
    friendlyAdvice = t("adviceAtRisk");
  } else if (score < 60) {
    ratingText = t("scoreFair");
    scoreColor = "text-[#d97706]";
    bgBadge = "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]";
    friendlyAdvice = t("adviceFair");
  } else if (score < 80) {
    ratingText = t("scoreGood");
    scoreColor = "text-[#059669]";
    bgBadge = "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]";
    friendlyAdvice = t("adviceGood");
  } else {
    ratingText = t("scoreExcellent");
    scoreColor = "text-[#059669]";
    bgBadge = "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]";
    friendlyAdvice = t("adviceExcellent");
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#eae8e3] flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#111827]">
                {t("title")}
              </h3>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${bgBadge}`}>
                {ratingText}
              </span>
            </div>
            <p className="text-xs text-[#6b7280] mt-1">{t("subtitle")}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">{t("scoreLabel")}</span>
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
            />
          </div>
        </div>

        {/* Human explanation banner */}
        <div className="bg-[#fbfbfa] p-3 rounded-2xl border border-[#eae8e3] mb-3 flex items-start space-x-2">
          <HeartHandshake className="w-4 h-4 text-[#ff5b45] mt-0.5 shrink-0" />
          <p className="text-xs text-[#4b5563] leading-relaxed">{friendlyAdvice}</p>
        </div>

        {/* 4 Pillars in Simple Terms */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block">{t("stability")}</span>
            <span className="font-bold text-[#111827] font-mono">
              {Math.round(resilience.income_stability)}%
            </span>
          </div>
          <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block">{t("emergencyCushion")}</span>
            <span className="font-bold text-[#111827] font-mono">
              {Math.round(resilience.buffer_coverage)}%
            </span>
          </div>
          <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block">{t("expenseControl")}</span>
            <span className="font-bold text-[#111827] font-mono">
              {Math.round(resilience.expense_health)}%
            </span>
          </div>
          <div className="bg-[#fbfbfa] p-2.5 rounded-xl border border-[#eae8e3]">
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block">{t("cashFlowSafety")}</span>
            <span className="font-bold text-[#111827] font-mono">
              {Math.round(resilience.cash_flow_health)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
