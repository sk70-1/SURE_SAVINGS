"use client";

import React from "react";
import { useLocale } from "next-intl";
import { ArrowDownLeft, ArrowUpRight, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { CalendarMonthSummary } from "../../lib/types";
import { formatCurrency, formatDate } from "../../lib/formatters";

interface CalendarSummaryCardsProps {
  summary: CalendarMonthSummary | null;
  currency?: string;
  onOpenBufferModal?: () => void;
}

export const CalendarSummaryCards: React.FC<CalendarSummaryCardsProps> = ({
  summary,
  currency = "INR",
  onOpenBufferModal,
}) => {
  const locale = useLocale();

  const formatMoney = (val: number) => {
    return formatCurrency(val, currency, locale);
  };

  const formatGapDate = (dateStr?: string | null) => {
    if (!dateStr) return "No critical gap";
    return formatDate(dateStr, locale);
  };

  const hasCriticalGap = summary && summary.critical_gap_date && summary.critical_gap_amount > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      
      {/* 1. Expected Income */}
      <div className="bg-white rounded-2xl p-4 border border-[#eae8e3] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6b7280]">
            Expected Income (+₹)
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#059669] flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black text-[#059669] tracking-tight">
            {formatMoney(summary?.expected_income || 0)}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-[#6b7280] flex items-center justify-between">
          <span>Settled: <strong className="text-[#111827]">{formatMoney(summary?.settled_inflow || 0)}</strong></span>
          <span>Pending: <strong className="text-[#0284c7]">{formatMoney(summary?.pending_inflow || 0)}</strong></span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#059669]/20" />
      </div>

      {/* 2. Essential Outflows */}
      <div className="bg-white rounded-2xl p-4 border border-[#eae8e3] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6b7280]">
            Essential Outflows (-₹)
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#fff7ed] text-[#ea580c] flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black text-[#ea580c] tracking-tight">
            {formatMoney(summary?.essential_outflows || 0)}
          </span>
          <span className="text-[11px] font-semibold text-[#6b7280]">mandated</span>
        </div>
        <div className="mt-2 text-[11px] text-[#6b7280] flex items-center justify-between">
          <span>Total Outflows:</span>
          <strong className="text-[#111827]">{formatMoney(summary?.total_outflows || 0)}</strong>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#ea580c]/20" />
      </div>

      {/* 3. Critical Gap Point */}
      <div className={`rounded-2xl p-4 border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
        hasCriticalGap
          ? "bg-[#fff5f5] border-[#fecdd3]"
          : "bg-white border-[#eae8e3]"
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6b7280]">
            Critical Gap Point
          </span>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            hasCriticalGap ? "bg-[#ffe4e6] text-[#e11d48]" : "bg-[#ecfdf5] text-[#059669]"
          }`}>
            {hasCriticalGap ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
        </div>

        {hasCriticalGap ? (
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-black text-[#e11d48] tracking-tight">
                {formatGapDate(summary?.critical_gap_date)}
              </span>
              <span className="text-xs font-bold text-[#e11d48] bg-[#ffe4e6] px-1.5 py-0.5 rounded-md">
                -{formatMoney(summary?.critical_gap_amount || 0)}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-[#9f1239] line-clamp-1 font-medium">
              Liquidity falls below cash reserve
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-[#059669] tracking-tight">
                No Critical Gap
              </span>
            </div>
            <p className="mt-2 text-[11px] text-[#059669] font-medium">
              Reserves secure across all dates
            </p>
          </div>
        )}
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${
          hasCriticalGap ? "bg-[#e11d48]/40" : "bg-[#059669]/20"
        }`} />
      </div>

      {/* 4. Vault Buffer Reserve */}
      <div className="bg-white rounded-2xl p-4 border border-[#eae8e3] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6b7280]">
            Vault Buffer Reserve
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#f0fdfa] text-[#0d9488] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black text-[#0d9488] tracking-tight">
            {formatMoney(summary?.safe_available_buffer || 0)}
          </span>
          <span className="text-[11px] font-bold text-[#059669] bg-[#ecfdf5] px-1.5 py-0.5 rounded-md">
            Safe
          </span>
        </div>
        <div className="mt-2 text-[11px] text-[#6b7280] flex items-center justify-between">
          <span>Protected Floor:</span>
          <strong className="text-[#64748b]">{formatMoney(summary?.minimum_buffer_floor || 0)}</strong>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0d9488]/20" />
      </div>

    </div>
  );
};
