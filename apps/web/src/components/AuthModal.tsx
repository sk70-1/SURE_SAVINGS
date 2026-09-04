"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Lock, Mail, User, ArrowRight, ShieldCheck } from "lucide-react";
import { api, setAuthToken } from "../lib/api";
import { AuthUser } from "../lib/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser, needsOnboarding: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const t = useTranslations("modals.auth");
  const tCommon = useTranslations("common");

  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("REGISTER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "REGISTER") {
        if (!fullName.trim()) {
          throw new Error("Please enter your full name.");
        }
        const resp = await api.register({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          currency: "INR",
          country: "India",
        });
        setAuthToken(resp.access_token);
        const me: AuthUser = {
          id: resp.user_id,
          email: resp.email,
          full_name: resp.full_name,
          is_active: true,
          is_demo: resp.is_demo,
          onboarding_completed: resp.onboarding_completed,
          currency: resp.currency,
          country: "India",
        };
        onAuthSuccess(me, !resp.onboarding_completed);
      } else {
        const resp = await api.login({
          email: email.trim(),
          password,
        });
        setAuthToken(resp.access_token);
        const me = await api.getMe();
        onAuthSuccess(me, !me.onboarding_completed);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-[#eae8e3] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9ca3af] hover:text-[#111827] p-1.5 rounded-full hover:bg-[#f3f4f6] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <img
            src="/icon.png"
            alt="Sure-Savings"
            className="w-11 h-11 rounded-full shadow-md shrink-0 object-contain"
          />
          <div>
            <h3 className="text-lg font-bold text-[#111827]">
              {mode === "REGISTER" ? t("registerTitle") : t("loginTitle")}
            </h3>
            <p className="text-xs text-[#6b7280]">
              {mode === "REGISTER" ? t("registerSubtitle") : t("loginSubtitle")}
            </p>
          </div>
        </div>

        {/* Toggle Mode Pills */}
        <div className="flex bg-[#f3f4f6] p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("REGISTER");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === "REGISTER"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#6b7280] hover:text-[#111827]"
            }`}
          >
            {t("registerButton")}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("LOGIN");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === "LOGIN"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#6b7280] hover:text-[#111827]"
            }`}
          >
            {t("loginButton")}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#fff1f2] border border-[#fecdd3] text-[#e11d48] text-xs leading-relaxed font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "REGISTER" && (
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                {t("nameLabel")}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#9ca3af] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#fbfbfa] border border-[#eae8e3] rounded-xl focus:outline-none focus:border-[#ff5b45] transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              {t("emailLabel")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9ca3af] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#fbfbfa] border border-[#eae8e3] rounded-xl focus:outline-none focus:border-[#ff5b45] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              {t("passwordLabel")}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9ca3af] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#fbfbfa] border border-[#eae8e3] rounded-xl focus:outline-none focus:border-[#ff5b45] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 rounded-xl shadow-lg shadow-[#ff5b45]/25 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>{tCommon("processing")}</span>
            ) : (
              <>
                <span>{mode === "REGISTER" ? t("registerButton") : t("loginButton")}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#eae8e3] text-center">
          <p className="text-xs text-[#6b7280]">
            🔒 Real accounts are strictly isolated. Your financial ledger is private and protected.
          </p>
        </div>
      </div>
    </div>
  );
};
