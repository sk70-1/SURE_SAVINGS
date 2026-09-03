"use client";

import React from "react";
import { CalendarDay, CalendarMonthData } from "../../lib/types";
import { AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Clock, PlusCircle } from "lucide-react";

interface CashPressureViewProps {
  data: CalendarMonthData;
  mode: "list" | "pressure";
  selectedDay: CalendarDay | null;
  onSelectDay: (day: CalendarDay) => void;
  onOpenAddObligation: () => void;
}

export const CashPressureView: React.FC<CashPressureViewProps> = ({
  data,
  mode,
  selectedDay,
  onSelectDay,
  onOpenAddObligation,
}) => {
  const formatMoney = (val: number) => {
    const symbol = data.currency === "INR" ? "₹" : "$";
    return `${symbol}${Math.round(val || 0).toLocaleString(data.currency === "INR" ? "en-IN" : "en-US")}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  if (mode === "pressure") {
    const pressureDays = data.days.filter((d) => d.is_risk_day);

    if (pressureDays.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-[#eae8e3] p-10 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#111827]">
              Zero Cash Pressure Days in {data.month_name}
            </h3>
            <p className="text-xs text-[#6b7280] max-w-md mx-auto mt-1">
              Deterministic calculations confirm your projected cash balance maintains a safe cushion
              above the mandatory reserve floor across all days of this month.
            </p>
          </div>
          <button
            onClick={onOpenAddObligation}
            className="px-4 py-2 bg-[#fbfbfa] hover:bg-[#f3f4f6] text-[#4b5563] text-xs font-bold rounded-xl border border-[#eae8e3] transition-all inline-flex items-center space-x-1.5 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#ff5b45]" />
            <span>Add Scheduled Bill</span>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Banner */}
        <div className="bg-[#fff5f5] border border-[#fecdd3] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffe4e6] text-[#e11d48] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#9f1239]">
                {pressureDays.length} Cash Pressure Horizon{pressureDays.length > 1 ? "s" : ""} Identified
              </h4>
              <p className="text-xs text-[#be123c] mt-0.5">
                Total simulated liquidity exposure: <strong>{formatMoney(data.summary.exposure_amount)}</strong>
              </p>
            </div>
          </div>
          <span className="hidden sm:inline text-xs font-bold text-[#e11d48] bg-white px-2.5 py-1 rounded-lg border border-[#fecdd3]">
            Action Recommended
          </span>
        </div>

        {/* Pressure List */}
        <div className="space-y-3">
          {pressureDays.map((day) => {
            const isSelected = selectedDay?.date === day.date;
            return (
              <div
                key={day.date}
                onClick={() => onSelectDay(day)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                  isSelected
                    ? "border-[#ff5b45] ring-2 ring-[#ff5b45]/30 shadow-md"
                    : "border-[#fecdd3] hover:border-[#fda4af] hover:shadow-xs"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-[#ffe4e6] text-[#e11d48] flex flex-col items-center justify-center font-bold shrink-0">
                      <span className="text-[10px] uppercase leading-none">{day.day_of_week}</span>
                      <span className="text-base font-black leading-none mt-1">{day.day_number}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-extrabold text-[#111827]">
                          {formatDate(day.date)}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ffe4e6] text-[#e11d48]">
                          {day.status_label}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b7280] mt-1 line-clamp-1">
                        {day.risk_reasons.join("; ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 sm:text-right">
                    <div>
                      <div className="text-[10px] font-bold text-[#9ca3af] uppercase">Closing Balance</div>
                      <div className={`text-sm font-black ${
                        day.projected_balance < 0 ? "text-[#e11d48]" : "text-[#d97706]"
                      }`}>
                        {formatMoney(day.projected_balance)}
                      </div>
                    </div>

                    <button className="p-2 text-[#6b7280] hover:text-[#ff5b45] bg-[#fafaf9] hover:bg-[#fff5f3] rounded-xl border border-[#eae8e3] transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // mode === "list"
  return (
    <div className="bg-white rounded-2xl border border-[#eae8e3] shadow-sm overflow-hidden">
      <div className="p-4 bg-[#fafaf9] border-b border-[#eae8e3] flex items-center justify-between">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#6b7280]">
          Chronological Cash Timeline ({data.month_name})
        </h4>
        <span className="text-xs text-[#6b7280]">
          Showing <strong>{data.days.length}</strong> days
        </span>
      </div>

      <div className="divide-y divide-[#f3f4f6] max-h-[600px] overflow-y-auto">
        {data.days.map((day) => {
          const isSelected = selectedDay?.date === day.date;
          const hasEvents = day.events.length > 0;
          return (
            <div
              key={day.date}
              onClick={() => onSelectDay(day)}
              className={`p-3.5 flex items-center justify-between gap-4 transition-colors cursor-pointer text-xs ${
                isSelected
                  ? "bg-[#fffaf9]"
                  : "hover:bg-[#fafaf9]"
              }`}
            >
              {/* Date & Weekday */}
              <div className="flex items-center space-x-3 w-32 shrink-0">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  day.is_today
                    ? "bg-[#ff5b45] text-white"
                    : isSelected
                    ? "bg-[#ff5b45]/10 text-[#ff5b45]"
                    : "bg-[#f3f4f6] text-[#374151]"
                }`}>
                  {day.day_number}
                </span>
                <div>
                  <div className="font-bold text-[#111827]">{formatDate(day.date)}</div>
                  <div className="text-[10px] text-[#9ca3af]">{day.day_of_week}</div>
                </div>
              </div>

              {/* Event Chips Summary */}
              <div className="flex-1 hidden md:flex items-center space-x-1.5 overflow-hidden">
                {hasEvents ? (
                  day.events.slice(0, 2).map((ev) => (
                    <span
                      key={ev.id}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold border truncate max-w-[150px] bg-[#fbfbfa] text-[#4b5563] border-[#eae8e3]"
                    >
                      {ev.event_type === "INCOME" || ev.event_type === "FORECAST" ? "+" : "-"}
                      {formatMoney(ev.amount)} {ev.title}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#d1d5db] italic">No activity</span>
                )}
                {day.events.length > 2 && (
                  <span className="text-[10px] text-[#9ca3af] font-bold">
                    +{day.events.length - 2}
                  </span>
                )}
              </div>

              {/* Inflows & Outflows */}
              <div className="flex items-center space-x-4 text-right shrink-0">
                <div className="w-20">
                  <span className={`font-bold ${day.total_inflow > 0 ? "text-[#059669]" : "text-[#9ca3af]"}`}>
                    {day.total_inflow > 0 ? `+${formatMoney(day.total_inflow)}` : "—"}
                  </span>
                </div>
                <div className="w-20">
                  <span className={`font-bold ${day.total_outflow > 0 ? "text-[#ea580c]" : "text-[#9ca3af]"}`}>
                    {day.total_outflow > 0 ? `-${formatMoney(day.total_outflow)}` : "—"}
                  </span>
                </div>
                <div className="w-24">
                  <span className={`font-extrabold tabular-nums ${
                    day.projected_balance < 0
                      ? "text-[#e11d48]"
                      : day.is_risk_day
                      ? "text-[#d97706]"
                      : "text-[#111827]"
                  }`}>
                    {formatMoney(day.projected_balance)}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
