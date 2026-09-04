"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { CalendarDay, CalendarMonthData } from "../../lib/types";
import { CalendarDayCell } from "./CalendarDayCell";
import { Sparkles } from "lucide-react";
import { formatCurrency } from "../../lib/formatters";

interface CashFlowCalendarProps {
  data: CalendarMonthData;
  selectedDay: CalendarDay | null;
  onSelectDay: (day: CalendarDay) => void;
}

export const CashFlowCalendar: React.FC<CashFlowCalendarProps> = ({
  data,
  selectedDay,
  onSelectDay,
}) => {
  const t = useTranslations("calendar");
  const locale = useLocale();

  const formatMoney = (val: number) => {
    return formatCurrency(val, data.currency, locale);
  };

  const days = data.days;
  const firstDayStr = days[0]?.date;
  let leadingEmptyDays = 0;
  if (firstDayStr) {
    const d = new Date(firstDayStr + "T00:00:00");
    // getDay: 0 is Sun, 1 is Mon, 6 is Sat.
    // We want Monday = 0, Tuesday = 1, ..., Sunday = 6
    const dayOfWeek = d.getDay();
    leadingEmptyDays = (dayOfWeek + 6) % 7;
  }

  const weekHeaders = [
    t("daysMon"),
    t("daysTue"),
    t("daysWed"),
    t("daysThu"),
    t("daysFri"),
    t("daysSat"),
    t("daysSun"),
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#eae8e3] shadow-sm overflow-hidden">
      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-[#eae8e3] bg-[#fafaf9]">
        {weekHeaders.map((header, idx) => (
          <div
            key={`${header}-${idx}`}
            className="py-2.5 text-center text-[11px] font-extrabold uppercase tracking-wider text-[#6b7280]"
          >
            {header}
          </div>
        ))}
      </div>

      {/* 7-Column Grid */}
      <div className="grid grid-cols-7 gap-1.5 p-2 bg-[#f8f8f7]">
        {/* Leading empty cells before the 1st of the month */}
        {Array.from({ length: leadingEmptyDays }).map((_, i) => (
          <div
            key={`empty-leading-${i}`}
            className="min-h-[110px] rounded-xl border border-dashed border-[#e5e7eb] bg-[#fafaf9]/60"
          />
        ))}

        {/* Days of the month */}
        {days.map((day) => (
          <CalendarDayCell
            key={day.date}
            day={day}
            isSelected={selectedDay?.date === day.date}
            currency={data.currency}
            onSelectDay={onSelectDay}
          />
        ))}
      </div>

      {/* Bottom Status Bar matching reference info layout */}
      <div className="px-4 py-3 bg-[#fafaf9] border-t border-[#eae8e3] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left: Projection Fidelity */}
        <div className="flex items-center space-x-2">
          <span className="text-[#6b7280] font-medium">
            {data.month_name} {t("projectionFidelity")}
          </span>
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
            <Sparkles className="w-3 h-3 text-[#059669]" />
            <span>{data.summary.projection_fidelity_score}% {t("historicalPrecision")}</span>
          </span>
        </div>

        {/* Center: Chip Legend */}
        <div className="hidden xl:flex items-center space-x-3 text-[10px] font-semibold text-[#6b7280]">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            <span>{t("legendIncome")}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#0d9488]" />
            <span>{t("legendForecast")}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
            <span>{t("legendMandate")}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
            <span>{t("legendEssential")}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#e11d48]" />
            <span>{t("legendRisk")}</span>
          </span>
        </div>

        {/* Right: Settled / Pending / Exposure metrics */}
        <div className="flex items-center space-x-4 text-[11px] text-[#6b7280]">
          <div>
            {t("settledLabel")} <strong className="text-[#111827]">{formatMoney(data.summary.settled_inflow)}</strong>
          </div>
          <div>
            {t("pendingLabel")} <strong className="text-[#0284c7]">{formatMoney(data.summary.pending_inflow)}</strong>
          </div>
          <div>
            {t("exposureLabel")} <strong className={data.summary.exposure_amount > 0 ? "text-[#e11d48]" : "text-[#111827]"}>
              {formatMoney(data.summary.exposure_amount)}
            </strong>
          </div>
        </div>

      </div>
    </div>
  );
};
