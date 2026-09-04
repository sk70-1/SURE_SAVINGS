"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, PlusCircle, Sparkles, ArrowRight } from "lucide-react";

interface CalendarEmptyStateProps {
  onOpenAddObligation: () => void;
  onOpenAddTransaction: () => void;
  onActivateDemoMode?: () => void;
}

export const CalendarEmptyState: React.FC<CalendarEmptyStateProps> = ({
  onOpenAddObligation,
  onOpenAddTransaction,
  onActivateDemoMode,
}) => {
  const t = useTranslations("calendarEmptyState");

  return (
    <div className="bg-white rounded-3xl border border-[#eae8e3] p-8 md:p-12 text-center max-w-2xl mx-auto shadow-sm space-y-6">
      
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#ff5b45]/15 to-[#f59e0b]/15 text-[#ff5b45] flex items-center justify-center mx-auto shadow-inner">
        <CalendarDays className="w-8 h-8" />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h3 className="text-xl font-black text-[#111827] tracking-tight">
          {t("title")}
        </h3>
        <p className="text-xs text-[#6b7280] max-w-md mx-auto leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {/* Value pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        <div className="p-3.5 rounded-xl bg-[#fafaf9] border border-[#eae8e3]">
          <div className="text-[11px] font-extrabold text-[#111827] mb-0.5">{t("step1Title")}</div>
          <div className="text-[10px] text-[#6b7280]">
            {t("step1Desc")}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#fafaf9] border border-[#eae8e3]">
          <div className="text-[11px] font-extrabold text-[#111827] mb-0.5">{t("step2Title")}</div>
          <div className="text-[10px] text-[#6b7280]">
            {t("step2Desc")}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#fafaf9] border border-[#eae8e3]">
          <div className="text-[11px] font-extrabold text-[#111827] mb-0.5">{t("step3Title")}</div>
          <div className="text-[10px] text-[#6b7280]">
            {t("step3Desc")}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={onOpenAddObligation}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md shadow-[#ff5b45]/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t("addBill")}</span>
        </button>

        <button
          onClick={onOpenAddTransaction}
          className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-[#f3f4f6] text-[#111827] text-xs font-bold rounded-xl border border-[#eae8e3] flex items-center justify-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <span>{t("recordSingleItem")}</span>
        </button>
      </div>

      {/* Demo Sandbox Option */}
      {onActivateDemoMode && (
        <div className="pt-4 border-t border-[#eae8e3]">
          <p className="text-xs text-[#6b7280] mb-2">
            {t("demoNotice")}
          </p>
          <button
            onClick={onActivateDemoMode}
            className="text-xs font-bold text-[#ff5b45] hover:text-[#e04835] inline-flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("loadDemo")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};
