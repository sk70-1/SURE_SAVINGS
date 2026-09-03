"use client";

import React, { useState } from "react";
import { Sparkles, Check, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
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
      <div className="bg-white rounded-3xl p-6 border border-[#eae8e3] text-center shadow-sm">
        <ShieldCheck className="w-8 h-8 text-[#059669] mx-auto mb-2 opacity-90" />
        <h4 className="text-sm font-bold text-[#111827]">You're in Great Shape!</h4>
        <p className="text-xs text-[#6b7280] mt-1">
          Your daily spending cash and emergency savings are well balanced.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#ff5b45]" />
          <h3 className="text-sm font-bold text-[#111827]">
            Recommended Actions ({pending.length})
          </h3>
        </div>
        <span className="text-[11px] text-[#6b7280]">Supportive guidance</span>
      </div>

      <div className="space-y-3">
        {pending.map((rec) => {
          const amount = Math.round(rec.recommended_amount);
          let heading = rec.what || `Set aside ₹${amount.toLocaleString("en-IN")}`;
          let whySafe = rec.why || "Your upcoming essential expenses and rent are securely funded.";
          let impact = "You will still have your normal allowance for daily groceries and living expenses.";
          let ctaLabel = `Add ₹${amount.toLocaleString("en-IN")} to emergency savings`;

          if (rec.type === "USE_BUFFER") {
            heading = `Use ₹${amount.toLocaleString("en-IN")} from savings`;
            whySafe = "This week's income is lower than normal. Your emergency savings protect you now.";
            impact = "Keeps all your upcoming bills paid on time with zero debt.";
            ctaLabel = `Use ₹${amount.toLocaleString("en-IN")} from savings`;
          } else if (rec.type === "PROTECT_BUFFER" || rec.type === "HOLD_CASH") {
            heading = "Keep money in your checking account";
            whySafe = "You have essential bills coming due in the next few days.";
            impact = "Ensures your bank account stays safely positive when bills are debited.";
            ctaLabel = "Got it, keeping cash ready";
          }

          const isLoading = loadingId === rec.id;

          return (
            <div
              key={rec.id}
              className="bg-white rounded-3xl p-5 border border-[#eae8e3] hover:border-[#ff5b45]/50 transition-all shadow-sm space-y-3"
            >
              {/* Header with confidence label */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                  Safe Action
                </span>
                <span className="text-[10px] font-medium text-[#6b7280]">
                  How sure we are: <strong className="text-[#111827]">{Math.round(rec.confidence * 100)}%</strong>
                </span>
              </div>

              {/* What to do & Amount */}
              <div>
                <h4 className="text-sm font-black text-[#111827] leading-snug">
                  {heading}
                </h4>
              </div>

              {/* Why it is safe */}
              <div className="bg-[#fbfbfa] p-3 rounded-2xl border border-[#eae8e3] text-xs text-[#4b5563] space-y-1">
                <p><strong>Why:</strong> {whySafe}</p>
                <p className="text-[#059669] font-medium flex items-center space-x-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{impact}</span>
                </p>
              </div>

              {/* Action Buttons: Primary & Not now */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleAction(rec.id, "approve")}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-3 bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleAction(rec.id, "dismiss")}
                  disabled={isLoading}
                  className="py-2.5 px-3 text-xs font-semibold text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] rounded-xl transition-all cursor-pointer"
                >
                  Not now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
