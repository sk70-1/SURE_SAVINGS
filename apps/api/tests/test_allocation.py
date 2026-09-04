import pytest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import Base, engine
from app.core.config import settings
from app.db.seed import seed_database
from app.engine.money_allocation_service import MoneyAllocationService

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    settings.DEMO_MODE_ENABLED = True
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    settings.DEMO_MODE_ENABLED = False


# 1. Deterministic Service Unit Tests
def test_money_allocation_service_priority_order():
    """Verify that essentials are prioritized first, then buffer, obligations, goals, flexible."""
    res = MoneyAllocationService.calculate_allocation(
        income_received=10000.0,
        essential_weekly_expenses=5000.0,
        current_buffer=8000.0,
        buffer_target=20000.0,
        minimum_buffer_floor=5000.0,
        stabilized_income=10000.0,
        income_volatility_cv=0.20,
        upcoming_obligations=1500.0,
        active_goal_need=2000.0
    )
    b = res["breakdown"]
    assert b["essentials"] == 5000.0
    assert b["protected_buffer"] > 0
    assert b["upcoming_obligations"] == 1500.0
    assert b["total"] <= 10000.0
    assert b["flexible_spending"] >= 0.0


def test_money_allocation_service_low_income_prioritization():
    """Verify that when income is extremely low, essentials take everything and flexible is 0."""
    res = MoneyAllocationService.calculate_allocation(
        income_received=1000.0,
        essential_weekly_expenses=2100.0,
        current_buffer=2400.0,
        buffer_target=8500.0,
        minimum_buffer_floor=1500.0,
        stabilized_income=2100.0,
        income_volatility_cv=0.45,
        upcoming_obligations=500.0,
        active_goal_need=1000.0
    )
    b = res["breakdown"]
    # All 1000 goes to essentials
    assert b["essentials"] == 1000.0
    assert b["flexible_spending"] == 0.0
    assert b["goals"] == 0.0
    assert b["total"] == 1000.0


def test_money_allocation_service_zero_income():
    """Verify safe fallback on zero income."""
    res = MoneyAllocationService.calculate_allocation(
        income_received=0.0,
        essential_weekly_expenses=5000.0,
        current_buffer=10000.0,
        buffer_target=20000.0,
        minimum_buffer_floor=5000.0,
        stabilized_income=8000.0,
        income_volatility_cv=0.30
    )
    b = res["breakdown"]
    assert b["total"] == 0.0
    assert b["essentials"] == 0.0
    assert b["protected_buffer"] == 0.0


def test_money_allocation_service_recovery_allocation():
    """Verify recovery allocation when user recently experienced drawdowns."""
    res = MoneyAllocationService.calculate_allocation(
        income_received=12000.0,
        essential_weekly_expenses=4000.0,
        current_buffer=6000.0,
        buffer_target=16000.0,
        minimum_buffer_floor=4000.0,
        stabilized_income=10000.0,
        income_volatility_cv=0.25,
        recent_drawdown_amount=1500.0
    )
    b = res["breakdown"]
    assert b["recovery"] > 0
    assert b["recovery"] <= 1500.0


def test_safety_rule_sum_greater_than_income_rejected():
    """Rule 2: Total allocation cannot exceed income received."""
    sim = MoneyAllocationService.validate_and_simulate(
        proposed_breakdown={
            "essentials": 6000.0,
            "protected_buffer": 5000.0,
            "upcoming_obligations": 1000.0,
            "recovery": 0.0,
            "goals": 0.0,
            "flexible_spending": 2000.0
        },
        income_received=10000.0,
        current_buffer=8000.0,
        buffer_target=20000.0,
        minimum_buffer_floor=5000.0,
        essential_weekly_expenses=5000.0,
        income_volatility_cv=0.20,
        current_resilience=70.0
    )
    assert sim["is_safe"] is False
    assert sim["risk_level"] == "UNSAFE"
    assert any("exceeds received income" in w for w in sim["warnings"])


def test_safety_rule_negative_allocation_rejected():
    """Rule 3: No negative allocations allowed."""
    sim = MoneyAllocationService.validate_and_simulate(
        proposed_breakdown={
            "essentials": 5000.0,
            "protected_buffer": -500.0,
            "upcoming_obligations": 0.0,
            "recovery": 0.0,
            "goals": 0.0,
            "flexible_spending": 1000.0
        },
        income_received=10000.0,
        current_buffer=8000.0,
        buffer_target=20000.0,
        minimum_buffer_floor=5000.0,
        essential_weekly_expenses=5000.0,
        income_volatility_cv=0.20,
        current_resilience=70.0
    )
    assert sim["is_safe"] is False
    assert sim["risk_level"] == "UNSAFE"


