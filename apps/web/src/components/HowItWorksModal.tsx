"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { X, Lock } from "lucide-react";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("modals.howItWorks");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-[#eae8e3] shadow-2xl relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-[#9ca3af] hover:text-[#111827] bg-[#f9fafb] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-[#fff5f3] text-[#ff5b45] border border-[#ffdad4] uppercase tracking-wider">
              {t("simpleGuide")}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#111827] mt-2 font-sans">
            {t("title")}
          </h2>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-1">
            {t("audienceSubtitle")}
          </p>
        </div>

        {/* 4 Step Flow */}
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="bg-[#fbfbfa] p-4 rounded-2xl border border-[#eae8e3] flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#fff5f3] border border-[#ffdad4] flex items-center justify-center shrink-0 text-[#ff5b45] font-black text-sm font-mono">
              01
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111827]">{t("step1Title")}</h4>
              <p className="text-xs text-[#6b7280] mt-0.5 leading-relaxed">
                {t("step1Desc")}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#fbfbfa] p-4 rounded-2xl border border-[#eae8e3] flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#fffbeb] border border-[#fef3c7] flex items-center justify-center shrink-0 text-[#d97706] font-black text-sm font-mono">
              02
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111827]">{t("step2Title")}</h4>
              <p className="text-xs text-[#6b7280] mt-0.5 leading-relaxed">
                {t("step2Desc")}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#fbfbfa] p-4 rounded-2xl border border-[#eae8e3] flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center shrink-0 text-[#059669] font-black text-sm font-mono">
              03
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111827]">{t("step3Title")}</h4>
              <p className="text-xs text-[#6b7280] mt-0.5 leading-relaxed">
                {t("step3Desc")}
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-[#fbfbfa] p-4 rounded-2xl border border-[#eae8e3] flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#f5f3ff] border border-[#ddd6fe] flex items-center justify-center shrink-0 text-[#7c3aed] font-black text-sm font-mono">
              04
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111827]">{t("step4Title")}</h4>
              <p className="text-xs text-[#6b7280] mt-0.5 leading-relaxed">
                {t("step4Desc")}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#eae8e3] flex items-center justify-between">
          <span className="text-[11px] text-[#6b7280] flex items-center space-x-1 font-mono">
            <Lock className="w-3.5 h-3.5 text-[#d97706]" />
            <span>{t("securityBadge")}</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 rounded-xl shadow-md shadow-[#ff5b45]/30 transition-all active:scale-95 cursor-pointer"
          >
            {t("gotIt")}
          </button>
        </div>

      </div>
    </div>
  );
};
