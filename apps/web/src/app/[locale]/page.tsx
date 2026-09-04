"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { TodaysMoneyPlanCard } from "@/components/TodaysMoneyPlanCard";
import { SimpleSummaryCards } from "@/components/SimpleSummaryCards";
import { MoneyAllocationCard } from "@/components/MoneyAllocationCard";
import { ResilienceGauge } from "@/components/ResilienceGauge";
import { BufferCard } from "@/components/BufferCard";
import { IncomeAnalyticsCard } from "@/components/IncomeAnalyticsCard";
import { IncomeChart } from "@/components/IncomeChart";
import { RecommendationFeed } from "@/components/RecommendationFeed";
import { TransactionTable } from "@/components/TransactionTable";
import { BufferModal } from "@/components/BufferModal";
import { MoneyAllocationModal } from "@/components/MoneyAllocationModal";
import { AiDrawer } from "@/components/AiDrawer";
import { HowItWorksModal } from "@/components/HowItWorksModal";
import { AuthModal } from "@/components/AuthModal";
import { OnboardingModal } from "@/components/OnboardingModal";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import {
  IncomeAnalytics,
  IncomeForecast,
  BufferStatus,
  ResilienceScore,
  Recommendation,
  Transaction,
  AllocationPlan,
  AuthUser,
  CalendarMonthData,
} from "@/lib/types";
import { api, setAuthToken, getAuthToken, setDemoMode, getIsDemoMode } from "@/lib/api";
import {
  CheckCircle,
  Shield,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sliders,
} from "lucide-react";

