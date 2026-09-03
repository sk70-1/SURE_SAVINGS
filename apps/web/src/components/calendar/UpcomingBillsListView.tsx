"use client";

import React from "react";
import {
  CalendarMonthData,
  CalendarDay,
  CalendarEvent,
} from "../../lib/types";
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface UpcomingBillsListViewProps {
  data: CalendarMonthData;
  onOpenAddBill: () => void;
  onSelectDay: (day: CalendarDay) => void;
  selectedDay: CalendarDay | null;
}

export const UpcomingBillsListView: React.FC<UpcomingBillsListViewProps> = ({
  data,
  onOpenAddBill,
  onSelectDay,
  selectedDay,
}) => {
  const currencySymbol = data.currency === "INR" ? "₹" : "$";

  // Gather all bill / obligation events across the month
  const billItems: Array<{
    event: CalendarEvent;
    day: CalendarDay;
    isCovered: boolean;
  }> = [];

  data.days.forEach((day) => {
    day.events.forEach((ev) => {
      if (ev.event_type === "OBLIGATION" || (ev.event_type === "EXPENSE" && ev.is_essential)) {
        // A bill is covered if the day balance is non-negative and not in high risk
        const isCovered = !day.is_risk_day && day.projected_balance >= 0;
        billItems.push({
          event: ev,
          day,
          isCovered,
        });
      }
    });
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // If no bills are present in this month
  if (billItems.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#eae8e3] p-10 text-center shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#fff5f3] text-[#ff5b45] flex items-center justify-center mx-auto shadow-inner">
          <CalendarClock className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-black text-[#111827]">
            No upcoming bills yet
          </h3>
          <p className="text-xs text-[#6b7280] max-w-md mx-auto mt-1 leading-relaxed">
            Add your rent, vehicle EMI, phone, electricity, or loan payments. Sure-Savings will keep your money safe before due dates arrive.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={onOpenAddBill}
            className="px-5 py-2.5 bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md shadow-[#ff5b45]/20 inline-flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add a bill</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#eae8e3] shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="p-5 border-b border-[#f3f4f6] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-[#111827]">
            Upcoming Bills ({billItems.length})
          </h3>
          <p className="text-xs text-[#6b7280]">
            Scheduled living essentials and payments for {data.month_name}
          </p>
        </div>

        <button
          onClick={onOpenAddBill}
          className="px-3.5 py-1.5 text-xs font-bold text-[#7c3aed] bg-[#f5f3ff] hover:bg-[#ede9fe] border border-[#ddd6fe] rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Bill</span>
        </button>
      </div>

      {/* Bills List */}
      <div className="divide-y divide-[#f3f4f6]">
        {billItems.map(({ event, day, isCovered }, idx) => {
          const isSelected = selectedDay?.date === day.date;
          return (
            <div
              key={`${event.id}-${idx}`}
              onClick={() => onSelectDay(day)}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer ${
                isSelected ? "bg-[#fffaf9]" : "hover:bg-[#fbfbfa]"
              }`}
            >
              {/* Left: Date & Name */}
              <div className="flex items-center space-x-3.5">
                <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                  isSelected
                    ? "bg-[#ff5b45] text-white border-[#ff5b45]"
                    : "bg-[#fbfbfa] text-[#111827] border-[#eae8e3]"
                }`}>
                  <span className="text-[10px] font-bold uppercase leading-none opacity-80">
                    {day.day_of_week.slice(0, 3)}
                  </span>
                  <span className="text-sm font-black leading-tight mt-0.5">
                    {day.day_number}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#111827] leading-snug">
                    {event.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-[11px] text-[#6b7280] mt-0.5">
                    <span>Due {formatDate(day.date)}</span>
                    <span>•</span>
                    <span className="capitalize">{event.category.replace("_", " ")}</span>
                  </div>
                </div>
              </div>

              {/* Right: Amount & Status */}
              <div className="flex items-center justify-between sm:justify-end space-x-4 pl-14 sm:pl-0">
                <div className="text-right">
                  <span className="text-base font-black text-[#111827] font-mono">
                    {currencySymbol}{Math.round(event.amount).toLocaleString("en-IN")}
                  </span>
                </div>

                <div>
                  {isCovered ? (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] flex items-center space-x-1.5 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Covered</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3] flex items-center space-x-1.5 shadow-xs">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Needs attention</span>
                    </span>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
