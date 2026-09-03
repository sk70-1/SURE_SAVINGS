from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=False)
    onboarding_completed = Column(Boolean, default=False)
    currency = Column(String(10), default="INR")
    country = Column(String(50), default="India")
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    profile = relationship("FinancialProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    buffer_account = relationship("BufferAccount", back_populates="user", uselist=False, cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    allocation_plans = relationship("MoneyAllocationPlan", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("FinancialGoal", back_populates="user", cascade="all, delete-orphan")
    obligations = relationship("ScheduledObligation", back_populates="user", cascade="all, delete-orphan")


class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    persona_name = Column(String(100), default="General Earner")
    persona_type = Column(String(50), default="moderate_volatile")
    pay_frequency = Column(String(30), default="weekly")
    target_buffer = Column(Float, default=25000.0)
    minimum_cash_reserve = Column(Float, default=2000.0)  # Unbreakable checking reserve
    minimum_buffer_floor = Column(Float, default=5000.0)  # Unbreakable buffer floor
    essential_weekly_expenses = Column(Float, default=5000.0)
    policy_limit_ratio = Column(Float, default=0.50)  # Max % of surplus saved in single cycle
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="profile")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    date = Column(DateTime, index=True, nullable=False)
    amount = Column(Float, nullable=False)  # Positive for all; transaction_type distinguishes
    description = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # "INCOME" or "EXPENSE"
    is_essential = Column(Boolean, default=False)
    source = Column(String(50), default="manual")  # "csv", "manual", "synthetic"
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="transactions")


class IncomePrediction(Base):
    __tablename__ = "income_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    prediction_date = Column(DateTime, nullable=False)
    predicted_amount = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    confidence = Column(Float, default=0.85)
    model_name = Column(String(50), default="weighted_moving_average")
    created_at = Column(DateTime, default=utcnow)


class BufferAccount(Base):
    __tablename__ = "buffer_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    current_balance = Column(Float, default=0.0)
    target_amount = Column(Float, default=20000.0)  # Default 4 weeks of essential expenses
    minimum_floor = Column(Float, default=5000.0)   # Floor protected from drawdowns
    policy_limit = Column(Float, default=5000.0)    # Maximum single deposit cap
    last_updated = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="buffer_account")
    buffer_transactions = relationship("BufferTransaction", back_populates="buffer_account", cascade="all, delete-orphan")


class BufferTransaction(Base):
    __tablename__ = "buffer_transactions"

    id = Column(Integer, primary_key=True, index=True)
    buffer_account_id = Column(Integer, ForeignKey("buffer_accounts.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    transaction_type = Column(String(30), nullable=False)  # "CONTRIBUTION" or "WITHDRAWAL"
    amount = Column(Float, nullable=False)
    resulting_balance = Column(Float, nullable=False)
    notes = Column(String(255), default="")
    created_at = Column(DateTime, default=utcnow)

    buffer_account = relationship("BufferAccount", back_populates="buffer_transactions")


class ResilienceScore(Base):
    __tablename__ = "resilience_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    score = Column(Float, nullable=False)  # 0 to 100
    income_stability = Column(Float, nullable=False)
    buffer_coverage = Column(Float, nullable=False)
    expense_health = Column(Float, nullable=False)
    cash_flow_health = Column(Float, nullable=False)
    calculated_at = Column(DateTime, default=utcnow)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    type = Column(String(50), nullable=False)  # e.g., SAVE_SURPLUS, USE_BUFFER, PROTECT_BUFFER
    what = Column(String(255), nullable=False)
    why = Column(Text, nullable=False)
    impact = Column(Text, nullable=False)
    priority = Column(String(20), default="MEDIUM")  # "HIGH", "MEDIUM", "LOW"
    confidence = Column(Float, default=0.90)
    recommended_amount = Column(Float, default=0.0)
    status = Column(String(20), default="PENDING")  # "PENDING", "APPROVED", "DISMISSED"
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="recommendations")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    type = Column(String(50), default="INFO")  # "HIGH_INCOME", "LOW_INCOME", "BUFFER_MILESTONE", "RISK_ALERT"
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="notifications")


class AiMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    context_snapshot = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    action = Column(String(100), nullable=False)  # e.g. "SIMULATE_CONTRIBUTION", "WITHDRAWAL"
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="audit_logs")


class FinancialGoal(Base):
    __tablename__ = "financial_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String(150), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    category = Column(String(50), default="EQUIPMENT")  # "EQUIPMENT", "EMERGENCY", "LIFESTYLE", "EDUCATION"
    priority = Column(Integer, default=1)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="goals")


class MoneyAllocationPlan(Base):
    __tablename__ = "money_allocation_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    source_transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    income_amount = Column(Float, nullable=False)
    essential_amount = Column(Float, default=0.0)
    buffer_amount = Column(Float, default=0.0)
    obligation_amount = Column(Float, default=0.0)
    flexible_amount = Column(Float, default=0.0)
    goal_amount = Column(Float, default=0.0)
    recovery_amount = Column(Float, default=0.0)
    status = Column(String(30), default="PENDING")  # "PENDING", "APPROVED", "DISMISSED", "SIMULATED", "EXPIRED"
    reasoning_snapshot = Column(Text, default="{}")
    risk_level = Column(String(20), default="SAFE")  # "SAFE", "CAUTION", "UNSAFE"
    resilience_before = Column(Float, default=0.0)
    resilience_after = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utcnow)
    approved_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="allocation_plans")
    source_transaction = relationship("Transaction")


class ScheduledObligation(Base):
    __tablename__ = "scheduled_obligations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(100), default="bills", nullable=False)
    due_day = Column(Integer, nullable=True)  # 1-31 for monthly bills
    next_due_date = Column(DateTime, nullable=True)
    frequency = Column(String(30), default="monthly", nullable=False)  # "weekly", "monthly", "quarterly", "yearly", "once"
    is_essential = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    reminder_days_before = Column(Integer, default=3, nullable=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="obligations")
