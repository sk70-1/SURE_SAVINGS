from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# --- Auth & User ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    currency: Optional[str] = "INR"
    country: Optional[str] = "India"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    is_demo: bool = False
    onboarding_completed: bool = False
    currency: str = "INR"


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    is_demo: bool = False
    onboarding_completed: bool = False
    currency: str = "INR"
    country: str = "India"
    created_at: datetime

    class Config:
        from_attributes = True


# --- Onboarding & Financial Profile ---
class OnboardingIn(BaseModel):
    currency: str = "INR"
    country: str = "India"
    pay_frequency: str = "weekly"  # "weekly", "biweekly", "monthly", "irregular"
    essential_weekly_expenses: float = Field(..., gt=0)
    target_buffer: float = Field(..., gt=0)
    minimum_buffer_floor: float = Field(..., ge=0)
    minimum_cash_reserve: float = Field(default=2500.0, ge=0)


class FinancialProfileUpdate(BaseModel):
    persona_name: Optional[str] = None
    persona_type: Optional[str] = None
    pay_frequency: Optional[str] = None
    target_buffer: Optional[float] = None
    minimum_cash_reserve: Optional[float] = None
    minimum_buffer_floor: Optional[float] = None
    essential_weekly_expenses: Optional[float] = None
    policy_limit_ratio: Optional[float] = None


class FinancialProfileOut(BaseModel):
    id: int
    user_id: int
    persona_name: str
    persona_type: str
    pay_frequency: str = "weekly"
    target_buffer: float = 25000.0
    minimum_cash_reserve: float
    minimum_buffer_floor: float
    essential_weekly_expenses: float
    policy_limit_ratio: float

    class Config:
        from_attributes = True


# --- Transactions ---
class TransactionCreate(BaseModel):
    date: datetime
    amount: float = Field(..., gt=0)
    description: str
    category: str
    transaction_type: str = Field(..., pattern="^(INCOME|EXPENSE)$")
    is_essential: bool = False
    source: str = "manual"


class TransactionOut(BaseModel):
    id: int
    date: datetime
    amount: float
    description: str
    category: str
    transaction_type: str
    is_essential: bool
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Income & Analytics ---
class IncomeSummaryOut(BaseModel):
    total_income_trailing_period: float
    average_weekly_income: float
    median_weekly_income: float
    min_weekly_income: float
    max_weekly_income: float
    transaction_count: int
    period_days: int


class IncomeAnalyticsOut(BaseModel):
    stabilized_income: float
    mean_income: float
    median_income: float
    standard_deviation: float
    coefficient_of_variation: float  # Volatility (CV)
    volatility_rating: str  # "Low", "Moderate", "High", "Extreme"
    recent_actual_income: float
    income_trend: str  # "Growing", "Stable", "Declining"
    formula_explanation: str


class IncomeForecastOut(BaseModel):
    prediction_date: str
    expected_income: float
    lower_bound: float
    upper_bound: float
    confidence: float
    model_name: str
    forecast_points: List[Dict[str, Any]]


# --- Buffer & Resilience ---
class BufferStatusOut(BaseModel):
    current_balance: float
    target_amount: float
    minimum_floor: float
    available_safe_buffer: float
    buffer_gap: float
    coverage_weeks: float
    status: str  # "Healthy", "Warning", "Critical"


class BufferTransactionOut(BaseModel):
    id: int
    transaction_type: str
    amount: float
    resulting_balance: float
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True


class BufferSimulateAction(BaseModel):
    amount: float = Field(..., gt=0)
    action: str = Field(..., pattern="^(CONTRIBUTION|WITHDRAWAL)$")
    notes: Optional[str] = "Demo Simulation"


class BufferActionResult(BaseModel):
    success: bool
    message: str
    previous_balance: float
    new_balance: float
    available_safe_buffer: float
    is_floor_protected: bool


class ResilienceScoreOut(BaseModel):
    overall_score: float  # 0 - 100
    rating: str  # "Exceptional", "Strong", "Moderate", "Vulnerable", "Critical"
    income_stability: float
    buffer_coverage: float
    expense_health: float
    cash_flow_health: float
    breakdown_notes: List[str]


# --- Recommendations ---
class RecommendationOut(BaseModel):
    id: int
    type: str
    what: str
    why: str
    impact: str
    priority: str
    confidence: float
    recommended_amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class RecommendationAction(BaseModel):
    action: str = Field(..., pattern="^(APPROVE|DISMISS)$")


# --- Notifications ---
class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- AI Chat ---
class AiChatRequest(BaseModel):
    message: str


class AiChatResponse(BaseModel):
    reply: str
    grounded_context: Dict[str, Any]
    model_used: str


# --- Health ---
class HealthOut(BaseModel):
    status: str
    environment: str
    version: str
    database_connected: bool


# --- Money Allocation Autopilot ---
class AllocationBreakdown(BaseModel):
    essentials: float
    protected_buffer: float
    upcoming_obligations: float
    flexible_spending: float
    goals: float
    recovery: float
    total: float


class AllocationPlanOut(BaseModel):
    id: int
    user_id: int
    income_amount: float
    breakdown: AllocationBreakdown
    reasoning: Dict[str, str]
    risk_level: str  # "SAFE", "CAUTION", "UNSAFE"
    resilience_before: float
    resilience_after: float
    status: str  # "PENDING", "APPROVED", "DISMISSED", "SIMULATED"
    created_at: datetime
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AllocationSimulateIn(BaseModel):
    income_received: float = Field(..., ge=0)
    proposed_breakdown: Dict[str, float]


class AllocationSimulateOut(BaseModel):
    is_safe: bool
    risk_level: str
    warnings: List[str]
    projected_buffer: float
    buffer_coverage_weeks: float
    current_resilience: float
    projected_resilience: float
    projected_goal_amount: float
    projected_goal_percentage: float
    breakdown: Dict[str, float]


class AllocationApproveIn(BaseModel):
    custom_breakdown: Optional[Dict[str, float]] = None


class AllocationApproveOut(BaseModel):
    success: bool
    message: str
    plan_id: int
    status: str
    updated_buffer_balance: float
    audit_log_id: int


class FinancialGoalOut(BaseModel):
    id: int
    title: str
    target_amount: float
    current_amount: float
    category: str
    priority: int
    is_completed: bool

    class Config:
        from_attributes = True

