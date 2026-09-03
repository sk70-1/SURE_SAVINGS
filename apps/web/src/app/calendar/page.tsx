"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "../../components/Navbar";
import { CalendarSummaryCards } from "../../components/calendar/CalendarSummaryCards";
import { CashFlowCalendar } from "../../components/calendar/CashFlowCalendar";
import { DayInspector } from "../../components/calendar/DayInspector";
import { CashPressureView } from "../../components/calendar/CashPressureView";
import { ObligationModal } from "../../components/calendar/ObligationModal";
import { CalendarEmptyState } from "../../components/calendar/CalendarEmptyState";
import { AddTransactionModal } from "../../components/AddTransactionModal";
import { BufferModal } from "../../components/BufferModal";
import { MoneyAllocationModal } from "../../components/MoneyAllocationModal";
import { AuthModal } from "../../components/AuthModal";
import { AiDrawer } from "../../components/AiDrawer";
import { HowItWorksModal } from "../../components/HowItWorksModal";
import { CsvImportModal } from "../../components/import/CsvImportModal";

import {
  CalendarMonthData,
  CalendarDay,
  CalendarDayDetail,
  CreateObligationPayload,
  UpdateObligationPayload,
  AuthUser,
  BufferStatus,
  AllocationPlan,
} from "../../lib/types";
import { api, getAuthToken, setAuthToken, setDemoMode, getIsDemoMode } from "../../lib/api";

