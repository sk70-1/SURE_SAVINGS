"use client";

import React from "react";
import { PlusCircle, ArrowDownCircle, Lock, ShieldCheck } from "lucide-react";
import { BufferStatus } from "../lib/types";

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
  if (!buffer) {
    return (
      <div className="glass-panel rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-36 bg-[#f3f4f6] rounded mb-4"></div>
        <div className="h-24 bg-[#f3f4f6] rounded"></div>
      </div>
    );
  }

  const targetPct = Math.min(100, Math.round((buffer.current_balance / buffer.target_amount) * 100));
  const floorPct = Math.min(100, Math.round((buffer.minimum_floor / buffer.target_amount) * 100));

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#111827] tracking-wide">
                Emergency Savings
              </h3>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#fffbeb] text-[#d97706] border border-[#fef3c7]">
                {buffer.coverage_weeks} Weeks Covered
              </span>
            </div>
            <p className="text-xs text-[#6b7280] mt-1">Your backup fund to cover slow or unpaid weeks</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">Total Saved</span>
            <div className="text-3xl font-black text-[#111827] tracking-tight font-mono">
              ₹{Math.round(buffer.current_balance).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[#6b7280] mb-1.5">
            <span>
              Goal: <strong className="text-[#111827]">₹{Math.round(buffer.target_amount).toLocaleString("en-IN")}</strong>
            </span>
            <span className="font-bold text-[#f59e0b]">{targetPct}% of Goal</span>
          </div>

          <div className="relative w-full h-3.5 bg-[#f3f4f6] rounded-full overflow-hidden border border-[#eae8e3]">
            {/* Protected floor strip */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[#f59e0b]/30 border-r-2 border-[#f59e0b] z-10"
              style={{ width: `${floorPct}%` }}
              title="Protected Emergency Floor"
            ></div>

            {/* Current balance */}
            <div
              className="h-full bg-gradient-to-r from-[#f59e0b] via-[#ff7461] to-[#ff5b45] rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${targetPct}%` }}
            ></div>
          </div>

          {/* 2 Clear Reserve Buckets */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <div className="bg-[#fffbeb] p-2.5 rounded-xl border border-[#fef3c7]">
              <div className="flex items-center space-x-1.5 text-[#b45309] mb-0.5">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Emergency Floor</span>
              </div>
              <div className="text-xs font-bold text-[#92400e] font-mono">
                ₹{Math.round(buffer.minimum_floor).toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-[#b45309]/80 block mt-0.5">Untouchable for rent & food</span>
            </div>

            <div className="bg-[#ecfdf5] p-2.5 rounded-xl border border-[#a7f3d0]">
              <div className="flex items-center space-x-1.5 text-[#047857] mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Safe to Use</span>
              </div>
              <div className="text-xs font-bold text-[#065f46] font-mono">
                ₹{Math.round(buffer.available_safe_buffer).toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-[#047857]/80 block mt-0.5">Ready to use when work is slow</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center space-x-2.5 mt-4">
        <button
          onClick={onOpenDeposit}
          className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-[#ff5b45]/30 active:scale-95"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Money</span>
        </button>

        <button
          onClick={onOpenWithdraw}
          className="flex-1 py-2.5 px-3 text-xs font-bold text-[#374151] bg-[#ffffff] hover:bg-[#f9fafb] rounded-xl flex items-center justify-center space-x-1.5 transition-all border border-[#eae8e3] shadow-sm active:scale-95"
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span>Withdraw Money</span>
        </button>
      </div>
    </div>
  );
};
