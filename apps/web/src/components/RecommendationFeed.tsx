"use client";

import React, { useState } from "react";
import { Sparkles, Check, ArrowUpRight, ArrowDownRight, ShieldCheck } from "lucide-react";
import { Recommendation } from "../lib/types";

interface RecommendationFeedProps {
  recommendations: Recommendation[];
  onApprove: (id: number) => Promise<void>;
  onDismiss: (id: number) => Promise<void>;
}

export const RecommendationFeed: React.FC<RecommendationFeedProps> = ({
  recommendations,
  onApprove,
  onDismiss,
}) => {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const pending = recommendations.filter((r) => r.status === "PENDING");

  const handleAction = async (id: number, type: "approve" | "dismiss") => {
    setLoadingId(id);
    try {
      if (type === "approve") {
        await onApprove(id);
      } else {
        await onDismiss(id);
      }
    } finally {
      setLoadingId(null);
    }
  };

  if (pending.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center">
        <ShieldCheck className="w-8 h-8 text-[#10b981] mx-auto mb-2 opacity-80" />
        <h4 className="text-sm font-bold text-[#111827]">You're in Great Shape!</h4>
        <p className="text-xs text-[#6b7280] mt-1">
          Your daily checking cash and emergency savings are perfectly balanced.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#ff5b45]" />
          <h3 className="text-sm font-bold text-[#111827] tracking-wide">
            Smart Recommendations ({pending.length})
          </h3>
        </div>
        <span className="text-[11px] text-[#6b7280]">Simple advice for your money</span>
      </div>

      <div className="space-y-3">
        {pending.map((rec) => {
          let badgeText = "Save Extra Money";
          let badgeStyle = "bg-[#fff5f3] text-[#ff5b45] border-[#ffdad4]";
          let actionLabel = `Save ₹${Math.round(rec.recommended_amount).toLocaleString("en-IN")} Now`;
          let ActionIcon = ArrowUpRight;

          if (rec.type === "USE_BUFFER") {
            badgeText = "Use Emergency Money";
            badgeStyle = "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]";
            actionLabel = `Withdraw ₹${Math.round(rec.recommended_amount).toLocaleString("en-IN")} to Checking`;
            ActionIcon = ArrowDownRight;
          } else if (rec.type === "PROTECT_BUFFER" || rec.type === "HOLD_CASH") {
            badgeText = "Keep Cash Ready";
            badgeStyle = "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]";
            actionLabel = "Got It";
            ActionIcon = Check;
          }

          const isLoading = loadingId === rec.id;

          return (
            <div
              key={rec.id}
              className="glass-panel-glow rounded-2xl p-5 relative overflow-hidden transition-all hover:border-[#ff5b45]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${badgeStyle}`}>
                  {badgeText}
                </span>
                <span className="text-[11px] font-bold text-[#ff5b45] font-mono">
                  {Math.round(rec.confidence * 100)}% Match
                </span>
              </div>

              {/* Recommendation title */}
              <h4 className="text-sm font-bold text-[#111827] mb-2 leading-snug">
                {rec.what}
              </h4>

              {/* Reason */}
              <p className="text-xs text-[#4b5563] leading-relaxed mb-3 bg-[#fbfbfa] p-3 rounded-xl border border-[#eae8e3]">
                {rec.why}
              </p>

              {/* Projected impact */}
              <div className="text-[11px] text-[#059669] font-bold mb-3 flex items-center space-x-1.5">
                <span>✨</span>
                <span>{rec.impact}</span>
              </div>

              {/* Actions with Sure-Savings Primary Coral CTA */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#eae8e3]">
                <button
                  onClick={() => handleAction(rec.id, "dismiss")}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-[#6b7280] hover:text-[#111827] bg-[#f3f4f6] rounded-xl transition-all"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleAction(rec.id, "approve")}
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 rounded-xl flex items-center space-x-1.5 shadow-md shadow-[#ff5b45]/30 active:scale-95 transition-all"
                >
                  <ActionIcon className="w-3.5 h-3.5" />
                  <span>{isLoading ? "Updating..." : actionLabel}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
