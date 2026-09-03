"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "../../components/Navbar";
import { CalendarSummaryCards } from "../../components/calendar/CalendarSummaryCards";
import { CashFlowCalendar } from "../../components/calendar/CashFlowCalendar";
import { DayInspector } from "../../components/calendar/DayInspector";
import { CashPressureView } from "../../components/calendar/CashPressureView";
import { UpcomingBillsListView } from "../../components/calendar/UpcomingBillsListView";
import { ObligationModal } from "../../components/calendar/ObligationModal";
import { CalendarEmptyState } from "../../components/calendar/CalendarEmptyState";
import { AddTransactionModal } from "../../components/AddTransactionModal";
import { BufferModal } from "../../components/BufferModal";
import { MoneyAllocationModal } from "../../components/MoneyAllocationModal";
import { AuthModal } from "../../components/AuthModal";
import { AiDrawer } from "../../components/AiDrawer";
import { HowItWorksModal } from "../../components/HowItWorksModal";

import {
  CalendarMonthData,
  CalendarDay,
  CalendarDayDetail,
  CreateObligationPayload,
  AuthUser,
  BufferStatus,
  AllocationPlan,
} from "../../lib/types";
import { api, getAuthToken, setAuthToken, setDemoMode, getIsDemoMode } from "../../lib/api";

