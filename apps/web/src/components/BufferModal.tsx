"use client";

import React, { useState } from "react";
import { X, ShieldAlert, AlertCircle, PlusCircle, ArrowDownCircle, Check } from "lucide-react";
import { BufferStatus } from "../lib/types";

interface BufferModalProps {
  isOpen: boolean;
  mode: "CONTRIBUTION" | "WITHDRAWAL";
  buffer: BufferStatus | null;
  onClose: () => void;
  onSubmit: (amount: number, mode: "CONTRIBUTION" | "WITHDRAWAL") => Promise<void>;
}

export const BufferModal: React.FC<BufferModalProps> = ({
  isOpen,
  mode,
  buffer,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !buffer) return null;

  const numAmount = parseFloat(amount) || 0;
  const isWithdraw = mode === "WITHDRAWAL";
  const isFloorViolated = isWithdraw && numAmount > buffer.available_safe_buffer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMsg("Please enter an amount greater than zero.");
      return;
    }

    if (isFloorViolated) {
      setErrorMsg(
        `Withdrawal of ₹${numAmount.toLocaleString("en-IN")} stopped. It would go below your emergency floor of ₹${buffer.minimum_floor.toLocaleString("en-IN")} for rent and food.`
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await onSubmit(numAmount, mode);
      setAmount("");
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 border border-[#eae8e3] shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#eae8e3]">
          <div className="flex items-center space-x-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isWithdraw ? "bg-[#fffbeb] text-[#d97706] border border-[#fef3c7]" : "bg-[#fff5f3] text-[#ff5b45] border border-[#ffdad4]"
              }`}
            >
              {isWithdraw ? <ArrowDownCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                {isWithdraw ? "Take Out Emergency Money" : "Add Money to Savings"}
              </h3>
              <span className="text-[10px] text-[#ff5b45] font-bold uppercase tracking-wider">
                Sure-Savings Practice Mode
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#9ca3af] hover:text-[#111827] bg-[#f9fafb] hover:bg-[#f3f4f6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Indicator */}
        <div className="my-4 bg-[#fbfbfa] p-3.5 rounded-2xl border border-[#eae8e3] grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[#6b7280] text-[11px] block font-medium">Total Saved</span>
            <span className="text-sm font-bold text-[#111827] font-mono">
              ₹{buffer.current_balance.toLocaleString("en-IN")}
            </span>
          </div>
          <div>
            <span className="text-[#6b7280] text-[11px] block font-medium">
              {isWithdraw ? "Safe to Take Out" : "Left to Reach Goal"}
            </span>
            <span className={`text-sm font-bold font-mono ${isWithdraw ? "text-[#059669]" : "text-[#ff5b45]"}`}>
              ₹
              {isWithdraw
                ? buffer.available_safe_buffer.toLocaleString("en-IN")
                : buffer.buffer_gap.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {isWithdraw && (
          <div className="mb-4 p-3 rounded-2xl bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-[#d97706]" />
            <span>
              Emergency Floor: <strong>₹{buffer.minimum_floor.toLocaleString("en-IN")}</strong>. We keep this safe so you always have money for rent and food.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Amount (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#9ca3af] font-semibold text-sm">₹</span>
              <input
                type="number"
                step="100"
                min="100"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (e.g. 900)"
                className="w-full bg-[#fbfbfa] text-sm text-[#111827] font-bold pl-7 pr-4 py-2.5 rounded-xl border border-[#eae8e3] focus:outline-none focus:ring-2 focus:ring-[#ff5b45]/30 focus:border-[#ff5b45]"
              />
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#6b7280]">Presets:</span>
            {[500, 900, 2000, 5000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                className="px-2.5 py-0.5 text-[11px] font-bold bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] rounded-lg border border-[#e5e7eb] transition-colors"
              >
                ₹{preset}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#e11d48]" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#6b7280] hover:text-[#111827] bg-[#f3f4f6] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isFloorViolated}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center space-x-1.5 ${
                isFloorViolated
                  ? "bg-gray-300 opacity-50 cursor-not-allowed text-gray-500"
                  : isWithdraw
                  ? "bg-gradient-to-r from-[#d97706] to-[#b45309] shadow-amber-500/20 active:scale-95"
                  : "bg-gradient-to-r from-[#ff5b45] to-[#f05138] shadow-[#ff5b45]/30 active:scale-95"
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? "Processing..." : isWithdraw ? "Withdraw Money" : "Add Money"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
