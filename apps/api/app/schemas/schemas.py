from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


# --- Auth & User ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    currency: Optional[str] = "INR"
    country: Optional[str] = "India"

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        from app.core.security import validate_password_strength
        is_valid, error_msg = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v


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
    refresh_token: Optional[str] = None


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
    target_buffer: Optional[float] = Field(None, gt=0)
    minimum_cash_reserve: Optional[float] = Field(None, ge=0)
    minimum_buffer_floor: Optional[float] = Field(None, ge=0)
    essential_weekly_expenses: Optional[float] = Field(None, gt=0)
    policy_limit_ratio: Optional[float] = Field(None, gt=0, le=1.0)

    @model_validator(mode="after")
    def validate_floor_against_target(self) -> "FinancialProfileUpdate":
        if self.minimum_buffer_floor is not None and self.target_buffer is not None:
            if self.minimum_buffer_floor > self.target_buffer:
                raise ValueError("Minimum buffer floor cannot exceed target buffer.")
        return self


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
    audit_log_id: Optional[int] = None


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


# --- Scheduled Obligations & Cash Flow Calendar ---
class ScheduledObligationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    amount: float = Field(..., gt=0)
    category: Optional[str] = "bills"
    due_day: Optional[int] = Field(None, ge=1, le=31)
    next_due_date: Optional[datetime] = None
    frequency: str = Field("monthly", pattern="^(weekly|monthly|quarterly|yearly|once)$")
    is_essential: bool = True
    reminder_days_before: int = Field(3, ge=0, le=30)


class ScheduledObligationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    due_day: Optional[int] = Field(None, ge=1, le=31)
    next_due_date: Optional[datetime] = None
    frequency: Optional[str] = Field(None, pattern="^(weekly|monthly|quarterly|yearly|once)$")
    is_essential: Optional[bool] = None
    is_active: Optional[bool] = None
    reminder_days_before: Optional[int] = Field(None, ge=0, le=30)


class ScheduledObligationOut(BaseModel):
    id: int
    user_id: int
    title: str
    amount: float
    category: str
    due_day: Optional[int] = None
    next_due_date: Optional[datetime] = None
    frequency: str
    is_essential: bool
    is_active: bool
    reminder_days_before: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CalendarEventOut(BaseModel):
    id: str
    title: str
    amount: float
    category: str
    event_type: str  # "INCOME", "EXPENSE", "OBLIGATION", "FORECAST"
    is_essential: bool = False
    is_forecast: bool = False
    confidence: Optional[float] = None
    obligation_id: Optional[int] = None
    transaction_id: Optional[int] = None
    time_hint: Optional[str] = None


class CalendarDayOut(BaseModel):
    date: str  # "YYYY-MM-DD"
    day_number: int
    day_of_week: str  # "Mon", "Tue", etc.
    is_current_month: bool = True
    is_today: bool = False
    events: List[CalendarEventOut] = []
    total_inflow: float = 0.0
    total_outflow: float = 0.0
    net_flow: float = 0.0
    projected_balance: float = 0.0
    is_risk_day: bool = False
    risk_level: str = "SAFE"  # "SAFE", "CAUTION", "CRITICAL"
    risk_reasons: List[str] = []
    status_label: str = "Normal"


class CalendarMonthSummary(BaseModel):
    expected_income: float
    essential_outflows: float
    total_outflows: float
    net_projected: float
    critical_gap_date: Optional[str] = None
    critical_gap_amount: float = 0.0
    critical_gap_reason: Optional[str] = None
    current_buffer_balance: float
    safe_available_buffer: float
    minimum_buffer_floor: float
    minimum_cash_reserve: float
    projection_fidelity_score: float = 94.2
    settled_inflow: float = 0.0
    pending_inflow: float = 0.0
    exposure_amount: float = 0.0


class CalendarMonthOut(BaseModel):
    year: int
    month: int
    month_name: str
    currency: str = "INR"
    opening_balance: float
    opening_balance_source: str
    days: List[CalendarDayOut]
    summary: CalendarMonthSummary
    total_obligations: int
    total_transactions: int


class IntradayTimingItem(BaseModel):
    time: str  # e.g. "09:00 AM"
    label: str
    amount: float
    flow_type: str  # "DEBIT" or "CREDIT"
    running_balance: float
    is_breach: bool = False


class CalendarDayDetailOut(BaseModel):
    date: str
    day_data: CalendarDayOut
    intraday_timeline: List[IntradayTimingItem]
    deterministic_diagnosis: str
    safe_buffer_available: float
    buffer_floor_safeguard: float
    buffer_needed: float
    is_buffer_sufficient: bool
    can_smooth_with_buffer: bool


# --- CSV Statement Import & Categorization ---
class CsvPreviewItem(BaseModel):
    row_index: int
    date: str
    description: str
    clean_description: str
    amount: float
    transaction_type: str  # "INCOME" | "EXPENSE"
    category: str
    is_essential: bool
    confidence: float
    is_duplicate: bool
    duplicate_reason: Optional[str] = None
    selected: bool = True


class CsvPreviewResponse(BaseModel):
    total_rows: int
    valid_rows: int
    duplicate_rows: int
    total_inflow: float
    total_outflow: float
    batch_fingerprint: Optional[str] = None
    items: List[CsvPreviewItem]


class CsvCommitItem(BaseModel):
    date: str
    description: str
    amount: float = Field(..., gt=0)
    transaction_type: str = Field(..., pattern="^(INCOME|EXPENSE)$")
    category: str
    is_essential: bool = False
    source: Optional[str] = "csv_import"


class CsvCommitRequest(BaseModel):
    items: List[CsvCommitItem]


class CsvCommitResponse(BaseModel):
    imported_count: int
    duplicates_skipped: int = 0
    rejected_rows: int = 0
    total_inflow: float
    total_outflow: float
    message: str


class CategoryMetadataOut(BaseModel):
    id: str
    label: str
    is_income: bool
    is_essential: bool
    color: str

