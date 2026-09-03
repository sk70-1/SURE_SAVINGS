"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { ResilienceGauge } from "../components/ResilienceGauge";
import { BufferCard } from "../components/BufferCard";
import { IncomeAnalyticsCard } from "../components/IncomeAnalyticsCard";
import { IncomeChart } from "../components/IncomeChart";
import { RecommendationFeed } from "../components/RecommendationFeed";
import { TransactionTable } from "../components/TransactionTable";
import { BufferModal } from "../components/BufferModal";
import { MoneyAllocationCard } from "../components/MoneyAllocationCard";
import { MoneyAllocationModal } from "../components/MoneyAllocationModal";
import { AiDrawer } from "../components/AiDrawer";
import { HowItWorksModal } from "../components/HowItWorksModal";
import { AuthModal } from "../components/AuthModal";
import { OnboardingModal } from "../components/OnboardingModal";
import { AddTransactionModal } from "../components/AddTransactionModal";
import {
  IncomeAnalytics,
  IncomeForecast,
  BufferStatus,
  ResilienceScore,
  Recommendation,
  Transaction,
  AllocationPlan,
  AuthUser,
} from "../lib/types";
import { api, setAuthToken, getAuthToken } from "../lib/api";
import { CheckCircle, Shield, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  // Real User Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState<boolean>(false);
  const [addTxModalOpen, setAddTxModalOpen] = useState<boolean>(false);

  // Financial Analytics & Buffer State
  const [analytics, setAnalytics] = useState<IncomeAnalytics | null>(null);
  const [forecast, setForecast] = useState<IncomeForecast | null>(null);
  const [buffer, setBuffer] = useState<BufferStatus | null>(null);
  const [resilience, setResilience] = useState<ResilienceScore | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allocationPlan, setAllocationPlan] = useState<AllocationPlan | null>(null);
  const [allocationModalOpen, setAllocationModalOpen] = useState<boolean>(false);

  // UI Modes & Modals
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"CONTRIBUTION" | "WITHDRAWAL">("CONTRIBUTION");
  const [aiDrawerOpen, setAiDrawerOpen] = useState<boolean>(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState<boolean>(false);
  const [isProMode, setIsProMode] = useState<boolean>(false);
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
        ? "⚡ Money Allocation Autopilot Activated"
        : "⏸️ Money Allocation Autopilot Deactivated"
    );
  };

  // Initial load: check auth session
  useEffect(() => {
    async function init() {
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
      const [an, fc, buf, res, recs, txs, alloc] = await Promise.all([
        api.getIncomeAnalytics().catch(() => null),
        api.getIncomeForecast().catch(() => null),
        api.getBufferStatus().catch(() => null),
        api.getResilienceScore().catch(() => null),
        api.getRecommendations().catch(() => []),
        api.getTransactions(50).catch(() => []),
        api.getCurrentAllocationPlan().catch(() => null),
      ]);
      setAnalytics(an);
      setForecast(fc);
      setBuffer(buf);
      setResilience(res);
      setRecommendations(recs || []);
      setTransactions(txs || []);
      if (alloc) setAllocationPlan(alloc);
    } catch (e) {
      console.error("Error refreshing dashboard data", e);
    }
  };

  // Trigger refresh when user changes
  useEffect(() => {
    refreshData();
  }, [currentUser]);

  // Auth Success Handler
  const handleAuthSuccess = (user: AuthUser, needsOnboarding: boolean) => {
    setCurrentUser(user);
    showToast(`👋 Welcome, ${user.full_name}! Account active.`);
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
      showToast("🔒 Logged out successfully.");
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
          ? `✅ Saved ₹${amount.toLocaleString("en-IN")} into smart cushion.`
          : `🛡️ Drew down ₹${amount.toLocaleString("en-IN")} to safely cover shortfall.`
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
      showToast("✅ Recommendation approved.");
      await refreshData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleDismissRecommendation = async (id: number) => {
    try {
      await api.dismissRecommendation(id);
      showToast("Recommendation dismissed.");
      await refreshData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa] text-[#111827]">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenAi={() => setAiDrawerOpen(true)}
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        isProMode={isProMode}
        onToggleProMode={() => setIsProMode(!isProMode)}
        isAutopilotActive={isAutopilotActive}
        onToggleAutopilot={() => handleToggleAutopilot(!isAutopilotActive)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenAddTransaction={() => setAddTxModalOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner State: Logged In vs Welcome */}
        {currentUser ? (
          <div className="bg-white border border-[#eae8e3] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col justify-center text-left">
                <span className="text-xs font-bold text-[#111827] leading-snug">
                  Personal Account: {currentUser.full_name}
                </span>
                <p className="text-[11px] text-[#6b7280] font-normal leading-snug mt-0.5">
                  Your smart income buffer and transactions are strictly private and isolated.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAddTxModalOpen(true)}
              className="text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] px-4 py-2 rounded-xl transition-all whitespace-nowrap shadow-sm self-start sm:self-auto"
            >
              + Record Transaction
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-[#fff5f3] to-[#fffbeb] border border-[#ffdad4] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ff5b45] to-[#f59e0b] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-md shadow-[#ff5b45]/20">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex flex-col justify-center text-left">
                <h2 className="text-sm font-black text-[#111827] leading-snug">
                  Welcome to Sure-Savings — Smart Cushion for Irregular Income
                </h2>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Sign in or create your free account to track payouts, set your protected floor, and enable allocation autopilot.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="text-xs font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap shadow-md shadow-[#ff5b45]/25 self-start sm:self-auto flex items-center space-x-1.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top 3 Core Metrics Grid */}
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

        {/* Money Allocation Autopilot Card */}
        <MoneyAllocationCard
          plan={allocationPlan}
          isActive={isAutopilotActive}
          onToggleActive={handleToggleAutopilot}
          onOpenReview={() => setAllocationModalOpen(true)}
        />

        {/* Interactive Chart + Recommendation Feed Grid */}
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

        {/* Spending & Income History */}
        <TransactionTable
          transactions={transactions}
          onDeleteTransaction={currentUser ? handleDeleteTransaction : undefined}
          onOpenAddTransaction={() => setAddTxModalOpen(true)}
        />

      </main>

      {/* Footer Trust Ribbon */}
      <footer className="border-t border-[#eae8e3] py-8 text-center text-xs text-[#6b7280] bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#111827] text-sm">Sure-<span className="text-[#ff5b45]">Savings</span></span>
            <span className="text-[#9ca3af]">•</span>
            <span className="text-[#6b7280]">Smart Money Cushion for Freelancers & Gig Workers</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#6b7280] font-mono">
            <span className="flex items-center space-x-1">
              <span className="text-emerald-500">●</span>
              <span>100% Floor Protected</span>
            </span>
            <span className="text-[#d1d5db]">|</span>
            <span>Deterministic Math</span>
            <span className="text-[#d1d5db]">|</span>
            <span>Zero Predatory Loans</span>
            <span className="text-[#d1d5db]">|</span>
            <span>Isolated Accounts</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Onboarding Modal (First time configuration) */}
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
        onTransactionAdded={() => {
          showToast("✅ Transaction recorded successfully.");
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

      {/* Money Allocation Autopilot Simulator Modal */}
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
        <div className="fixed bottom-6 right-6 z-50 glass-panel px-4 py-3 rounded-xl border border-brand-500/40 text-xs font-semibold text-white shadow-2xl flex items-center space-x-2 animate-slide-up">
          <CheckCircle className="w-4 h-4 text-brand-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