export default function DashboardPage() {
  const tDash = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const tNotif = useTranslations("notifications");
  const tCommon = useTranslations("common");

  // Real User Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState<boolean>(false);
  const [addTxModalOpen, setAddTxModalOpen] = useState<boolean>(false);
  const [addTxInitialType, setAddTxInitialType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [isDemo, setIsDemo] = useState<boolean>(false);

  // Financial Analytics & Buffer State
  const [analytics, setAnalytics] = useState<IncomeAnalytics | null>(null);
  const [forecast, setForecast] = useState<IncomeForecast | null>(null);
  const [buffer, setBuffer] = useState<BufferStatus | null>(null);
  const [resilience, setResilience] = useState<ResilienceScore | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allocationPlan, setAllocationPlan] = useState<AllocationPlan | null>(null);
  const [allocationModalOpen, setAllocationModalOpen] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonthData | null>(null);

  // UI Modes & Modals
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"CONTRIBUTION" | "WITHDRAWAL">("CONTRIBUTION");
  const [aiDrawerOpen, setAiDrawerOpen] = useState<boolean>(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState<boolean>(false);
  const [isProMode, setIsProMode] = useState<boolean>(false);
  const [showDetailedSections, setShowDetailedSections] = useState<boolean>(false);
  const [isAutopilotActive, setIsAutopilotActive] = useState<boolean>(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleAutopilot = (active: boolean) => {
    setIsAutopilotActive(active);
    showToast(
      active
        ? `⚡ ${tDash("autopilotActive")}`
        : `⏸️ ${tDash("autopilotPaused")}`
    );
  };

  // Initial load: check auth session & demo flag
  useEffect(() => {
    async function init() {
      setIsDemo(getIsDemoMode());
      const token = getAuthToken();
      if (token) {
        try {
          const me = await api.getMe();
          setCurrentUser(me);
          if (!me.onboarding_completed) {
            setOnboardingModalOpen(true);
          }
        } catch (e) {
          console.warn("Session expired or invalid", e);
          setAuthToken(null);
          setCurrentUser(null);
        }
      }
    }
    init();
  }, []);

  // Fetch / refresh dashboard metrics
  const refreshData = async () => {
    try {
      const now = new Date();
      const [an, fc, buf, res, recs, txs, alloc, cal] = await Promise.all([
        api.getIncomeAnalytics().catch(() => null),
        api.getIncomeForecast().catch(() => null),
        api.getBufferStatus().catch(() => null),
        api.getResilienceScore().catch(() => null),
        api.getRecommendations().catch(() => []),
        api.getTransactions(50).catch(() => []),
        api.getCurrentAllocationPlan().catch(() => null),
        api.getCalendarMonth(now.getFullYear(), now.getMonth() + 1).catch(() => null),
      ]);
      setAnalytics(an);
      setForecast(fc);
      setBuffer(buf);
      setResilience(res);
      setRecommendations(recs || []);
      setTransactions(txs || []);
      if (alloc) setAllocationPlan(alloc);
      if (cal) setCalendarMonth(cal);
    } catch (e) {
      console.error("Error refreshing dashboard data", e);
    }
  };

  // Trigger refresh when user changes or demo changes
  useEffect(() => {
    refreshData();
  }, [currentUser, isDemo]);

  // Handle Demo Mode Switch
  const handleToggleDemoMode = () => {
    if (isDemo) {
      setDemoMode(false);
      setIsDemo(false);
      showToast("Exited demo sandbox. Showing your real account.");
    } else {
      setDemoMode(true, "arjun@example.com");
      setIsDemo(true);
      showToast("Loaded demo sandbox for Arjun Mehta (Freelance UX Designer).");
    }
  };

  // Auth Success Handler
  const handleAuthSuccess = (user: AuthUser, needsOnboarding: boolean) => {
    setCurrentUser(user);
    setDemoMode(false);
    setIsDemo(false);
    showToast(`👋 ${tNotif("loginSuccess")}`);
    if (needsOnboarding) {
      setOnboardingModalOpen(true);
    }
    refreshData();
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await api.logout().catch(() => {});
    } finally {
      setAuthToken(null);
      setCurrentUser(null);
      setDemoMode(false);
      setIsDemo(false);
      showToast(`🔒 ${tNotif("logoutSuccess")}`);
      refreshData();
    }
  };

  // Delete transaction handler
  const handleDeleteTransaction = async (id: number) => {
    try {
      await api.deleteTransaction(id);
      showToast("🗑️ Transaction removed.");
      refreshData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Handle Buffer Deposit / Withdrawal Simulation
  const handleBufferSubmit = async (amount: number, action: "CONTRIBUTION" | "WITHDRAWAL", notes?: string) => {
    try {
      await api.simulateBuffer(amount, action, notes);
      showToast(
        action === "CONTRIBUTION"
          ? `✅ Saved ₹${amount.toLocaleString("en-IN")} into emergency savings.`
          : `🛡️ Drew down ₹${amount.toLocaleString("en-IN")} to safely cover expenses.`
      );
      await refreshData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  // Handle Recommendation Actions
  const handleApproveRecommendation = async (id: number) => {
    try {
      await api.approveRecommendation(id);
      showToast("✅ Recommendation approved and executed in simulation.");
      await refreshData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleDismissRecommendation = async (id: number) => {
    try {
      await api.dismissRecommendation(id);
      showToast("Recommendation dismissed for now.");
      await refreshData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  // Calculate Safe-to-spend cash
  const safeToSpend = useMemo(() => {
    if (allocationPlan) {
      return allocationPlan.breakdown.flexible_spending;
    }
    const income = analytics?.recent_actual_income || 0;
    const essentials = 6000;
    return Math.max(0, income - essentials);
  }, [allocationPlan, analytics]);

  // Extract upcoming bills metrics from calendarMonth
  const { upcomingBillsTotal, nearestBill } = useMemo(() => {
    if (!calendarMonth) {
      return { upcomingBillsTotal: 0, nearestBill: null };
    }
    let total = calendarMonth.summary?.essential_outflows || 0;
    let nearest: { title: string; due_date: string; amount: number; is_covered?: boolean } | null = null;

    for (const day of calendarMonth.days) {
      for (const ev of day.events) {
        if (ev.event_type === "OBLIGATION" || (ev.event_type === "EXPENSE" && ev.is_essential)) {
          if (!nearest) {
            nearest = {
              title: ev.title,
              due_date: day.date,
              amount: ev.amount,
              is_covered: !day.is_risk_day && day.projected_balance >= 0,
            };
          }
        }
      }
    }
    return { upcomingBillsTotal: total, nearestBill: nearest };
  }, [calendarMonth]);

  // Detect True Empty State: user has 0 transactions, 0 buffer balance, and not running demo sandbox
  const isFreshUserEmptyState =
    !isDemo &&
    transactions.length === 0 &&
    (!buffer || buffer.current_balance === 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa] text-[#111827] font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenAi={() => setAiDrawerOpen(true)}
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        isProMode={isProMode}
        onToggleProMode={() => {
          setIsProMode(!isProMode);
          setShowDetailedSections(!isProMode);
        }}
        isAutopilotActive={isAutopilotActive}
        onToggleAutopilot={() => handleToggleAutopilot(!isAutopilotActive)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenAddTransaction={() => {
          setAddTxInitialType("INCOME");
          setAddTxModalOpen(true);
        }}
        isDemoMode={isDemo}
        onToggleDemoMode={handleToggleDemoMode}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner State: Demo Mode Badge vs Authenticated Account vs Guest */}
        {isDemo ? (
          <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <div>
                <span className="text-xs font-black text-[#92400e] uppercase tracking-wider">
                  Demo Sandbox Mode Active
                </span>
                <p className="text-xs text-[#b45309]">
                  Showing sample freelance income and bills for <strong>Arjun Mehta</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleDemoMode}
                className="px-3.5 py-1.5 text-xs font-bold text-[#92400e] bg-white border border-[#fef3c7] hover:bg-[#fff9e6] rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Exit Demo
              </button>
              {!currentUser && (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#ff5b45] hover:bg-[#e04835] rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Create Real Account
                </button>
              )}
            </div>
          </div>
        ) : currentUser ? (
          <div className="bg-white border border-[#eae8e3] rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] flex items-center justify-center font-bold text-sm shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-[#111827]">
                  Personal Account: {currentUser.full_name}
                </span>
                <p className="text-[11px] text-[#6b7280]">
                  Your transactions and financial plan are strictly private.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setAddTxInitialType("INCOME");
                  setAddTxModalOpen(true);
                }}
                className="text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                + {tNav("addTransaction")}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-[#fff5f3] to-[#fffbeb] border border-[#ffdad4] rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff5b45] to-[#f59e0b] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#111827]">
                  {tDash("heroTitle")}
                </h2>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  {tDash("heroSubtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] rounded-xl shadow-sm cursor-pointer"
              >
                {tNav("signIn")}
              </button>
              <button
                onClick={handleToggleDemoMode}
                className="px-3.5 py-2 text-xs font-bold text-[#ff5b45] bg-white border border-[#ffdad4] hover:bg-[#fff0ed] rounded-xl cursor-pointer"
              >
                {tNav("demoUser")}
              </button>
            </div>
          </div>
        )}

        {/* Meaningful Empty State when User has 0 Account Data */}
        {isFreshUserEmptyState ? (
          <div className="bg-white rounded-3xl border border-[#eae8e3] p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#fff5f3] text-[#ff5b45] flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight">
                Let’s build your money plan
              </h2>
              <p className="text-xs sm:text-sm text-[#6b7280] mt-2 max-w-md mx-auto leading-relaxed">
                Add one income payment and one essential expense. We’ll create a safe plan for your next week.
              </p>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setAddTxInitialType("INCOME");
                  setAddTxModalOpen(true);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#059669] to-[#047857] hover:opacity-95 text-white text-xs font-bold rounded-2xl shadow-sm inline-flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ {tCommon("income")}</span>
              </button>

              <button
                onClick={() => {
                  setAddTxInitialType("EXPENSE");
                  setAddTxModalOpen(true);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#fff5f3] hover:bg-[#ffe8e4] text-[#ff5b45] border border-[#ffdad4] text-xs font-bold rounded-2xl shadow-sm inline-flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ {tCommon("expense")}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-[#f3f4f6]">
              <button
                onClick={handleToggleDemoMode}
                className="text-xs font-semibold text-[#6b7280] hover:text-[#111827] underline cursor-pointer"
              >
                Or load Arjun's demo sandbox with sample transactions
              </button>
            </div>
          </div>
        ) : (
          /* Normal Populated Dashboard View */
          <>
            {/* 1. Today's Money Plan Hero Card */}
            <TodaysMoneyPlanCard
              recommendations={recommendations}
              buffer={buffer}
              allocationPlan={allocationPlan}
              analytics={analytics}
              onApproveRecommendation={handleApproveRecommendation}
              onDismissRecommendation={handleDismissRecommendation}
              onOpenDeposit={() => {
                setModalMode("CONTRIBUTION");
                setModalOpen(true);
              }}
              onOpenWithdraw={() => {
                setModalMode("WITHDRAWAL");
                setModalOpen(true);
              }}
              onOpenEditPlan={() => setAllocationModalOpen(true)}
              onOpenAddTransaction={() => {
                setAddTxInitialType("INCOME");
                setAddTxModalOpen(true);
              }}
            />

            {/* 2. Three Simple Summary Cards */}
            <SimpleSummaryCards
              buffer={buffer}
              safeToSpend={safeToSpend}
              upcomingBillsTotal={upcomingBillsTotal}
              nearestBill={nearestBill}
              onOpenDeposit={() => {
                setModalMode("CONTRIBUTION");
                setModalOpen(true);
              }}
              onOpenWithdraw={() => {
                setModalMode("WITHDRAWAL");
                setModalOpen(true);
              }}
            />

            {/* 3. Automatic Money Plan */}
            <MoneyAllocationCard
              plan={allocationPlan}
              isActive={isAutopilotActive}
              onToggleActive={handleToggleAutopilot}
              onOpenReview={() => setAllocationModalOpen(true)}
            />

            {/* 4. Progressive Disclosure: "See Details & History" */}
            <div className="pt-2">
              <button
                onClick={() => setShowDetailedSections(!showDetailedSections)}
                className="w-full py-3.5 px-5 bg-white border border-[#eae8e3] hover:border-[#ffdad4] rounded-3xl text-xs font-bold text-[#4b5563] hover:text-[#111827] shadow-xs flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-[#ff5b45]" />
                  <span>
                    {showDetailedSections
                      ? "Hide detailed metrics, charts & history"
                      : "See detailed analytics, money safety breakdown & history"}
                  </span>
                </div>
                {showDetailedSections ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Detailed Collapsible Area */}
              {showDetailedSections && (
                <div className="mt-6 space-y-6 animate-fadeIn">
                  {/* Detailed Math Cards Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ResilienceGauge resilience={resilience} isProMode={isProMode} />
                    <BufferCard
                      buffer={buffer}
                      isProMode={isProMode}
                      onOpenDeposit={() => {
                        setModalMode("CONTRIBUTION");
                        setModalOpen(true);
                      }}
                      onOpenWithdraw={() => {
                        setModalMode("WITHDRAWAL");
                        setModalOpen(true);
                      }}
                    />
                    <IncomeAnalyticsCard analytics={analytics} isProMode={isProMode} />
                  </div>

                  {/* Interactive Chart & Recommendation Feed Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <IncomeChart
                        transactions={transactions}
                        forecast={forecast}
                        analytics={analytics}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <RecommendationFeed
                        recommendations={recommendations}
                        onApprove={handleApproveRecommendation}
                        onDismiss={handleDismissRecommendation}
                      />
                    </div>
                  </div>

                  {/* Spending & Income History Table */}
                  <TransactionTable
                    transactions={transactions}
                    onDeleteTransaction={currentUser ? handleDeleteTransaction : undefined}
                    onOpenAddTransaction={() => {
                      setAddTxInitialType("INCOME");
                      setAddTxModalOpen(true);
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}

      </main>

      {/* Footer Trust Ribbon */}
      <footer className="border-t border-[#eae8e3] py-8 text-center text-xs text-[#6b7280] bg-white mt-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#111827] text-sm">Sure-<span className="text-[#ff5b45]">Savings</span></span>
            <span className="text-[#9ca3af]">•</span>
            <span className="text-[#6b7280]">{tNav("brandTagline")}</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#6b7280]">
            <span className="flex items-center space-x-1">
              <span className="text-emerald-500">●</span>
              <span>100% Floor Protected</span>
            </span>
            <span className="text-[#d1d5db]">|</span>
            <span>Zero Predatory Debt</span>
            <span className="text-[#d1d5db]">|</span>
            <span>Non-Custodial Simulations</span>
            <span className="text-[#d1d5db]">|</span>
            <span>Strict Account Isolation</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={onboardingModalOpen}
        onClose={() => setOnboardingModalOpen(false)}
        onComplete={() => {
          showToast("🎉 Financial configuration saved!");
          refreshData();
        }}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={addTxModalOpen}
        onClose={() => setAddTxModalOpen(false)}
        initialType={addTxInitialType}
        onTransactionAdded={() => {
          showToast(`✅ ${tNotif("transactionAdded")}`);
          refreshData();
        }}
      />

      {/* Interactive Simulation Modal */}
      <BufferModal
        isOpen={modalOpen}
        mode={modalMode}
        buffer={buffer}
        onClose={() => setModalOpen(false)}
        onSubmit={handleBufferSubmit}
      />

      {/* Money Allocation Simulator Modal */}
      <MoneyAllocationModal
        isOpen={allocationModalOpen}
        plan={allocationPlan}
        onClose={() => setAllocationModalOpen(false)}
        onApproved={refreshData}
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-4 py-3 rounded-2xl border border-white/10 text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
