"use client";

import React, { useState, useRef, useEffect } from "react";
import { Link, usePathname } from "../i18n/routing";
import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  PlusCircle,
  CalendarDays,
  LayoutDashboard,
  Menu,
  X,
  HelpCircle,
  Sparkles,
  Sliders,
  LogOut,
  User as UserIcon,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { AuthUser } from "../lib/types";
import { LanguageSelector } from "./LanguageSelector";

interface NavbarProps {
  onOpenAi: () => void;
  onOpenHowItWorks: () => void;
  isProMode: boolean;
  onToggleProMode: () => void;
  isAutopilotActive?: boolean;
  onToggleAutopilot?: () => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAddTransaction: () => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAi,
  onOpenHowItWorks,
  isProMode,
  onToggleProMode,
  isAutopilotActive = true,
  onToggleAutopilot,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenAddTransaction,
  isDemoMode = false,
  onToggleDemoMode,
}) => {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const isDashboard = pathname === "/";
  const isCalendar = pathname === "/calendar";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#eae8e3] bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Brand Logo & Primary Navigation */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer" aria-label="Sure-Savings Home">
            {/* Mobile View: High-res circular icon */}
            <div className="sm:hidden flex items-center">
              <img
                src="/icon.png"
                alt="Sure-Savings"
                className="w-9 h-9 rounded-full shadow-sm group-hover:scale-105 transition-transform object-contain"
              />
            </div>

            {/* Desktop / Tablet View: Official Full Logo Banner */}
            <div className="hidden sm:flex items-center h-10 px-2.5 py-1 bg-[#050b14] rounded-xl border border-slate-800 shadow-sm group-hover:border-emerald-500/50 group-hover:shadow-md transition-all">
              <img
                src="/logo.png"
                alt="Sure-Savings - Smarter Money. Safer Tomorrow."
                className="h-7 w-auto object-contain group-hover:scale-[1.02] transition-transform"
              />
            </div>
          </Link>

          {/* Clean Primary Navigation (Dashboard & Calendar only) */}
          <nav className="flex items-center space-x-1 pl-2 sm:pl-4 border-l border-[#eae8e3]">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                isDashboard
                  ? "bg-[#fff5f3] text-[#ff5b45] border border-[#ffdad4]"
                  : "text-[#4b5563] hover:text-[#111827] hover:bg-[#fbfbfa]"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t("dashboard")}</span>
            </Link>

            <Link
              href="/calendar"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                isCalendar
                  ? "bg-[#fff5f3] text-[#ff5b45] border border-[#ffdad4]"
                  : "text-[#4b5563] hover:text-[#111827] hover:bg-[#fbfbfa]"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{t("upcomingBills")}</span>
            </Link>
          </nav>
        </div>

        {/* Right: Language Selector, "+ Add Transaction", Profile / Menu */}
        <div className="flex items-center space-x-2" ref={menuRef}>
          {/* Multilingual Language Switcher */}
          <LanguageSelector />

          {/* Primary Action: Add Transaction */}
          <button
            onClick={currentUser || isDemoMode ? onOpenAddTransaction : onOpenAuth}
            className="px-3.5 py-2 text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t("addTransaction")}</span>
            <span className="sm:hidden">{t("add")}</span>
          </button>

          {/* Profile / Menu Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="px-2.5 py-2 text-xs font-semibold text-[#374151] hover:text-[#111827] bg-[#fbfbfa] hover:bg-[#f3f4f6] rounded-xl border border-[#eae8e3] flex items-center space-x-2 transition-all cursor-pointer"
              aria-label="Profile and settings menu"
            >
              {currentUser ? (
                <div className="flex items-center space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#ffdad4] text-[#ff5b45] flex items-center justify-center font-bold text-[10px]">
                    {currentUser.full_name?.charAt(0) || "U"}
                  </div>
                  <span className="hidden md:inline font-bold text-xs max-w-[100px] truncate">
                    {currentUser.full_name}
                  </span>
                </div>
              ) : isDemoMode ? (
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="hidden md:inline font-bold text-xs text-amber-700">{t("demoUser")}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-[#6b7280]">
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden md:inline text-xs font-bold">{t("signIn")}</span>
                </div>
              )}
              {menuOpen ? <X className="w-3.5 h-3.5 text-[#6b7280]" /> : <Menu className="w-3.5 h-3.5 text-[#6b7280]" />}
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#eae8e3] rounded-2xl shadow-xl p-2 z-50 animate-fadeIn space-y-1">
                {/* User Info Header */}
                <div className="px-3 py-2 border-b border-[#f3f4f6] mb-1">
                  {currentUser ? (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">{t("loggedInAs")}</span>
                      <p className="text-xs font-bold text-[#111827] truncate">{currentUser.full_name}</p>
                      <p className="text-[11px] text-[#6b7280] truncate">{currentUser.email}</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-[#111827]">{t("welcomeTitle")}</span>
                      <p className="text-[11px] text-[#6b7280]">{t("welcomeSubtitle")}</p>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenAuth();
                        }}
                        className="mt-2 w-full py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] rounded-xl cursor-pointer"
                      >
                        {t("signInRegister")}
                      </button>
                    </div>
                  )}
                </div>

                {/* How it works */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenHowItWorks();
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-[#374151] hover:text-[#111827] hover:bg-[#fbfbfa] rounded-xl flex items-center space-x-2.5 transition-colors cursor-pointer text-left"
                >
                  <HelpCircle className="w-4 h-4 text-[#ff5b45]" />
                  <span>{t("howItWorks")}</span>
                </button>

                {/* AI Assistant */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenAi();
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-[#374151] hover:text-[#111827] hover:bg-[#fbfbfa] rounded-xl flex items-center space-x-2.5 transition-colors cursor-pointer text-left"
                >
                  <Sparkles className="w-4 h-4 text-[#ff5b45]" />
                  <span>{t("liveAiTitle")}</span>
                </button>

                {/* Toggle: Detailed vs Simple View */}
                <button
                  onClick={onToggleProMode}
                  className="w-full px-3 py-2 text-xs font-medium text-[#374151] hover:text-[#111827] hover:bg-[#fbfbfa] rounded-xl flex items-center justify-between transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-2.5">
                    <Sliders className="w-4 h-4 text-[#6b7280]" />
                    <span>{isProMode ? "Pro Mode" : "Simple Mode"}</span>
                  </div>
                  {isProMode ? (
                    <ToggleRight className="w-5 h-5 text-[#ff5b45]" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-[#9ca3af]" />
                  )}
                </button>

                {/* Toggle: Automatic Money Plan */}
                {onToggleAutopilot && (
                  <button
                    onClick={onToggleAutopilot}
                    className="w-full px-3 py-2 text-xs font-medium text-[#374151] hover:text-[#111827] hover:bg-[#fbfbfa] rounded-xl flex items-center justify-between transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Sparkles className="w-4 h-4 text-[#059669]" />
                      <span>{t("autoSaveTitle")}</span>
                    </div>
                    {isAutopilotActive ? (
                      <ToggleRight className="w-5 h-5 text-[#059669]" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-[#9ca3af]" />
                    )}
                  </button>
                )}

                {/* Demo Sandbox Mode Switch */}
                {onToggleDemoMode && (
                  <button
                    onClick={() => {
                      onToggleDemoMode();
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-xs font-medium text-[#374151] hover:text-[#111827] hover:bg-[#fbfbfa] rounded-xl flex items-center justify-between transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${isDemoMode ? "bg-amber-500" : "bg-gray-300"}`} />
                      <span>Demo Sandbox</span>
                    </div>
                    <span className="text-[10px] text-[#6b7280] font-bold">
                      {isDemoMode ? "ON" : "OFF"}
                    </span>
                  </button>
                )}

                {/* Sign Out Button */}
                {currentUser && (
                  <div className="pt-1 border-t border-[#f3f4f6]">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3 py-2 text-xs font-bold text-[#e11d48] hover:bg-[#fff1f2] rounded-xl flex items-center space-x-2.5 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t("logOut")}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
