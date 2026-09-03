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
import { AiDrawer } from "../components/AiDrawer";
import { HowItWorksModal } from "../components/HowItWorksModal";
import { MoneyAllocationCard } from "../components/MoneyAllocationCard";
import { MoneyAllocationModal } from "../components/MoneyAllocationModal";
import {
  PersonaOption,
  UserProfile,
  IncomeAnalytics,
  IncomeForecast,
  BufferStatus,
  ResilienceScore,
  Recommendation,
  Transaction,
  AllocationPlan,
} from "../lib/types";
import { api, setActivePersonaEmail } from "../lib/api";
import { Sparkles, Shield, AlertTriangle, CheckCircle, Info, HelpCircle } from "lucide-react";

export default function DashboardPage() {
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [activePersona, setActivePersona] = useState<PersonaOption | null>(null);

  const [analytics, setAnalytics] = useState<IncomeAnalytics | null>(null);
  const [forecast, setForecast] = useState<IncomeForecast | null>(null);
  const [buffer, setBuffer] = useState<BufferStatus | null>(null);
  const [resilience, setResilience] = useState<ResilienceScore | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allocationPlan, setAllocationPlan] = useState<AllocationPlan | null>(null);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CONTRIBUTION" | "WITHDRAWAL">("CONTRIBUTION");
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [isProMode, setIsProMode] = useState(false);
  const [isAutopilotActive, setIsAutopilotActive] = useState(true);

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

  // Initial load: fetch personas and initial profile
  useEffect(() => {
    async function init() {
      try {
        const personaList = await api.getPersonas();
        setPersonas(personaList);
        if (personaList.length > 0) {
          // Default to Arjun Mehta (Golden Path A)
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

  // Whenever persona changes or refreshes
  const refreshData = async () => {
    try {
      const [an, fc, buf, res, recs, txs, alloc] = await Promise.all([
        api.getIncomeAnalytics(),
        api.getIncomeForecast(),
        api.getBufferStatus(),
        api.getResilienceScore(),
        api.getRecommendations(),
        api.getTransactions(30),
        api.getCurrentAllocationPlan().catch(() => null),
      ]);
      setAnalytics(an);
      setForecast(fc);
      setBuffer(buf);
      setResilience(res);
      setRecommendations(recs);
      setTransactions(txs);
      if (alloc) setAllocationPlan(alloc);
    } catch (e) {
      console.error("Error refreshing dashboard data", e);
    }
  };

  useEffect(() => {
    if (activePersona) {
      setActivePersonaEmail(activePersona.email);
    }
    refreshData();
  }, [activePersona]);

  // Persona switch handler
  const handleSelectPersona = (p: PersonaOption) => {
    setActivePersonaEmail(p.email);
    setActivePersona(p);
    showToast(`Switched persona to ${p.full_name} (${p.persona_name})`);
  };

  // Buffer Simulation Submit
  const handleBufferSubmit = async (amount: number, mode: "CONTRIBUTION" | "WITHDRAWAL") => {
    const res = await api.simulateBuffer(amount, mode);
    showToast(res.message);
    await refreshData();
  };

  // Recommendation Action Handlers
  const handleApproveRecommendation = async (id: number) => {
    const rec = await api.approveRecommendation(id);
    showToast(`Approved: ${rec.what}`);
    await refreshData();
  };

  const handleDismissRecommendation = async (id: number) => {
    await api.dismissRecommendation(id);
    showToast("Recommendation dismissed.");
    await refreshData();
  };

  // Golden Path Demo Triggers
  const triggerDemoPathA = () => {
    const arjun = personas.find((p) => p.email === "arjun@example.com");
    if (arjun) {
      setActivePersonaEmail(arjun.email);
      setActivePersona(arjun);
    }
    setDemoBanner(
      "🌟 Example A Active: Arjun Sharma (Freelancer) had a great week earning ₹15,000! Sure-Savings suggests putting away ₹900 into his emergency cushion without hurting daily cash."
    );
    showToast("Example A Loaded: Arjun Mehta (Freelance UX)");
  };

  const triggerDemoPathB = () => {
    const vikram = personas.find((p) => p.email === "vikram@example.com");
    if (vikram) {
      setActivePersonaEmail(vikram.email);
      setActivePersona(vikram);
    }
    setDemoBanner(
      "🛡️ Example B Active: Vikram Singh (Rideshare Driver) had a slow week earning ₹3,800. Sure-Savings suggests safely using ₹1,200 from his backup savings while keeping his ₹5,000 emergency floor safe for rent."
    );
    showToast("Example B Loaded: Vikram Singh (Rideshare Driver)");
  };

  const triggerDemoPathC = () => {
    const ramesh = personas.find((p) => p.email === "ramesh@example.com");
    if (ramesh) {
      setActivePersonaEmail(ramesh.email);
      setActivePersona(ramesh);
    }
    setDemoBanner(
      "🧱 Example C Active: Ramesh Kumar (Daily-Wage Construction Worker) has a very fragile weekly income (~₹2,100/wk). After monsoon rains stopped site work, his payout dropped to ₹1,000. Sure-Savings guards his ₹1,500 emergency survival floor for rations and shared rent."
    );
    showToast("Example C Loaded: Ramesh Kumar (Construction Worker)");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        personas={personas}
        activePersona={activePersona}
        onSelectPersona={handleSelectPersona}
        onOpenAi={() => setAiDrawerOpen(true)}
        onOpenDemoPathA={triggerDemoPathA}
        onOpenDemoPathB={triggerDemoPathB}
        onOpenDemoPathC={triggerDemoPathC}
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        isProMode={isProMode}
        onToggleProMode={() => setIsProMode(!isProMode)}
        isAutopilotActive={isAutopilotActive}
        onToggleAutopilot={() => handleToggleAutopilot(!isAutopilotActive)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Sure-Savings Banner Strip */}
        <div className="bg-white border border-[#eae8e3] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#fff5f3] border border-[#ffdad4] text-[#ff5b45] flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
              ⚡
            </div>
            <div className="flex flex-col justify-center text-left">
              <span className="text-xs font-bold text-[#111827] leading-snug">Sure-Savings Smart Money Cushion</span>
              <p className="text-[11px] text-[#6b7280] font-normal leading-snug mt-0.5">
                Saves extra money during good weeks and safely covers slow weeks so you can always pay rent and bills on time.
              </p>
            </div>
          </div>
          <button
            onClick={() => setHowItWorksOpen(true)}
            className="text-xs font-bold text-[#ff5b45] hover:text-[#f05138] bg-[#fff5f3] hover:bg-[#ffe8e4] border border-[#ffdad4] px-4 py-2 rounded-xl transition-all whitespace-nowrap shadow-sm self-start sm:self-auto"
          >
            How it works in 60s →
          </button>
        </div>

        {/* Example Scenario Banner if Active */}
        {demoBanner && (
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

        {/* Spending & Income History */}
        <TransactionTable transactions={transactions} />

      </main>

      {/* Footer Trust Ribbon */}
      <footer className="border-t border-[#eae8e3] py-8 text-center text-xs text-[#6b7280] bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#111827] text-sm">Sure-<span className="text-[#ff5b45]">Savings</span></span>
            <span className="text-[#9ca3af]">•</span>
            <span className="text-[#6b7280]">Smart Money Cushion for Freelancers</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#6b7280] font-mono">
            <span className="flex items-center space-x-1">
              <span className="text-emerald-500">●</span>
              <span>100% Floor Protected</span>
            </span>
            <span className="text-[#d1d5db]">|</span>
            <span>Transparent Math</span>
            <span className="text-[#d1d5db]">|</span>
            <span>Zero Predatory Loans</span>
            <span className="text-[#d1d5db]">|</span>
            <span>Safe for Rent & Groceries</span>
          </div>
        </div>
      </footer>

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
