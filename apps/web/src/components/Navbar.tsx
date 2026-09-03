"use client";

import React from "react";
import { Sparkles, ChevronDown, HelpCircle, Sliders, ShieldCheck } from "lucide-react";
import { PersonaOption } from "../lib/types";

interface NavbarProps {
  personas: PersonaOption[];
  activePersona: PersonaOption | null;
  onSelectPersona: (p: PersonaOption) => void;
  onOpenAi: () => void;
  onOpenDemoPathA: () => void;
  onOpenDemoPathB: () => void;
  onOpenDemoPathC: () => void;
  onOpenHowItWorks: () => void;
  isProMode: boolean;
  onToggleProMode: () => void;
  isAutopilotActive?: boolean;
  onToggleAutopilot?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  personas,
  activePersona,
  onSelectPersona,
  onOpenAi,
  onOpenDemoPathA,
  onOpenDemoPathB,
  onOpenDemoPathC,
  onOpenHowItWorks,
  isProMode,
  onToggleProMode,
  isAutopilotActive = true,
  onToggleAutopilot,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#eae8e3] bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[4.25rem] py-2.5 flex items-center justify-between gap-4">
        
        {/* Sure-Savings Brand & Subtitle Alignment */}
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

        {/* Quick Demo Dials */}
        <div className="hidden lg:flex items-center space-x-2 bg-[#f6f5f2] p-1 rounded-xl border border-[#eae8e3]">
          <span className="text-[10px] font-bold text-[#6b7280] px-2 uppercase tracking-wider">Try Examples:</span>
          <button
            onClick={onOpenDemoPathA}
            className="px-2 py-1 text-xs font-bold text-[#ff5b45] bg-white hover:bg-[#fff5f3] border border-[#ffdad4] rounded-lg transition-all shadow-sm"
          >
            🚀 High: Freelancer
          </button>
          <button
            onClick={onOpenDemoPathB}
            className="px-2 py-1 text-xs font-bold text-[#d97706] bg-white hover:bg-[#fffbeb] border border-[#fef3c7] rounded-lg transition-all shadow-sm"
          >
            🛡️ Slow: Cab Driver
          </button>
          <button
            onClick={onOpenDemoPathC}
            className="px-2 py-1 text-xs font-bold text-[#059669] bg-white hover:bg-[#ecfdf5] border border-[#a7f3d0] rounded-lg transition-all shadow-sm"
          >
            🧱 Low: Construction Worker
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5">
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

          {/* Persona Switcher */}
          <div className="relative">
            <select
              value={activePersona?.email || ""}
              onChange={(e) => {
                const found = personas.find((p) => p.email === e.target.value);
                if (found) onSelectPersona(found);
              }}
              className="appearance-none bg-white text-xs font-semibold text-[#111827] border border-[#eae8e3] rounded-xl px-3 py-2 pr-7 hover:border-[#ff5b45]/40 focus:outline-none focus:ring-1 focus:ring-[#ff5b45] cursor-pointer shadow-sm"
            >
              {personas.map((p) => (
                <option key={p.id} value={p.email} className="bg-white text-[#111827]">
                  {p.full_name} ({p.persona_name})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6b7280] absolute right-2 top-3 pointer-events-none" />
          </div>

          {/* AI Explainer */}
          <button
            onClick={onOpenAi}
            className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 rounded-xl flex items-center space-x-1.5 shadow-md shadow-[#ff5b45]/30 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            <span className="hidden sm:inline">Ask Assistant</span>
          </button>
        </div>

      </div>
    </header>
  );
};