import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Sparkles,
  AlertTriangle,
  RotateCw,
  Lock,
} from "lucide-react";

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [isProMode, setIsProMode] = useState(false);

  // Calendar Data State - Default to "bills" list view per UX requirements
  const [monthData, setMonthData] = useState<CalendarMonthData | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [dayDetail, setDayDetail] = useState<CalendarDayDetail | null>(null);
  const [viewMode, setViewMode] = useState<"bills" | "calendar" | "pressure">("bills");

  // Modals & Sub-actions State
  const [addObligationOpen, setAddObligationOpen] = useState(false);
  const [addTxModalOpen, setAddTxModalOpen] = useState(false);
  const [bufferModalOpen, setBufferModalOpen] = useState(false);
  const [bufferMode, setBufferMode] = useState<"CONTRIBUTION" | "WITHDRAWAL">("CONTRIBUTION");
  const [bufferStatus, setBufferStatus] = useState<BufferStatus | null>(null);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [allocationPlan, setAllocationPlan] = useState<AllocationPlan | null>(null);

  // Loading & Error State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Check auth user session
  useEffect(() => {
    async function checkAuth() {
      const token = getAuthToken();
      if (token) {
        try {
          const me = await api.getMe();
          setCurrentUser(me);
        } catch {
          setAuthToken(null);
          setCurrentUser(null);
        }
      }
    }
    checkAuth();
  }, []);

  // Fetch month calendar data
  const loadMonthData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCalendarMonth(year, month);
      setMonthData(data);

      // Auto-select today or critical gap date or day 1
      if (data.days.length > 0) {
        const todayStr = new Date().toISOString().split("T")[0];
        const matchToday = data.days.find((d) => d.date === todayStr);
        const matchGap = data.summary.critical_gap_date
          ? data.days.find((d) => d.date === data.summary.critical_gap_date)
          : null;
        const initial = matchGap || matchToday || data.days[0];
        setSelectedDay(initial);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load upcoming bills & calendar.");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]);

  // Fetch day inspector detail when selectedDay changes
  useEffect(() => {
    if (!selectedDay) return;
    const targetDate = selectedDay.date;
    async function loadDayDetail() {
      try {
        const detail = await api.getCalendarDay(targetDate);
        setDayDetail(detail);
      } catch (e) {
        console.warn("Error fetching day detail:", e);
      }
    }
    loadDayDetail();
  }, [selectedDay]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth() + 1);
  };

  // Add / Create Obligation
  const handleCreateObligation = async (payload: CreateObligationPayload) => {
    await api.createObligation(payload);
    showToast(`Bill "${payload.title}" scheduled successfully!`);
    await loadMonthData();
  };

  // Handle Demo Mode Persona Load
  const handleActivateDemoMode = async () => {
    setDemoMode(true, "arjun@example.com");
    showToast("Loaded demo sandbox for Arjun Mehta (Freelance UX Designer)!");
    setYear(2026);
    setMonth(9);
    await loadMonthData();
  };

  // Open Buffer Simulator
  const handleOpenBuffer = async () => {
    try {
      const b = await api.getBufferStatus();
      setBufferStatus(b);
      setBufferModalOpen(true);
    } catch {
      setBufferModalOpen(true);
    }
  };

  const hasRiskDays = monthData ? monthData.days.some((d) => d.is_risk_day) : false;

  const isEmptyState =
    monthData &&
    monthData.total_obligations === 0 &&
    monthData.total_transactions === 0;

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#111827] flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        onOpenAi={() => setAiDrawerOpen(true)}
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        isProMode={isProMode}
        onToggleProMode={() => setIsProMode(!isProMode)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={async () => {
          await api.logout().catch(() => {});
          setAuthToken(null);
          setCurrentUser(null);
          showToast("You have been signed out.");
        }}
        onOpenAddTransaction={() => setAddTxModalOpen(true)}
        isDemoMode={getIsDemoMode()}
        onToggleDemoMode={handleActivateDemoMode}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#111827] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-white/10 flex items-center space-x-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-3.5 h-3.5 text-[#ff5b45]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Unauthenticated Banner */}
      {!currentUser && !getIsDemoMode() && (
        <div className="bg-[#fff5f3] border-b border-[#ffdad4] px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-[#9a3412]">
              <Lock className="w-4 h-4 text-[#ff5b45] shrink-0" />
              <span>
                You are currently previewing in read-only mode. <strong>Sign in</strong> or activate a demo persona to save bills and see your personalized safety status.
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-3 py-1.5 font-bold text-white bg-[#ff5b45] hover:bg-[#e04835] rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Sign In / Register
              </button>
              <button
                onClick={handleActivateDemoMode}
                className="px-3 py-1.5 font-bold text-[#ff5b45] bg-white border border-[#ffdad4] hover:bg-[#fff0ed] rounded-xl transition-all cursor-pointer"
              >
                Try Demo Sandbox
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Page Top Header - Cleaned and friendly */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
              Upcoming Bills & Cash Calendar
            </h1>
            <p className="text-xs sm:text-sm text-[#6b7280] font-medium mt-1">
              Track rent and upcoming bills so you know well in advance if your money is covered.
            </p>
          </div>

          {/* Month Selector & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Previous / Next Month Navigation */}
            <div className="flex items-center space-x-1 bg-white border border-[#eae8e3] rounded-2xl p-1 shadow-xs">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-1.5 rounded-xl text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 text-xs font-black text-[#111827] min-w-[130px] text-center">
                {monthData?.month_name || `${month}/${year}`}
              </span>

              <button
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1.5 rounded-xl text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Today Button */}
            <button
              onClick={handleGoToday}
              className="px-3 py-1.5 text-xs font-bold text-[#4b5563] hover:text-[#111827] bg-white hover:bg-[#f3f4f6] border border-[#eae8e3] rounded-2xl shadow-xs transition-all cursor-pointer"
            >
              Today
            </button>

            {/* Primary Action Button: Add Bill */}
            <button
              onClick={() => setAddObligationOpen(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-2xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Bill</span>
            </button>
          </div>
        </div>

        {/* View Mode Toggle Tabs */}
        <div className="flex items-center space-x-2 border-b border-[#eae8e3] pb-3">
          <button
            onClick={() => setViewMode("bills")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "bills"
                ? "bg-[#111827] text-white shadow-xs"
                : "bg-white text-[#6b7280] hover:text-[#111827] border border-[#eae8e3]"
            }`}
          >
            Upcoming Bills List
          </button>

          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "calendar"
                ? "bg-[#111827] text-white shadow-xs"
                : "bg-white text-[#6b7280] hover:text-[#111827] border border-[#eae8e3]"
            }`}
          >
            Monthly Calendar
          </button>

          {/* Money Tightness Tab: ONLY shown if a risk/tightness day is detected */}
          {hasRiskDays && (
            <button
              onClick={() => setViewMode("pressure")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === "pressure"
                  ? "bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3] shadow-xs"
                  : "bg-white text-[#e11d48] hover:bg-[#fff5f5] border border-[#fecdd3]"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Money Tightness</span>
              <span className="w-2 h-2 rounded-full bg-[#e11d48] animate-pulse" />
            </button>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && !monthData && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 h-24 bg-white/60 rounded-3xl" />
            <div className="h-[450px] bg-white/60 rounded-3xl" />
          </div>
        )}

        {/* Error State with Retry */}
        {error && (
          <div className="p-6 bg-[#fff5f5] border border-[#fecdd3] rounded-3xl text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-[#e11d48] mx-auto" />
            <p className="text-sm font-bold text-[#9f1239]">{error}</p>
            <button
              onClick={loadMonthData}
              className="px-4 py-2 bg-white text-xs font-bold text-[#e11d48] border border-[#fecdd3] rounded-xl hover:bg-[#ffe4e6] inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Content Area */}
        {monthData && !loading && (
          <>
            {/* KPI Summary Cards Row */}
            <CalendarSummaryCards
              summary={monthData.summary}
              currency={monthData.currency}
              onOpenBufferModal={handleOpenBuffer}
            />

            {/* Empty State for Fresh User */}
            {isEmptyState ? (
              <CalendarEmptyState
                onOpenAddObligation={() => setAddObligationOpen(true)}
                onOpenAddTransaction={() => setAddTxModalOpen(true)}
                onActivateDemoMode={handleActivateDemoMode}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Main View Area: Default Bills List, Calendar Grid, or Money Tightness */}
                <div className="lg:col-span-8 space-y-4">
                  {viewMode === "bills" && (
                    <UpcomingBillsListView
                      data={monthData}
                      onOpenAddBill={() => setAddObligationOpen(true)}
                      onSelectDay={(d) => setSelectedDay(d)}
                      selectedDay={selectedDay}
                    />
                  )}

                  {viewMode === "calendar" && (
                    <CashFlowCalendar
                      data={monthData}
                      selectedDay={selectedDay}
                      onSelectDay={(d) => setSelectedDay(d)}
                    />
                  )}

                  {viewMode === "pressure" && (
                    <CashPressureView
                      data={monthData}
                      mode="pressure"
                      selectedDay={selectedDay}
                      onSelectDay={(d) => setSelectedDay(d)}
                      onOpenAddObligation={() => setAddObligationOpen(true)}
                    />
                  )}
                </div>

                {/* Right Side Inspector */}
                <div className="lg:col-span-4 sticky top-24">
                  <DayInspector
                    dayDetail={dayDetail}
                    selectedDay={selectedDay}
                    currency={monthData.currency}
                    onOpenBufferModal={handleOpenBuffer}
                    onOpenAllocationModal={() => setAllocationModalOpen(true)}
                  />
                </div>

              </div>
            )}
          </>
        )}

      </main>

      {/* Scheduled Obligation Modal */}
      <ObligationModal
        isOpen={addObligationOpen}
        onClose={() => setAddObligationOpen(false)}
        onSubmit={handleCreateObligation}
        currency={monthData?.currency || "INR"}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={addTxModalOpen}
        onClose={() => setAddTxModalOpen(false)}
        onTransactionAdded={async () => {
          showToast("Transaction saved! Cash flow updated.");
          await loadMonthData();
        }}
      />

      {/* Buffer Simulation Modal */}
      <BufferModal
        isOpen={bufferModalOpen}
        mode={bufferMode}
        onClose={() => setBufferModalOpen(false)}
        buffer={bufferStatus}
        onSubmit={async (amount, action) => {
          await api.simulateBuffer(amount, action);
          showToast(`Buffer ${action.toLowerCase()} recorded.`);
          await loadMonthData();
        }}
      />

      {/* Money Allocation Modal */}
      <MoneyAllocationModal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        plan={allocationPlan}
        onApproved={loadMonthData}
        showToast={showToast}
      />

      {/* Grounded AI Explanation Drawer */}
      <AiDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
      />

      {/* How It Works Explainer Modal */}
      <HowItWorksModal
        isOpen={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />

    </div>
  );
}
