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
  PersonaOption,
  IncomeAnalytics,
  IncomeForecast,
  BufferStatus,
  ResilienceScore,
  Recommendation,
  Transaction,
  AllocationPlan,
  AuthUser,
} from "../lib/types";
import { api, setActivePersonaEmail, setAuthToken, getAuthToken, setDemoMode } from "../lib/api";
import { Sparkles, CheckCircle, FlaskConical, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [activePersona, setActivePersona] = useState<PersonaOption | null>(null);

  // Real User Authentication & Isolation State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
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
  const [demoBanner, setDemoBanner] = useState<string | null>(null);

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

  // Initial load: check auth session & fetch personas
  useEffect(() => {
    async function init() {
      const token = getAuthToken();
      if (token) {
        try {
          const me = await api.getMe();
          setCurrentUser(me);
          setIsDemoMode(false);
          setDemoMode(false);
          if (!me.onboarding_completed) {
            setOnboardingModalOpen(true);
          }
        } catch (e) {
          console.warn("Session expired or invalid, switching to demo mode", e);
          setAuthToken(null);
          setCurrentUser(null);
          setIsDemoMode(true);
          setDemoMode(true);
        }
      } else {
        // No session: default to demo sandbox mode
        setIsDemoMode(true);
        setDemoMode(true);
      }

      try {
        const personaList = await api.getPersonas();
        setPersonas(personaList);
        if (personaList.length > 0) {
          const defaultP = personaList.find((p) => p.email === "arjun@example.com") || personaList[0];
          setActivePersona(defaultP);
          setActivePersonaEmail(defaultP.email);
        }
      } catch (e) {
        console.error("Could not load personas", e);
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

  // Trigger refresh when user, active persona, or demo mode changes
  useEffect(() => {
    refreshData();
  }, [currentUser, activePersona, isDemoMode]);

  // Auth Success Handler
  const handleAuthSuccess = (user: AuthUser, needsOnboarding: boolean) => {
    setCurrentUser(user);
    setIsDemoMode(false);
    setDemoMode(false);
    showToast(`👋 Welcome, ${user.full_name}! Real account active.`);
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
      setIsDemoMode(true);
      setDemoMode(true);
      showToast("🔒 Logged out. Switched to Demo Sandbox.");
      refreshData();
    }
  };

  // Demo Sandbox Toggle Handler
  const handleToggleDemoMode = () => {
    const nextMode = !isDemoMode;
    setIsDemoMode(nextMode);
    setDemoMode(nextMode);
    if (nextMode) {
      showToast("🧪 Switched to Demo Sandbox Mode (Testing Personas).");
    } else if (currentUser) {
      showToast(`👤 Switched to Real Account (${currentUser.full_name}).`);
    } else {
      setAuthModalOpen(true);
    }
    refreshData();
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

  // Golden Path Demo Triggers
  const triggerDemoPathA = () => {
    setIsDemoMode(true);
    setDemoMode(true);
    const arjun = personas.find((p) => p.email === "arjun@example.com");
    if (arjun) {
      setActivePersona(arjun);
      setActivePersonaEmail(arjun.email);
      setDemoBanner("Scenario A: Freelancer Arjun received ₹15,000 surplus. System calculated ₹900 Safe-to-Save cap.");
      showToast("Loaded Scenario A: High-Income Surplus");
    }
  };

  const triggerDemoPathB = () => {
    setIsDemoMode(true);
    setDemoMode(true);
    const vikram = personas.find((p) => p.email === "vikram@example.com");
    if (vikram) {
      setActivePersona(vikram);
      setActivePersonaEmail(vikram.email);
      setDemoBanner("Scenario B: Cab Driver Vikram had a slow week (₹3,800). Protected buffer floor protects rent & food.");
      showToast("Loaded Scenario B: Slow Week & Floor Guard");
    }
  };

  const triggerDemoPathC = () => {
    setIsDemoMode(true);
    setDemoMode(true);
    const ramesh = personas.find((p) => p.email === "ramesh@example.com");
    if (ramesh) {
      setActivePersona(ramesh);
      setActivePersonaEmail(ramesh.email);
      setDemoBanner("Scenario C: Daily-Wage Construction Worker Ramesh (₹1,000/day). Safety-first essential budgeting.");
      showToast("Loaded Scenario C: Low-Income Construction Worker");
    }
  };

  // Handle Buffer Deposit / Withdrawal Simulation
  const handleBufferSubmit = async (amount: number, action: "CONTRIBUTION" | "WITHDRAWAL", notes?: string) => {
    const res = await api.simulateBuffer(amount, action, notes);
    showToast(
      action === "CONTRIBUTION"
        ? `✅ Saved ₹${amount.toLocaleString("en-IN")} into smart cushion.`
        : `🛡️ Drew down ₹${amount.toLocaleString("en-IN")} to safely cover shortfall.`
    );
    await refreshData();
  };

  // Handle Recommendation Action
  const handleApproveRecommendation = async (id: number) => {
    try {
      await api.approveRecommendation(id);
      showToast("✅ Recommendation approved and executed.");
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
        personas={personas}
        activePersona={activePersona}
        onSelectPersona={(p) => {
          setActivePersona(p);
          setActivePersonaEmail(p.email);
        }}
        onOpenAi={() => setAiDrawerOpen(true)}
        onOpenDemoPathA={triggerDemoPathA}
        onOpenDemoPathB={triggerDemoPathB}
        onOpenDemoPathC={triggerDemoPathC}
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        isProMode={isProMode}
        onToggleProMode={() => setIsProMode(!isProMode)}
        isAutopilotActive={isAutopilotActive}
        onToggleAutopilot={() => handleToggleAutopilot(!isAutopilotActive)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenAddTransaction={() => setAddTxModalOpen(true)}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Demo Mode Sandbox Notice Banner */}
        {isDemoMode ? (
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#fde68a] text-[#d97706] flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div className="flex flex-col justify-center text-left">
                <span className="text-xs font-bold text-[#92400e] leading-snug">
                  Demo Sandbox Mode Active ({activePersona?.full_name || "Synthetic Persona"})
                </span>
                <p className="text-[11px] text-[#b45309] font-normal leading-snug mt-0.5">
                  You are viewing pre-seeded practice data. Real money is never moved. Create your private account to start tracking your own finances.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="text-xs font-bold text-white bg-[#d97706] hover:bg-[#b45309] px-4 py-2 rounded-xl transition-all whitespace-nowrap shadow-sm self-start sm:self-auto flex items-center space-x-1.5"
            >
              <span>Create Real Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Real User Active Banner */
          <div className="bg-white border border-[#eae8e3] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                🔒
              </div>
              <div className="flex flex-col justify-center text-left">
                <span className="text-xs font-bold text-[#111827] leading-snug">
                  Personal Account: {currentUser?.full_name}
                </span>
                <p className="text-[11px] text-[#6b7280] font-normal leading-snug mt-0.5">
                  Your transactions and money buffer are strictly private and isolated. All calculations run deterministically on your data.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAddTxModalOpen(true)}
              className="text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] px-4 py-2 rounded-xl transition-all whitespace-nowrap shadow-sm self-start sm:self-auto"
            >
              + Add Transaction
            </button>
          </div>
        )}

        {/* Example Scenario Banner if Active */}
        {demoBanner && isDemoMode && (
          <div className="bg-white p-4 rounded-2xl border-2 border-[#ff5b45]/30 text-xs flex items-start justify-between gap-3 animate-fade-in shadow-md shadow-[#ff5b45]/10">
            <div className="flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 text-[#ff5b45] mt-0.5 shrink-0" />
              <div>
                <strong className="font-bold text-[#111827] block mb-0.5">Example Active</strong>
                <p className="text-[#4b5563] leading-relaxed">{demoBanner}</p>
              </div>
            </div>
            <button
              onClick={() => setDemoBanner(null)}
              className="text-[#6b7280] hover:text-[#111827] text-xs px-2.5 py-1 rounded-lg bg-[#f3f4f6] border border-[#eae8e3] shrink-0 font-semibold"
            >
              Dismiss
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

        {/* Spending & Income History with Add & Delete capabilities */}
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
            <span>Isolated Real Accounts</span>
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
