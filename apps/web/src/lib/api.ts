import {
  UserProfile, PersonaOption, IncomeAnalytics, IncomeForecast,
  BufferStatus, BufferTransaction, ResilienceScore,
  Recommendation, Transaction, NotificationItem, AiExplanationResponse,
  AllocationPlan, AllocationSimulationResult, AllocationSimulateRequest, AllocationApproveRequest, FinancialGoal,
  AuthUser, AuthResponse, OnboardingPayload, CreateTransactionPayload,
  ScheduledObligation, CreateObligationPayload, UpdateObligationPayload,
  CalendarMonthData, CalendarDayDetail,
  CsvPreviewResponse, CsvCommitItem, CsvCommitResponse, CategoryMetadata
} from "./types";

export function getApiBaseUrl(): string {
  // If explicitly configured with non-localhost URL:
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost")) {
    let base = process.env.NEXT_PUBLIC_API_URL.trim();
    // Render fromService sets internal hostname without TLD (e.g. "sure-savings-api-ll73")
    if (!base.includes(".")) {
      base = `${base}.onrender.com`;
    }
    if (!base.startsWith("http://") && !base.startsWith("https://")) {
      base = `https://${base}`;
    }
    if (!base.endsWith("/api/v1")) {
      base = `${base.replace(/\/+$/, "")}/api/v1`;
    }
    return base;
  }

  // When running in the browser on cloud (Render, Vercel, or remote domain):
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (
      host.includes("onrender.com") ||
      host.includes("vercel.app") ||
      (host !== "localhost" && host !== "127.0.0.1")
    ) {
      return "https://sure-savings-api-ll73.onrender.com/api/v1";
    }
  }

  return "http://localhost:8000/api/v1";
}

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
  const base = getApiBaseUrl();
  const url = `${base}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
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
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const errorData = await res.json();
      if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail
          .map((err: any) => {
            const field = Array.isArray(err.loc)
              ? err.loc.filter((p: any) => p !== "body").join(".")
              : (err.loc || "");
            return field ? `${field}: ${err.msg}` : err.msg;
          })
          .join("; ");
      } else if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.detail) {
        errorMessage = JSON.stringify(errorData.detail);
      }
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
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
  simulateAllocation: (
    incomeOrPayload: number | AllocationSimulateRequest,
    proposedBreakdown?: Record<string, number>
  ) => {
    let payload: AllocationSimulateRequest;
    if (typeof incomeOrPayload === "number") {
      payload = {
        income_received: incomeOrPayload,
        proposed_breakdown: proposedBreakdown || {},
      };
    } else if (
      incomeOrPayload &&
      typeof incomeOrPayload === "object" &&
      "proposed_breakdown" in incomeOrPayload
    ) {
      payload = incomeOrPayload as AllocationSimulateRequest;
    } else {
      const raw = incomeOrPayload as any;
      const income = raw?.income_received ?? raw?.income_amount ?? 0;
      const { income_received, income_amount, ...rest } = raw || {};
      payload = {
        income_received: income,
        proposed_breakdown: raw?.proposed_breakdown ?? rest,
      };
    }
    return fetchApi<AllocationSimulationResult>("/allocation/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  approveAllocation: (
    planId: number,
    customBreakdownOrPayload?: Record<string, number> | AllocationApproveRequest
  ) => {
    let payload: AllocationApproveRequest = {};
    if (customBreakdownOrPayload) {
      if ("custom_breakdown" in customBreakdownOrPayload) {
        payload = customBreakdownOrPayload as AllocationApproveRequest;
      } else {
        payload = { custom_breakdown: customBreakdownOrPayload as Record<string, number> };
      }
    }
    return fetchApi<{
      success: boolean;
      status: string;
      plan_id: number;
      message: string;
      buffer_updated?: number;
      resilience_score?: number;
      audit_log_id?: number;
    }>(`/allocation/${planId}/approve`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  dismissAllocation: (planId: number) =>
    fetchApi<{ success: boolean; message: string; plan_id: number; status: string }>(`/allocation/${planId}/dismiss`, {
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

  // --- Cash Flow Calendar & Scheduled Obligations ---
  getCalendarMonth: (year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.append("year", year.toString());
    if (month) params.append("month", month.toString());
    const q = params.toString() ? `?${params.toString()}` : "";
    return fetchApi<CalendarMonthData>(`/calendar/month${q}`);
  },

  getCalendarDay: (date: string) =>
    fetchApi<CalendarDayDetail>(`/calendar/day?date=${date}`),

  getObligations: () => fetchApi<ScheduledObligation[]>("/obligations"),

  createObligation: (data: CreateObligationPayload) =>
    fetchApi<ScheduledObligation>("/obligations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateObligation: (id: number, data: UpdateObligationPayload) =>
    fetchApi<ScheduledObligation>(`/obligations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteObligation: (id: number) =>
    fetchApi<{ message: string }>(`/obligations/${id}`, {
      method: "DELETE",
    }),

  // --- CSV Statement Import & Auto-Categorization ---
  getCategories: () => fetchApi<CategoryMetadata[]>("/transactions/categories"),

  previewCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchApi<CsvPreviewResponse>("/transactions/import/preview", {
      method: "POST",
      body: formData,
    });
  },

  confirmCsv: (items: CsvCommitItem[]) =>
    fetchApi<CsvCommitResponse>("/transactions/import/confirm", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
};
