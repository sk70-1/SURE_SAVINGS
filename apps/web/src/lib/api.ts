import {
  UserProfile, PersonaOption, IncomeAnalytics, IncomeForecast,
  BufferStatus, BufferTransaction, ResilienceScore,
  Recommendation, Transaction, NotificationItem, AiExplanationResponse,
  AllocationPlan, AllocationSimulationResult, FinancialGoal,
  AuthUser, AuthResponse, OnboardingPayload, CreateTransactionPayload
} from "./types";

function getApiBaseUrl(): string {
  let base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  base = base.trim();
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }
  if (!base.endsWith("/api/v1")) {
    base = `${base.replace(/\/+$/, "")}/api/v1`;
  }
  return base;
}

const API_BASE = getApiBaseUrl();

let authToken: string | null = null;
let currentDemoPersonaEmail = "arjun@example.com";
let isDemoModeActive = false;

// Initialize token from localStorage in browser environment
if (typeof window !== "undefined") {
  authToken = localStorage.getItem("sure_savings_token");
  const storedDemo = localStorage.getItem("sure_savings_demo_mode");
  if (storedDemo === "true") {
    isDemoModeActive = true;
  }
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("sure_savings_token", token);
    } else {
      localStorage.removeItem("sure_savings_token");
    }
  }
}

export function getAuthToken(): string | null {
  if (!authToken && typeof window !== "undefined") {
    authToken = localStorage.getItem("sure_savings_token");
  }
  return authToken;
}

export function setDemoMode(active: boolean, demoEmail?: string) {
  isDemoModeActive = active;
  if (demoEmail) {
    currentDemoPersonaEmail = demoEmail;
  }
  if (typeof window !== "undefined") {
    localStorage.setItem("sure_savings_demo_mode", active ? "true" : "false");
  }
}

export function getIsDemoMode(): boolean {
  return isDemoModeActive;
}

export function setActivePersonaEmail(email: string) {
  currentDemoPersonaEmail = email;
}

export function getActivePersonaEmail(): string {
  return currentDemoPersonaEmail;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  const token = getAuthToken();
  if (token) {
    // Primary path: Bearer JWT Token
    headers["Authorization"] = `Bearer ${token}`;
  } else if (isDemoModeActive) {
    // Sandbox Demo mode: explicit demo persona header
    headers["X-Demo-Persona"] = currentDemoPersonaEmail;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // --- Authentication ---
  register: (data: { email: string; password: string; full_name: string; currency?: string; country?: string }) =>
    fetchApi<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    fetchApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    fetchApi<{ message: string }>("/auth/logout", {
      method: "POST",
    }),

  getMe: () => fetchApi<AuthUser>("/auth/me"),

  completeOnboarding: (data: OnboardingPayload) =>
    fetchApi<any>("/auth/onboarding", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // --- Transactions ---
  getTransactions: (limit = 50, type?: string) =>
    fetchApi<Transaction[]>(`/transactions?limit=${limit}${type ? `&transaction_type=${type}` : ""}`),

  createTransaction: (data: CreateTransactionPayload) =>
    fetchApi<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteTransaction: (id: number) =>
    fetchApi<{ message: string }>(`/transactions/${id}`, {
      method: "DELETE",
    }),

  // --- Core Financial Analytics ---
  getPersonas: () => fetchApi<PersonaOption[]>("/users/personas"),
  getProfile: () => fetchApi<UserProfile>("/users/me"),
  getIncomeAnalytics: () => fetchApi<IncomeAnalytics>("/income/analytics"),
  getIncomeForecast: () => fetchApi<IncomeForecast>("/income/forecast"),
  getBufferStatus: () => fetchApi<BufferStatus>("/buffer"),
  getBufferHistory: () => fetchApi<BufferTransaction[]>("/buffer/history"),
  simulateBuffer: (amount: number, action: "CONTRIBUTION" | "WITHDRAWAL", notes?: string) =>
    fetchApi<{
      success: boolean;
      message: string;
      previous_balance: number;
      new_balance: number;
      available_safe_buffer: number;
    }>("/buffer/simulate", {
      method: "POST",
      body: JSON.stringify({ amount, action, notes }),
    }),
  getResilienceScore: () => fetchApi<ResilienceScore>("/resilience/score"),
  getRecommendations: () => fetchApi<Recommendation[]>("/recommendations"),
  approveRecommendation: (id: number) =>
    fetchApi<Recommendation>(`/recommendations/${id}/approve`, { method: "POST" }),
  dismissRecommendation: (id: number) =>
    fetchApi<Recommendation>(`/recommendations/${id}/dismiss`, { method: "POST" }),

  // --- Money Allocation Autopilot ---
  getCurrentAllocationPlan: (incomeOverride?: number) =>
    fetchApi<AllocationPlan>(`/allocation/current${incomeOverride ? `?income_amount=${incomeOverride}` : ""}`),
  simulateAllocation: (proposedOrIncome: any, values?: any) => {
    let payload = proposedOrIncome;
    if (typeof proposedOrIncome === "number" && values) {
      payload = {
        income_amount: proposedOrIncome,
        ...values,
      };
    }
    return fetchApi<AllocationSimulationResult>("/allocation/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  approveAllocation: (planId: number, proposed?: any) =>
    fetchApi<{
      message: string;
      plan_id: number;
      status: string;
      buffer_updated: number;
      resilience_score: number;
    }>(`/allocation/${planId}/approve`, {
      method: "POST",
      body: JSON.stringify(proposed || {}),
    }),
  dismissAllocation: (planId: number) =>
    fetchApi<{ message: string; plan_id: number; status: string }>(`/allocation/${planId}/dismiss`, {
      method: "POST",
    }),
  getAllocationHistory: () => fetchApi<AllocationPlan[]>("/allocation/history"),
  getFinancialGoals: () => fetchApi<FinancialGoal[]>("/allocation/goals"),

  // --- AI Explainer ---
  askAi: (message: string) =>
    fetchApi<AiExplanationResponse>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  chatWithAi: (message: string) =>
    fetchApi<AiExplanationResponse>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  getNotifications: () => fetchApi<NotificationItem[]>("/notifications"),
};
