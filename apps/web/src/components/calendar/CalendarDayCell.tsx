"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CalendarDay, CalendarEvent } from "../../lib/types";
import { Sparkles, AlertCircle } from "lucide-react";

interface CalendarDayCellProps {
  day: CalendarDay;
  isSelected: boolean;
  currency?: string;
  onSelectDay: (day: CalendarDay) => void;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  day,
  isSelected,
  currency = "INR",
  onSelectDay,
}) => {
  const tCal = useTranslations("calendar");

  const formatMoney = (val: number) => {
    const symbol = currency === "INR" ? "₹" : "$";
    return `${symbol}${Math.round(val || 0).toLocaleString(currency === "INR" ? "en-IN" : "en-US")}`;
  };

  const getChipStyle = (ev: CalendarEvent) => {
    if (ev.event_type === "INCOME") {
      return "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0] hover:bg-[#d1fae5]";
    }
    if (ev.event_type === "FORECAST") {
      return "bg-[#f0fdfa] text-[#0f766e] border-[#99f6e4] hover:bg-[#ccfbf1]";
    }
    if (ev.event_type === "OBLIGATION") {
      return "bg-[#f5f3ff] text-[#6d28d9] border-[#ddd6fe] hover:bg-[#ede9fe]";
    }
    // EXPENSE
    if (ev.is_essential) {
      return "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa] hover:bg-[#ffedd5]";
    }
    return "bg-[#f8fafc] text-[#475569] border-[#e2e8f0] hover:bg-[#f1f5f9]";
  };

  const visibleEvents = day.events.slice(0, 3);
  const hiddenCount = day.events.length - visibleEvents.length;

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`Select ${day.date}`}
      onClick={() => onSelectDay(day)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectDay(day);
        }
      }}
      className={`min-h-[110px] p-2 flex flex-col justify-between rounded-xl border transition-all cursor-pointer relative select-none outline-none ${
        isSelected
          ? "bg-[#fffaf9] border-[#ff5b45] shadow-md ring-2 ring-[#ff5b45]/30 z-10"
          : day.is_risk_day
          ? "bg-[#fffdfd] border-[#fecdd3] hover:border-[#fda4af] hover:shadow-sm"
          : "bg-white border-[#eae8e3] hover:border-[#cbd5e1] hover:shadow-xs"
      }`}
    >
      {/* Top Header: Day Number + Today / Risk Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <span
            className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
              day.is_today
                ? "bg-[#ff5b45] text-white font-extrabold shadow-xs"
                : isSelected
                ? "bg-[#ff5b45]/10 text-[#ff5b45] font-black"
                : "text-[#1f2937]"
            }`}
          >
            {day.day_number}
          </span>
          {day.is_today && (
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#fff1ef] text-[#ff5b45] border border-[#ffdad4]">
              {tCal("today")}
            </span>
          )}
        </div>

        {/* Risk Badge on Date */}
        {day.is_risk_day && (
          <span
            className="flex items-center space-x-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#ffe4e6] text-[#e11d48] border border-[#fecdd3]"
            title={day.risk_reasons.join(" ")}
          >
            <AlertCircle className="w-2.5 h-2.5" />
            <span>{tCal("risk")}</span>
          </span>
        )}
      </div>

      {/* Center Event Chips */}
      <div className="my-1.5 space-y-1 overflow-hidden">
        {visibleEvents.map((ev) => (
          <div
            key={ev.id}
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border truncate flex items-center justify-between transition-colors ${getChipStyle(
              ev
            )}`}
            title={`${ev.title} (${formatMoney(ev.amount)})`}
          >
            <div className="flex items-center space-x-1 truncate">
              {ev.is_forecast && <Sparkles className="w-2.5 h-2.5 shrink-0 text-[#0f766e]" />}
              <span className="truncate">
                {ev.event_type === "INCOME" || ev.event_type === "FORECAST" ? "+" : "-"}
                {formatMoney(ev.amount)} {ev.title}
              </span>
            </div>
          </div>
        ))}

        {hiddenCount > 0 && (
          <div className="text-[9px] font-bold text-[#6b7280] text-right pr-1">
            {tCal("moreEvents", { count: hiddenCount })}
          </div>
        )}
      </div>

      {/* Bottom Status / Projected Balance Bar */}
      <div className="mt-auto pt-1 border-t border-[#f3f4f6] flex items-center justify-between text-[10px]">
        <span
          className={`font-medium truncate max-w-[65px] ${
            day.is_risk_day
              ? "text-[#e11d48] font-bold"
              : "text-[#6b7280]"
          }`}
        >
          {day.status_label}
        </span>
        <span
          className={`font-semibold tabular-nums ${
            day.projected_balance < 0
              ? "text-[#e11d48]"
              : day.is_risk_day
              ? "text-[#d97706]"
              : "text-[#4b5563]"
          }`}
        >
          {formatMoney(day.projected_balance)}
        </span>
      </div>
    </div>
  );
};