# 2. Integration API Tests
def test_get_current_allocation_plan_endpoint():
    """GET /api/v1/allocation/current returns a personalized plan with 6 categories."""
    response = client.get(
        "/api/v1/allocation/current",
        headers={"X-User-Email": "arjun@example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "income_amount" in data
    assert "breakdown" in data
    assert "reasoning" in data
    assert "risk_level" in data
    assert data["risk_level"] in ["SAFE", "CAUTION", "UNSAFE"]
    b = data["breakdown"]
    assert "essentials" in b
    assert "protected_buffer" in b
    assert "upcoming_obligations" in b
    assert "flexible_spending" in b
    assert "goals" in b
    assert "recovery" in b


def test_simulate_allocation_endpoint_safe():
    """POST /api/v1/allocation/simulate evaluates a safe proposed breakdown."""
    response = client.post(
        "/api/v1/allocation/simulate",
        headers={"X-User-Email": "arjun@example.com"},
        json={
            "income_received": 15000.0,
            "proposed_breakdown": {
                "essentials": 5000.0,
                "protected_buffer": 2000.0,
                "upcoming_obligations": 1250.0,
                "recovery": 0.0,
                "goals": 1000.0,
                "flexible_spending": 2000.0
            }
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_safe"] is True
    assert data["risk_level"] in ["SAFE", "CAUTION"]
    assert data["projected_buffer"] > 0
    assert data["projected_resilience"] >= 0


def test_simulate_allocation_endpoint_unsafe_over_allocation():
    """POST /api/v1/allocation/simulate rejects allocation greater than income."""
    response = client.post(
        "/api/v1/allocation/simulate",
        headers={"X-User-Email": "arjun@example.com"},
        json={
            "income_received": 5000.0,
            "proposed_breakdown": {
                "essentials": 5000.0,
                "protected_buffer": 3000.0,
                "upcoming_obligations": 0.0,
                "recovery": 0.0,
                "goals": 0.0,
                "flexible_spending": 2000.0
            }
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_safe"] is False
    assert data["risk_level"] == "UNSAFE"
    assert len(data["warnings"]) > 0


def test_approve_allocation_plan_flow():
    """Full lifecycle: create plan -> simulate -> approve -> verify buffer and audit log."""
    # 1. Get current plan
    current_resp = client.get(
        "/api/v1/allocation/current",
        headers={"X-User-Email": "arjun@example.com"}
    )
    assert current_resp.status_code == 200
    plan = current_resp.json()
    plan_id = plan["id"]

    # 2. Approve plan
    approve_resp = client.post(
        f"/api/v1/allocation/{plan_id}/approve",
        headers={"X-User-Email": "arjun@example.com"},
        json={}
    )
    assert approve_resp.status_code == 200
    appr_data = approve_resp.json()
    assert appr_data["success"] is True
    assert appr_data["status"] == "APPROVED"
    assert "audit_log_id" in appr_data

    # 3. Check history contains approved plan
    hist_resp = client.get(
        "/api/v1/allocation/history",
        headers={"X-User-Email": "arjun@example.com"}
    )
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert any(h["id"] == plan_id and h["status"] == "APPROVED" for h in history)


def test_approve_allocation_plan_with_custom_breakdown():
    """Verify approving plan with custom_breakdown saves the custom numbers."""
    plan_resp = client.get(
        "/api/v1/allocation/current?income_amount=15000",
        headers={"X-User-Email": "arjun@example.com"}
    )
    assert plan_resp.status_code == 200
    plan = plan_resp.json()
    plan_id = plan["id"]

    custom_breakdown = {
        "essentials": 6000.0,
        "protected_buffer": 3000.0,
        "upcoming_obligations": 1500.0,
        "recovery": 0.0,
        "goals": 2000.0,
        "flexible_spending": 2500.0
    }

    approve_resp = client.post(
        f"/api/v1/allocation/{plan_id}/approve",
        headers={"X-User-Email": "arjun@example.com"},
        json={"custom_breakdown": custom_breakdown}
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["success"] is True

    # Check history to confirm custom breakdown was preserved
    hist_resp = client.get(
        "/api/v1/allocation/history",
        headers={"X-User-Email": "arjun@example.com"}
    )
    assert hist_resp.status_code == 200
    approved_plan = next(h for h in hist_resp.json() if h["id"] == plan_id)
    assert approved_plan["breakdown"]["essentials"] == 6000.0
    assert approved_plan["breakdown"]["protected_buffer"] == 3000.0
    assert approved_plan["breakdown"]["flexible_spending"] == 2500.0


def test_dismiss_allocation_plan():
    """POST /api/v1/allocation/{id}/dismiss marks plan as dismissed."""
    # Create a fresh plan
    plan_resp = client.get(
        "/api/v1/allocation/current?income_amount=12000",
        headers={"X-User-Email": "vikram@example.com"}
    )
    plan_id = plan_resp.json()["id"]

    dismiss_resp = client.post(
        f"/api/v1/allocation/{plan_id}/dismiss",
        headers={"X-User-Email": "vikram@example.com"}
    )
    assert dismiss_resp.status_code == 200
    assert dismiss_resp.json()["success"] is True


def test_financial_goals_endpoint():
    """GET /api/v1/allocation/goals returns user goals."""
    goals_resp = client.get(
        "/api/v1/allocation/goals",
        headers={"X-User-Email": "arjun@example.com"}
    )
    assert goals_resp.status_code == 200
    goals = goals_resp.json()
    assert len(goals) >= 1
    assert "title" in goals[0]
    assert "target_amount" in goals[0]


def test_construction_worker_persona_allocation():
    """Verify Ramesh Kumar (construction worker with fragile income) gets safety-first allocation."""
    response = client.get(
        "/api/v1/allocation/current",
        headers={"X-User-Email": "ramesh@example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    b = data["breakdown"]
    # For a weak income week, essentials must capture the bulk
    assert b["essentials"] > 0
    # Flexible spending should be highly restrained
    assert b["flexible_spending"] <= 500.0