import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  PlusCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCw,
  Sliders,
  ShieldCheck,
  Lock,
  UploadCloud,
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

  // Calendar Data State
  const [monthData, setMonthData] = useState<CalendarMonthData | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [dayDetail, setDayDetail] = useState<CalendarDayDetail | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list" | "pressure">("calendar");

  // Modals & Sub-actions State
  const [addObligationOpen, setAddObligationOpen] = useState(false);
  const [addTxModalOpen, setAddTxModalOpen] = useState(false);
  const [importCsvModalOpen, setImportCsvModalOpen] = useState(false);
  const [bufferModalOpen, setBufferModalOpen] = useState(false);
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
      setError(err.message || "Failed to load cash flow calendar.");
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
    showToast(`Mandate "${payload.title}" created successfully!`);
    await loadMonthData();
  };

  // Handle Demo Mode Persona Load
  const handleActivateDemoMode = async () => {
    setDemoMode(true, "arjun@example.com");
    showToast("Loaded demo sandbox for Arjun Mehta (Freelance UX Designer)!");
    // Set to reference month (September 2026) for immediate demonstration
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
        onOpenImportCsv={() => setImportCsvModalOpen(true)}
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
                You are currently previewing in read-only mode. <strong>Sign in</strong> or activate a demo persona to save scheduled bills and simulate buffer smoothing.
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-3 py-1.5 font-bold text-white bg-[#ff5b45] hover:bg-[#e04835] rounded-xl shadow-xs transition-all"
              >
                Sign In / Register
              </button>
              <button
                onClick={handleActivateDemoMode}
                className="px-3 py-1.5 font-bold text-[#ff5b45] bg-white border border-[#ffdad4] hover:bg-[#fff0ed] rounded-xl transition-all"
              >
                Try Demo Sandbox
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Page Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
                Cash Flow Calendar
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                Deterministic v2.4
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#6b7280] font-medium mt-1">
              See your income rhythm and upcoming financial pressure points before balance crunches occur.
            </p>
          </div>

          {/* Month Selector & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Previous / Next Month Navigation */}
            <div className="flex items-center space-x-1 bg-white border border-[#eae8e3] rounded-xl p-1 shadow-xs">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 text-xs font-black text-[#111827] min-w-[130px] text-center">
                {monthData?.month_name || `${month}/${year}`}
              </span>

              <button
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Today Button */}
            <button
              onClick={handleGoToday}
              className="px-3 py-1.5 text-xs font-bold text-[#4b5563] hover:text-[#111827] bg-white hover:bg-[#f3f4f6] border border-[#eae8e3] rounded-xl shadow-xs transition-all"
            >
              Today
            </button>

            {/* View Mode Toggle: Calendar | List | Cash Pressure */}
            <div className="flex items-center p-1 bg-[#f3f4f6] rounded-xl text-xs font-bold space-x-1">
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === "calendar"
                    ? "bg-white text-[#111827] shadow-xs"
                    : "text-[#6b7280] hover:text-[#111827]"
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-white text-[#111827] shadow-xs"
                    : "text-[#6b7280] hover:text-[#111827]"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("pressure")}
                className={`px-3 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                  viewMode === "pressure"
                    ? "bg-[#fff1f2] text-[#e11d48] shadow-xs border border-[#fecdd3]"
                    : "text-[#6b7280] hover:text-[#111827]"
                }`}
              >
                <span>Cash Pressure</span>
                {monthData?.days.some((d) => d.is_risk_day) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48]" />
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setImportCsvModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#4b5563] hover:text-[#111827] bg-white hover:bg-[#f3f4f6] border border-[#eae8e3] rounded-xl flex items-center space-x-1.5 shadow-2xs transition-all"
              title="Import Statement CSV"
            >
              <UploadCloud className="w-3.5 h-3.5 text-[#059669]" />
              <span className="hidden sm:inline">Import CSV</span>
            </button>

            <button
              onClick={() => setAddObligationOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Bill</span>
            </button>

            <button
              onClick={() => setAddTxModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && !monthData && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 h-24 bg-white/60 rounded-2xl" />
            <div className="h-[450px] bg-white/60 rounded-2xl" />
          </div>
        )}

        {/* Error State with Retry */}
        {error && (
          <div className="p-6 bg-[#fff5f5] border border-[#fecdd3] rounded-2xl text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-[#e11d48] mx-auto" />
            <p className="text-sm font-bold text-[#9f1239]">{error}</p>
            <button
              onClick={loadMonthData}
              className="px-4 py-2 bg-white text-xs font-bold text-[#e11d48] border border-[#fecdd3] rounded-xl hover:bg-[#ffe4e6] inline-flex items-center space-x-1.5"
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
                onOpenImportCsv={() => setImportCsvModalOpen(true)}
                onActivateDemoMode={handleActivateDemoMode}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Main View Area: Calendar Grid or List/Pressure */}
                <div className="lg:col-span-8 space-y-4">
                  {viewMode === "calendar" ? (
                    <CashFlowCalendar
                      data={monthData}
                      selectedDay={selectedDay}
                      onSelectDay={(d) => setSelectedDay(d)}
                    />
                  ) : (
                    <CashPressureView
                      data={monthData}
                      mode={viewMode}
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
          showToast("Transaction recorded successfully!");
          await loadMonthData();
        }}
      />

      {/* CSV Import Statement Modal */}
      <CsvImportModal
        isOpen={importCsvModalOpen}
        onClose={() => setImportCsvModalOpen(false)}
        onImportComplete={async () => {
          showToast("Statement transactions imported successfully!");
          await loadMonthData();
        }}
        currency={monthData?.currency || "INR"}
      />

      {/* Buffer Simulation Modal */}
      <BufferModal
        isOpen={bufferModalOpen}
        onClose={() => setBufferModalOpen(false)}
        mode="WITHDRAWAL"
        buffer={bufferStatus}
        onSubmit={async (amt, m) => {
          await api.simulateBuffer(amt, m, "Calendar liquidity simulation");
          showToast(`Simulated ${m.toLowerCase()} of ₹${amt.toLocaleString("en-IN")}`);
          await loadMonthData();
        }}
      />

      {/* Money Allocation Modal */}
      <MoneyAllocationModal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        plan={allocationPlan}
        onApproved={async () => {
          showToast("Allocation plan approved.");
          await loadMonthData();
        }}
        showToast={showToast}
      />

      {/* AI Assistant Drawer */}
      <AiDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
      />

      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome back, ${user.full_name}!`);
          loadMonthData();
        }}
      />

    </div>
  );
}
