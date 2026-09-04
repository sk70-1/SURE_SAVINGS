export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  persona_name?: string;
  persona_type?: string;
}

export interface FinancialProfile {
  id: number;
  user_id: number;
  persona_name: string;
  persona_type: string;
  pay_frequency: string;
  target_buffer: number;
  minimum_cash_reserve: number;
  minimum_buffer_floor: number;
  essential_weekly_expenses: number;
  policy_limit_ratio: number;
}

export interface PersonaOption {
  id: number;
  email: string;
  full_name: string;
  persona_name: string;
  persona_type: string;
}

export interface IncomeAnalytics {
  stabilized_income: number;
  mean_income: number;
  median_income: number;
  standard_deviation: number;
  coefficient_of_variation: number;
  volatility_rating: "Low" | "Moderate" | "High" | "Extreme";
  recent_actual_income: number;
  income_trend: "Growing" | "Stable" | "Declining";
  formula_explanation: string;
}

export interface ForecastPoint {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

export interface IncomeForecast {
  prediction_date: string;
  expected_income: number;
  lower_bound: number;
  upper_bound: number;
  confidence: number;
  model_name: string;
  forecast_points: ForecastPoint[];
}

export interface BufferStatus {
  current_balance: number;
  target_amount: number;
  minimum_floor: number;
  available_safe_buffer: number;
  buffer_gap: number;
  coverage_weeks: number;
  status: "Healthy" | "Warning" | "Critical";
}

export interface BufferTransaction {
  id: number;
  transaction_type: "CONTRIBUTION" | "WITHDRAWAL";
  amount: number;
  resulting_balance: number;
  notes: string;
  created_at: string;
}

export interface ResilienceScore {
  overall_score: number;
  rating: "Exceptional" | "Strong" | "Moderate" | "Vulnerable" | "Critical";
  income_stability: number;
  buffer_coverage: number;
  expense_health: number;
  cash_flow_health: number;
  breakdown_notes: string[];
}

export interface Recommendation {
  id: number;
  type: string;
  what: string;
  why: string;
  impact: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
  recommended_amount: number;
  status: "PENDING" | "APPROVED" | "DISMISSED";
  created_at: string;
}

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  description: string;
  category: string;
  transaction_type: "INCOME" | "EXPENSE";
  is_essential: boolean;
  source: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AiExplanationResponse {
  reply: string;
  grounded_context: any;
  model_used: string;
}

export interface AllocationBreakdown {
  essentials: number;
  protected_buffer: number;
  upcoming_obligations: number;
  flexible_spending: number;
  goals: number;
  recovery: number;
  total: number;
}

export interface AllocationPlan {
  id: number;
  user_id: number;
  income_amount: number;
  breakdown: AllocationBreakdown;
  reasoning: Record<string, string>;
  risk_level: "SAFE" | "CAUTION" | "UNSAFE";
  resilience_before: number;
  resilience_after: number;
  status: "PENDING" | "APPROVED" | "DISMISSED" | "SIMULATED";
  created_at: string;
  approved_at?: string | null;
}

export interface AllocationSimulationResult {
  is_safe: boolean;
  risk_level: "SAFE" | "CAUTION" | "UNSAFE";
  warnings: string[];
  projected_buffer: number;
  buffer_coverage_weeks: number;
  current_resilience: number;
  projected_resilience: number;
  projected_goal_amount: number;
  projected_goal_percentage: number;
  breakdown: Record<string, number>;
}

export interface AllocationSimulateRequest {
  income_received: number;
  proposed_breakdown: Record<string, number>;
}

export interface AllocationApproveRequest {
  custom_breakdown?: Record<string, number>;
}

export interface FinancialGoal {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  category: string;
  priority: number;
  is_completed: boolean;
}

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_demo: boolean;
  onboarding_completed: boolean;
  currency: string;
  country: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user_id: number;
  email: string;
  full_name: string;
  is_demo: boolean;
  onboarding_completed: boolean;
  currency: string;
}

export interface OnboardingPayload {
  currency: string;
  country: string;
  pay_frequency: string;
  essential_weekly_expenses: number;
  target_buffer: number;
  minimum_buffer_floor: number;
  minimum_cash_reserve: number;
}

