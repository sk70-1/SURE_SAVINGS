"use client";

import React from "react";
import { Link } from "../i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import {
  ShieldCheck,
  Wallet,
  CalendarClock,
  ArrowRight,
  PlusCircle,
  Lock,
} from "lucide-react";
import { BufferStatus } from "../lib/types";
import { formatCurrency, formatDate } from "../lib/formatters";

interface SimpleSummaryCardsProps {
  buffer: BufferStatus | null;
  safeToSpend: number;
  upcomingBillsTotal: number;
  nearestBill: {
    title: string;
    due_date: string;
    amount: number;
    is_covered?: boolean;
  } | null;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  currencySymbol?: string;
}

export const SimpleSummaryCards: React.FC<SimpleSummaryCardsProps> = ({
  buffer,
  safeToSpend,
  upcomingBillsTotal,
  nearestBill,
  onOpenDeposit,
  onOpenWithdraw,
  currencySymbol = "₹",
}) => {
  const t = useTranslations("summaryCards");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const currentSaved = buffer ? Math.round(buffer.current_balance) : 0;
  const coverageWeeks = buffer?.coverage_weeks ? Number(buffer.coverage_weeks.toFixed(1)) : 0;
  const targetGoal = buffer ? Math.round(buffer.target_amount) : 24000;
  const minFloor = buffer ? Math.round(buffer.minimum_floor) : 5000;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      
      {/* 1. Emergency Savings Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#eae8e3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                {t("bufferStatus")}
              </span>
            </div>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
              {t("weeksCovered", { weeks: coverageWeeks })}
            </span>
          </div>

          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-black text-[#111827] font-mono tracking-tight">
              {formatCurrency(currentSaved, "INR", locale)}
            </span>
            <p className="text-xs text-[#6b7280] mt-1">
              {t("cushionDesc")}
            </p>
          </div>

          <div className="mt-3.5 pt-3 border-t border-[#f3f4f6] text-xs text-[#4b5563] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">{t("goal")}</span>
              <strong className="font-mono text-[#111827]">{formatCurrency(targetGoal, "INR", locale)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280] flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#f59e0b]" />
                <span>{t("bufferProtectedFloor", { floor: formatCurrency(minFloor, "INR", locale) })}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="mt-4 pt-3 flex items-center gap-2">
          {onOpenDeposit && (
            <button
              onClick={onOpenDeposit}
              className="flex-1 py-2 text-xs font-bold text-[#059669] bg-[#ecfdf5] hover:bg-[#d1fae5] rounded-xl border border-[#a7f3d0] transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ {tCommon("save")}</span>
            </button>
          )}
          {onOpenWithdraw && currentSaved > minFloor && (
            <button
              onClick={onOpenWithdraw}
              className="py-2 px-3 text-xs font-semibold text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] rounded-xl transition-colors cursor-pointer"
            >
              {t("withdraw")}
            </button>
          )}
        </div>
      </div>

      {/* 2. Money Available This Week Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#eae8e3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#fff5f3] text-[#ff5b45] flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                {t("safeToSpend")}
              </span>
            </div>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#fff5f3] text-[#ff5b45] border border-[#ffdad4]">
              {t("safeToSpend")}
            </span>
          </div>

          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-black text-[#059669] font-mono tracking-tight">
              {formatCurrency(Math.max(0, safeToSpend), "INR", locale)}
            </span>
            <p className="text-xs text-[#6b7280] mt-1">
              {t("safeToSpendDesc")}
            </p>
          </div>

          <div className="mt-3.5 pt-3 border-t border-[#f3f4f6] text-xs text-[#4b5563] space-y-1">
            <div className="flex items-center space-x-1.5 text-[#059669]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
              <span className="font-medium">{t("zeroStressDaily")}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3">
          <p className="text-[11px] text-[#9ca3af]">
            {t("autoUpdateNote")}
          </p>
        </div>
      </div>

      {/* 3. Upcoming Bills Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#eae8e3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center">
                <CalendarClock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                {t("upcomingBills")}
              </span>
            </div>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe]">
              {t("thisMonth")}
            </span>
          </div>

          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-black text-[#111827] font-mono tracking-tight">
              {formatCurrency(upcomingBillsTotal, "INR", locale)}
            </span>
            <p className="text-xs text-[#6b7280] mt-1">
              {t("upcomingBillsDesc")}
            </p>
          </div>

          <div className="mt-3.5 pt-3 border-t border-[#f3f4f6] text-xs text-[#4b5563]">
            {nearestBill ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#6b7280] block text-[11px]">{t("nearestDue")}</span>
                  <strong className="text-[#111827] font-medium">{nearestBill.title} ({formatDate(nearestBill.due_date, locale)})</strong>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#111827]">{formatCurrency(nearestBill.amount, "INR", locale)}</span>
                  <span className={`block text-[10px] font-bold ${nearestBill.is_covered !== false ? "text-[#059669]" : "text-[#d97706]"}`}>
                    {nearestBill.is_covered !== false ? t("covered") : t("needsAttention")}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-[#6b7280]">{t("noImmediateBills")}</span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3">
          <Link
            href="/calendar"
            className="w-full py-2 text-xs font-bold text-[#7c3aed] hover:text-[#6d28d9] flex items-center justify-center space-x-1.5 transition-colors group cursor-pointer"
          >
            <span>{t("seeAllUpcomingBills")}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

    </div>
  );
};
