"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  CalendarDayDetail, CalendarDay, CalendarEvent
} from "../../lib/types";
import {
  ShieldAlert, ShieldCheck, ArrowDownLeft, ArrowUpRight,
  Clock, AlertTriangle, ArrowRight, Sparkles, CheckCircle2
} from "lucide-react";
import { formatCurrency, formatDate as formatGlobalDate } from "../../lib/formatters";

interface DayInspectorProps {
  dayDetail: CalendarDayDetail | null;
  selectedDay: CalendarDay | null;
  currency?: string;
  onOpenBufferModal: () => void;
  onOpenAllocationModal: () => void;
}

export const DayInspector: React.FC<DayInspectorProps> = ({
  dayDetail,
  selectedDay,
  currency = "INR",
  onOpenBufferModal,
  onOpenAllocationModal,
}) => {
  const t = useTranslations("calendar");
  const locale = useLocale();

  const formatMoney = (val: number) => {
    return formatCurrency(val, currency, locale);
  };

  const activeDay = dayDetail?.day_data || selectedDay;

  if (!activeDay) {
    return (
      <div className="bg-white rounded-2xl border border-[#eae8e3] p-6 text-center text-[#6b7280]">
        <Clock className="w-8 h-8 text-[#9ca3af] mx-auto mb-2" />
        <p className="text-sm font-semibold">{t("selectDayPrompt")}</p>
        <p className="text-xs mt-1">{t("selectDayDesc")}</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return formatGlobalDate(dateStr, locale);
    } catch {
      return dateStr;
    }
  };

  const inflows = activeDay.events.filter((e) => e.event_type === "INCOME" || e.event_type === "FORECAST");
  const debits = activeDay.events.filter((e) => e.event_type === "EXPENSE" || e.event_type === "OBLIGATION");
  const isNetNegative = activeDay.net_flow < 0;

  const safeBuffer = dayDetail?.safe_buffer_available || 0;
  const floorSafeguard = dayDetail?.buffer_floor_safeguard || 0;
  const bufferNeeded = dayDetail?.buffer_needed || 0;
  const isBufferSufficient = dayDetail?.is_buffer_sufficient ?? true;

  return (
    <div className="bg-white rounded-2xl border border-[#eae8e3] shadow-sm p-5 space-y-5">
      
      {/* Top Header: Inspection Label & Attention Pill */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9ca3af]">
            {t("inspectingTargetDate")}
          </span>
          {activeDay.is_risk_day ? (
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-[#ffe4e6] text-[#e11d48] border border-[#fecdd3]">
              {t("highAttention")}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
              {t("normalRhythm")}
            </span>
          )}
        </div>

        <h3 className="text-lg font-black text-[#111827] tracking-tight">
          {formatDate(activeDay.date)}
        </h3>
        <p className={`text-xs font-semibold mt-0.5 ${
          activeDay.is_risk_day ? "text-[#e11d48]" : "text-[#6b7280]"
        }`}>
          {activeDay.is_risk_day
            ? t("criticalLiquidityHorizon")
            : t("cashPositionHealthy")}
        </p>
      </div>

      {/* Inflows Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-extrabold text-[#059669]">
          <span className="flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t("expectedInflows")}</span>
          </span>
          <span className="text-sm font-black">+{formatMoney(activeDay.total_inflow)}</span>
        </div>

        {inflows.length > 0 ? (
          <div className="bg-[#f0fdf4]/50 border border-[#bbf7d0] rounded-xl p-2.5 space-y-1.5">
            {inflows.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-[#166534] font-medium truncate pr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {item.is_forecast && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-[#dcfce7] text-[#15803d] font-bold">
                      {item.confidence ? `${Math.round(item.confidence * 100)}%` : "forecast"}
                    </span>
                  )}
                </div>
                <span className="font-bold text-[#15803d] shrink-0">
                  +{formatMoney(item.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[#9ca3af] italic px-1">
            {t("noIncomeScheduled")}
          </div>
        )}
      </div>

      {/* Scheduled Debits Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-extrabold text-[#ea580c]">
          <span className="flex items-center space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{t("scheduledDebits")}</span>
          </span>
          <span className="text-sm font-black">-{formatMoney(activeDay.total_outflow)}</span>
        </div>

        {debits.length > 0 ? (
          <div className="bg-[#fff7ed]/50 border border-[#fed7aa] rounded-xl p-2.5 space-y-1.5">
            {debits.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-[#9a3412] font-medium truncate pr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {item.is_essential && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-[#ffedd5] text-[#c2410c] font-bold">
                      mandate
                    </span>
                  )}
                </div>
                <span className="font-bold text-[#c2410c] shrink-0">
                  -{formatMoney(item.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[#9ca3af] italic px-1">
            {t("noDebitsScheduled")}
          </div>
        )}
      </div>

      {/* Net Projected Flow */}
      <div className="p-3 rounded-xl bg-[#fafaf9] border border-[#eae8e3] flex items-center justify-between">
        <span className="text-xs font-bold text-[#4b5563]">
          {t("netProjectedGap")}
        </span>
        <span
          className={`text-base font-black tracking-tight ${
            isNetNegative ? "text-[#e11d48]" : "text-[#059669]"
          }`}
        >
          {isNetNegative ? "-" : "+"}
          {formatMoney(Math.abs(activeDay.net_flow))}
        </span>
      </div>

      {/* Intraday Timing Sequence */}
      {dayDetail?.intraday_timeline && dayDetail.intraday_timeline.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6b7280]">
            {t("intradayTimingSequence")}
          </span>
          <div className="bg-[#fbfbfa] border border-[#eae8e3] rounded-xl p-3 space-y-2">
            {dayDetail.intraday_timeline.map((step, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 rounded bg-white border border-[#eae8e3] font-mono text-[10px] font-bold text-[#6b7280]">
                    {step.time}
                  </span>
                  <span className="font-medium text-[#1f2937] text-[11px] line-clamp-1">
                    {step.label}
                  </span>
                </div>
                <span className={`font-bold text-[11px] ${
                  step.is_breach ? "text-[#e11d48]" : "text-[#4b5563]"
                }`}>
                  bal: {formatMoney(step.running_balance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deterministic Risk Diagnosis */}
      {dayDetail?.deterministic_diagnosis && (
        <div className={`p-3.5 rounded-xl border space-y-1.5 ${
          activeDay.is_risk_day
            ? "bg-[#fff5f5] border-[#fecdd3]"
            : "bg-[#f8fafc] border-[#e2e8f0]"
        }`}>
          <div className="flex items-center space-x-1.5">
            {activeDay.is_risk_day ? (
              <AlertTriangle className="w-4 h-4 text-[#e11d48]" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#059669]" />
            )}
            <span className={`text-xs font-extrabold ${
              activeDay.is_risk_day ? "text-[#9f1239]" : "text-[#334155]"
            }`}>
              {t("deterministicRiskDiagnosis")}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[#475569]">
            {dayDetail.deterministic_diagnosis}
          </p>
        </div>
      )}

      {/* Vault Buffer Reserve & Safety Floor Bar */}
      <div className="space-y-2 pt-1 border-t border-[#eae8e3]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#4b5563]">{t("availableSafeBufferInVault")}</span>
          <span className="text-sm font-black text-[#0d9488]">{formatMoney(safeBuffer)}</span>
        </div>

        {/* Multi-segment Buffer Bar */}
        <div className="w-full bg-[#f1f5f9] h-2.5 rounded-full overflow-hidden flex">
          <div
            className="bg-[#059669] h-full transition-all"
            style={{ width: `${Math.min(100, Math.max(15, (safeBuffer / (safeBuffer + floorSafeguard || 1)) * 100))}%` }}
            title={`Safe Buffer: ${formatMoney(safeBuffer)}`}
          />
          <div
            className="bg-[#f59e0b] h-full transition-all"
            style={{ width: `${Math.min(100, (floorSafeguard / (safeBuffer + floorSafeguard || 1)) * 100)}%` }}
            title={`Floor Safeguard: ${formatMoney(floorSafeguard)}`}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#6b7280]">
          <span>{t("needed")} <strong className={bufferNeeded > 0 ? "text-[#e11d48]" : "text-[#111827]"}>{formatMoney(bufferNeeded)}</strong></span>
          <span>{t("floorSafeguard")} <strong className="text-[#6b7280]">{formatMoney(floorSafeguard)}</strong></span>
        </div>
      </div>

      {/* Simulation Action CTA */}
      <div className="pt-2">
        <button
          onClick={onOpenBufferModal}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-[#ff5b45]/20 flex items-center justify-center space-x-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t("simulateBufferSmoothing")}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <p className="text-[10px] text-center text-[#9ca3af] mt-1.5">
          {t("pureSimulationNotice")}
        </p>
      </div>

    </div>
  );
};