export interface CreateTransactionPayload {
  date: string;
  amount: number;
  description: string;
  category: string;
  transaction_type: "INCOME" | "EXPENSE";
  is_essential: boolean;
  source?: string;
}

// --- Scheduled Obligations & Cash Flow Calendar ---
export interface ScheduledObligation {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  category: string;
  due_day?: number | null;
  next_due_date?: string | null;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly" | "once";
  is_essential: boolean;
  is_active: boolean;
  reminder_days_before: number;
  created_at: string;
  updated_at: string;
}

export interface CreateObligationPayload {
  title: string;
  amount: number;
  category?: string;
  due_day?: number | null;
  next_due_date?: string | null;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly" | "once";
  is_essential?: boolean;
  reminder_days_before?: number;
}

export interface UpdateObligationPayload {
  title?: string;
  amount?: number;
  category?: string;
  due_day?: number | null;
  next_due_date?: string | null;
  frequency?: "weekly" | "monthly" | "quarterly" | "yearly" | "once";
  is_essential?: boolean;
  is_active?: boolean;
  reminder_days_before?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  amount: number;
  category: string;
  event_type: "INCOME" | "EXPENSE" | "OBLIGATION" | "FORECAST";
  is_essential: boolean;
  is_forecast: boolean;
  confidence?: number | null;
  obligation_id?: number | null;
  transaction_id?: number | null;
  time_hint?: string | null;
}

export interface CalendarDay {
  date: string; // "YYYY-MM-DD"
  day_number: number;
  day_of_week: string;
  is_current_month: boolean;
  is_today: boolean;
  events: CalendarEvent[];
  total_inflow: number;
  total_outflow: number;
  net_flow: number;
  projected_balance: number;
  is_risk_day: boolean;
  risk_level: "SAFE" | "CAUTION" | "CRITICAL";
  risk_reasons: string[];
  status_label: string;
}

export interface CalendarMonthSummary {
  expected_income: number;
  essential_outflows: number;
  total_outflows: number;
  net_projected: number;
  critical_gap_date?: string | null;
  critical_gap_amount: number;
  critical_gap_reason?: string | null;
  current_buffer_balance: number;
  safe_available_buffer: number;
  minimum_buffer_floor: number;
  minimum_cash_reserve: number;
  projection_fidelity_score: number;
  settled_inflow: number;
  pending_inflow: number;
  exposure_amount: number;
}

export interface CalendarMonthData {
  year: number;
  month: number;
  month_name: string;
  currency: string;
  opening_balance: number;
  opening_balance_source: string;
  days: CalendarDay[];
  summary: CalendarMonthSummary;
  total_obligations: number;
  total_transactions: number;
}

export interface IntradayTimingItem {
  time: string;
  label: string;
  amount: number;
  flow_type: "DEBIT" | "CREDIT";
  running_balance: number;
  is_breach: boolean;
}

export interface CalendarDayDetail {
  date: string;
  day_data: CalendarDay;
  intraday_timeline: IntradayTimingItem[];
  deterministic_diagnosis: string;
  safe_buffer_available: number;
  buffer_floor_safeguard: number;
  buffer_needed: number;
  is_buffer_sufficient: boolean;
  can_smooth_with_buffer: boolean;
}

// --- CSV Statement Import & Categorization ---
export interface CsvPreviewItem {
  row_index: number;
  date: string;
  description: string;
  clean_description: string;
  amount: number;
  transaction_type: "INCOME" | "EXPENSE";
  category: string;
  is_essential: boolean;
  confidence: number;
  is_duplicate: boolean;
  duplicate_reason?: string | null;
  selected: boolean;
}

export interface CsvPreviewResponse {
  total_rows: number;
  valid_rows: number;
  duplicate_rows: number;
  total_inflow: number;
  total_outflow: number;
  items: CsvPreviewItem[];
}

export interface CsvCommitItem {
  date: string;
  description: string;
  amount: number;
  transaction_type: "INCOME" | "EXPENSE";
  category: string;
  is_essential: boolean;
  source?: string;
}

export interface CsvCommitResponse {
  imported_count: number;
  total_inflow: number;
  total_outflow: number;
  message: string;
}

export interface CategoryMetadata {
  id: string;
  label: string;
  is_income: boolean;
  is_essential: boolean;
  color: string;
}

