"use client";

import React from "react";
import {
  Sparkles, HelpCircle, Sliders, ShieldCheck,
  User as UserIcon, LogOut, PlusCircle
} from "lucide-react";
import { AuthUser } from "../lib/types";

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
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#eae8e3] bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[4.25rem] py-2.5 flex items-center justify-between gap-4">
        
        {/* Sure-Savings Brand */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff5b45] to-[#f59e0b] flex items-center justify-center shadow-md shadow-[#ff5b45]/25 shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col justify-center text-left">
            <div className="flex items-center gap-2 leading-none">
              <span className="text-[17px] font-black tracking-tight text-[#111827] font-sans">
                Sure-<span className="text-[#ff5b45]">Savings</span>
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-[#fff5f3] text-[#ff5b45] border border-[#ffdad4]">
                Smart Cushion
              </span>
            </div>
            <p className="text-[11px] text-[#6b7280] font-medium leading-tight mt-1">
              Automated Money Cushion for Freelancers & Gig Workers
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Record Transaction Button */}
          <button
            onClick={currentUser ? onOpenAddTransaction : onOpenAuth}
            className="px-3 py-1.5 text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Transaction</span>
          </button>

          {/* How It Works Button */}
          <button
            onClick={onOpenHowItWorks}
            className="px-2.5 py-1.5 text-xs font-semibold text-[#4b5563] hover:text-[#111827] bg-[#fbfbfa] hover:bg-[#f3f4f6] rounded-xl border border-[#eae8e3] flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#ff5b45]" />
            <span className="hidden sm:inline">How It Works</span>
          </button>

          {/* Simple vs Detailed View Toggle */}
          <button
            onClick={onToggleProMode}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center space-x-1.5 shadow-sm ${
              isProMode
                ? "bg-[#fff5f3] text-[#ff5b45] border-[#ffdad4]"
                : "bg-[#fbfbfa] text-[#6b7280] hover:text-[#111827] border-[#eae8e3]"
            }`}
            title="Toggle between Simple View and Detailed Math View"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isProMode ? "Detailed View" : "Simple View"}</span>
          </button>

          {/* Autopilot Feature Toggle Button */}
          {onToggleAutopilot && (
            <button
              onClick={onToggleAutopilot}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center space-x-1.5 shadow-sm ${
                isAutopilotActive
                  ? "bg-[#fff5f3] text-[#ff5b45] border-[#ffdad4]"
                  : "bg-[#fbfbfa] text-[#9ca3af] hover:text-[#111827] border-[#eae8e3]"
              }`}
              title="Toggle Money Allocation Autopilot Feature ON/OFF"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAutopilotActive ? "text-[#ff5b45]" : "text-[#9ca3af]"}`} />
              <span className="hidden sm:inline">
                Autopilot: {isAutopilotActive ? "ON" : "OFF"}
              </span>
            </button>
          )}

          {/* User Profile / Auth State Button */}
          {currentUser ? (
            <div className="flex items-center space-x-2 pl-1 border-l border-[#eae8e3]">
              <div className="flex items-center space-x-1.5 bg-[#fbfbfa] border border-[#eae8e3] px-2.5 py-1.5 rounded-xl">
                <UserIcon className="w-3.5 h-3.5 text-[#ff5b45]" />
                <span className="text-xs font-bold text-[#111827] max-w-[120px] truncate">
                  {currentUser.full_name}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-[#9ca3af] hover:text-[#e11d48] hover:bg-[#fff1f2] rounded-xl border border-transparent hover:border-[#fecdd3] transition-all"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 rounded-xl shadow-md shadow-[#ff5b45]/20 transition-all"
            >
              Sign In / Register
            </button>
          )}

          {/* AI Assistant */}
          <button
            onClick={onOpenAi}
            className="px-3 py-1.5 text-xs font-bold text-[#4b5563] hover:text-[#111827] bg-[#fbfbfa] hover:bg-[#f3f4f6] rounded-xl border border-[#eae8e3] flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ff5b45]" />
            <span className="hidden sm:inline">Assistant</span>
          </button>
        </div>

      </div>
    </header>
  );
};
