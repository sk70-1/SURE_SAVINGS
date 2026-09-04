"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { PlusCircle, ArrowDownCircle, Lock, ShieldCheck } from "lucide-react";
import { BufferStatus } from "../lib/types";
import { formatCurrency } from "../lib/formatters";

interface BufferCardProps {
  buffer: BufferStatus | null;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  isProMode?: boolean;
}

export const BufferCard: React.FC<BufferCardProps> = ({
  buffer,
  onOpenDeposit,
  onOpenWithdraw,
  isProMode = false,
}) => {
  const t = useTranslations("bufferCard");
  const locale = useLocale();

  if (!buffer) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-[#eae8e3] flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-bold text-[#111827]">{t("title")}</h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#f3f4f6] text-[#6b7280]">
              Starting Out
            </span>
          </div>
          <p className="text-xs text-[#6b7280]">
            {t("subtitle")}
          </p>
          <div className="my-6 text-center py-4 bg-[#fbfbfa] rounded-2xl border border-[#eae8e3]">
            <span className="text-3xl font-black text-[#9ca3af] font-mono">₹0</span>
            <p className="text-xs text-[#6b7280] mt-1">
              Add your first deposit or payout to build your savings.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenDeposit}
          className="w-full py-2.5 text-xs font-bold text-[#059669] bg-[#ecfdf5] hover:bg-[#d1fae5] rounded-xl border border-[#a7f3d0] transition-colors flex items-center justify-center space-x-1 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t("depositButton")}</span>
        </button>
      </div>
    );
  }

  const currentBalance = Math.round(buffer.current_balance);
  const targetAmount = Math.max(1, Math.round(buffer.target_amount));
  const minimumFloor = Math.round(buffer.minimum_floor);
  const safeBuffer = Math.round(buffer.available_safe_buffer);
  const coverageWeeks = Number(buffer.coverage_weeks.toFixed(1));

  const targetPct = Math.min(100, Math.round((currentBalance / targetAmount) * 100));
  const floorPct = Math.min(100, Math.round((minimumFloor / targetAmount) * 100));

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#eae8e3] flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#111827]">
                {t("title")}
              </h3>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#fffbeb] text-[#d97706] border border-[#fef3c7]">
                {coverageWeeks} Weeks Covered
              </span>
            </div>
            <p className="text-xs text-[#6b7280] mt-1">{t("subtitle")}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">{t("currentBalance")}</span>
            <div className="text-3xl font-black text-[#111827] tracking-tight font-mono">
              {formatCurrency(currentBalance, "INR", locale)}
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[#6b7280] mb-1.5">
            <span>
              Goal: <strong className="text-[#111827]">{formatCurrency(targetAmount, "INR", locale)}</strong>
            </span>
            <span className="font-bold text-[#f59e0b]">{t("fundingProgress", { percent: targetPct })}</span>
          </div>

          <div className="relative w-full h-3 bg-[#f3f4f6] rounded-full overflow-hidden border border-[#eae8e3]">
            {/* Minimum Safe Savings strip */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[#f59e0b]/30 border-r-2 border-[#f59e0b] z-10"
              style={{ width: `${floorPct}%` }}
              title={t("protectedFloor")}
            />
            {/* Current balance */}
            <div
              className="h-full bg-gradient-to-r from-[#f59e0b] via-[#ff7461] to-[#ff5b45] rounded-full transition-all duration-500"
              style={{ width: `${targetPct}%` }}
            />
          </div>

          {/* 2 Clear Reserve Buckets */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <div className="bg-[#fffbeb] p-2.5 rounded-xl border border-[#fef3c7]">
              <div className="flex items-center space-x-1.5 text-[#b45309] mb-0.5">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t("protectedFloor")}</span>
              </div>
              <div className="text-xs font-bold text-[#92400e] font-mono">
                {formatCurrency(minimumFloor, "INR", locale)}
              </div>
              <span className="text-[10px] text-[#b45309]/80 block mt-0.5">Untouchable for rent & food</span>
            </div>

            <div className="bg-[#ecfdf5] p-2.5 rounded-xl border border-[#a7f3d0]">
              <div className="flex items-center space-x-1.5 text-[#047857] mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t("availableToRelease")}</span>
              </div>
              <div className="text-xs font-bold text-[#065f46] font-mono">
                {formatCurrency(safeBuffer, "INR", locale)}
              </div>
              <span className="text-[10px] text-[#047857]/80 block mt-0.5">Available for emergencies</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 grid grid-cols-2 gap-2 pt-3 border-t border-[#f3f4f6]">
        <button
          onClick={onOpenDeposit}
          className="px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#059669] to-[#047857] hover:opacity-95 rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{t("depositButton")}</span>
        </button>

        <button
          onClick={onOpenWithdraw}
          disabled={safeBuffer <= 0}
          className="px-3 py-2 text-xs font-bold text-[#4b5563] hover:text-[#111827] bg-[#fbfbfa] hover:bg-[#f3f4f6] rounded-xl border border-[#eae8e3] flex items-center justify-center space-x-1.5 transition-all disabled:opacity-40 cursor-pointer"
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span>{t("withdrawButton")}</span>
        </button>
      </div>
    </div>
  );
};
