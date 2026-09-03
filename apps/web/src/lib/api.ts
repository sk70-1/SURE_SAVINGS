import {
  UserProfile, PersonaOption, IncomeAnalytics, IncomeForecast,
  BufferStatus, BufferTransaction, ResilienceScore,
  Recommendation, Transaction, NotificationItem, AiExplanationResponse,
  AllocationPlan, AllocationSimulationResult, FinancialGoal
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

let currentActiveEmail = "arjun@example.com";

export function setActivePersonaEmail(email: string) {
  currentActiveEmail = email;
}

export function getActivePersonaEmail(): string {
  return currentActiveEmail;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-User-Email": currentActiveEmail,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
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
  getTransactions: (limit = 30) => fetchApi<Transaction[]>(`/transactions?limit=${limit}`),
  getNotifications: () => fetchApi<NotificationItem[]>("/notifications"),
  chatWithAi: (message: string) =>
    fetchApi<AiExplanationResponse>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  getCurrentAllocationPlan: (incomeAmount?: number) => {
    const query = incomeAmount ? `?income_amount=${incomeAmount}` : "";
    return fetchApi<AllocationPlan>(`/allocation/current${query}`);
  },
  simulateAllocation: (incomeReceived: number, proposedBreakdown: Record<string, number>) =>
    fetchApi<AllocationSimulationResult>("/allocation/simulate", {
      method: "POST",
      body: JSON.stringify({
        income_received: incomeReceived,
        proposed_breakdown: proposedBreakdown,
      }),
    }),
  approveAllocation: (planId: number, customBreakdown?: Record<string, number>) =>
    fetchApi<{
      success: boolean;
      message: string;
      plan_id: number;
      status: string;
      updated_buffer_balance: number;
      audit_log_id: number;
    }>(`/allocation/${planId}/approve`, {
      method: "POST",
      body: JSON.stringify({ custom_breakdown: customBreakdown }),
    }),
  dismissAllocation: (planId: number) =>
    fetchApi<{ success: boolean; message: string }>(`/allocation/${planId}/dismiss`, {
      method: "POST",
    }),
  getAllocationHistory: (limit = 10) =>
    fetchApi<AllocationPlan[]>(`/allocation/history?limit=${limit}`),
  getFinancialGoals: () => fetchApi<FinancialGoal[]>("/allocation/goals"),
};
