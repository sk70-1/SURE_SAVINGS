export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  persona_name?: string;
  persona_type?: string;
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

export interface FinancialGoal {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  category: string;
  priority: number;
  is_completed: boolean;
}

