import pytest
import sys
import os
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.api.deps import get_db
from app.core.database import Base
from app.core.security import create_access_token, hash_password
from app.models.models import (
    User, FinancialProfile, BufferAccount, Transaction, ScheduledObligation
)
from app.engine.cash_flow_calendar_service import CashFlowCalendarService

# In-memory SQLite with StaticPool for test isolation
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture(scope="module")
def seeded_users():
    db = TestingSession()

    # User 1: Has profile, buffer, obligations, transactions
    u1 = User(
        email="cal_user1@example.com",
        hashed_password=hash_password("Pass1234!"),
        full_name="User Calendar One",
        currency="INR",
        country="India",
        is_active=True,
        onboarding_completed=True
    )
    # User 2: Fresh user, no history
    u2 = User(
        email="cal_user2@example.com",
        hashed_password=hash_password("Pass1234!"),
        full_name="User Calendar Two",
        currency="INR",
        country="India",
        is_active=True,
        onboarding_completed=False
    )
    db.add_all([u1, u2])
    db.commit()
    db.refresh(u1)
    db.refresh(u2)

    # U1 Profile & Buffer
    p1 = FinancialProfile(
        user_id=u1.id,
        persona_name="Freelance Designer",
        minimum_cash_reserve=3000.0,
        minimum_buffer_floor=5000.0,
        target_buffer=20000.0,
        essential_weekly_expenses=5000.0
    )
    b1 = BufferAccount(
        user_id=u1.id,
        current_balance=8500.0,  # 8500 - 5000 = 3500 safe available buffer
        target_amount=20000.0,
        minimum_floor=5000.0
    )
    # U1 Obligations: Monthly Bike EMI and Weekly Grocery
    obl1 = ScheduledObligation(
        user_id=u1.id,
        title="Bike EV EMI",
        amount=6500.0,
        category="loan",
        due_day=10,
        frequency="monthly",
        is_essential=True
    )
    obl2 = ScheduledObligation(
        user_id=u1.id,
        title="Weekly Maintenance",
        amount=1000.0,
        category="bills",
        due_day=None,
        next_due_date=datetime(2026, 9, 3, 10, 0, tzinfo=timezone.utc),  # Thursday
        frequency="weekly",
        is_essential=False
    )
    # U1 Transactions in Sep 2026
    tx1 = Transaction(
        user_id=u1.id,
        date=datetime(2026, 9, 3, 18, 0, tzinfo=timezone.utc),
        amount=8000.0,
        description="Client Payout Alpha",
        category="freelance_income",
        transaction_type="INCOME",
        is_essential=False
    )
    tx2 = Transaction(
        user_id=u1.id,
        date=datetime(2026, 9, 6, 12, 0, tzinfo=timezone.utc),
        amount=2500.0,
        description="Studio Rent Share",
        category="rent",
        transaction_type="EXPENSE",
        is_essential=True
    )

    db.add_all([p1, b1, obl1, obl2, tx1, tx2])
    db.commit()
    db.refresh(obl1)

    u1_id = u1.id
    u2_id = u2.id
    obl1_id = obl1.id

    token1 = create_access_token(u1_id)
    token2 = create_access_token(u2_id)

    db.close()
    return {
        "u1_id": u1_id,
        "u2_id": u2_id,
        "token1": token1,
        "token2": token2,
        "obl1_id": obl1_id
    }


def test_authentication_required(client):
    """Calendar and obligations require authentication."""
    res1 = client.get("/api/v1/calendar/month?year=2026&month=9")
    assert res1.status_code == 401

    res2 = client.get("/api/v1/obligations")
    assert res2.status_code == 401

    res3 = client.post("/api/v1/obligations", json={
        "title": "Unauthorized Bill",
        "amount": 500.0,
        "frequency": "monthly"
    })
    assert res3.status_code == 401


def test_cross_user_isolation(client, seeded_users):
    """User 2 must be denied access/modification to User 1's obligations."""
    headers_u2 = {"Authorization": f"Bearer {seeded_users['token2']}"}
    obl1_id = seeded_users["obl1_id"]

    # User 2 tries to PATCH User 1's obligation
    res_patch = client.patch(f"/api/v1/obligations/{obl1_id}", json={
        "amount": 9999.0
    }, headers=headers_u2)
    assert res_patch.status_code == 404

    # User 2 tries to DELETE User 1's obligation
    res_del = client.delete(f"/api/v1/obligations/{obl1_id}", headers=headers_u2)
    assert res_del.status_code == 404

    # User 2's obligation list should NOT include User 1's obligations
    res_list = client.get("/api/v1/obligations", headers=headers_u2)
    assert res_list.status_code == 200
    assert len(res_list.json()) == 0


def test_recurrence_expansion_weekly_and_monthly():
    """Unit test: CashFlowCalendarService expands weekly and monthly obligations accurately."""
    obl_monthly = ScheduledObligation(
        id=1,
        user_id=10,
        title="Monthly Bill",
        amount=5000.0,
        category="loan",
        due_day=15,
        frequency="monthly",
        is_essential=True,
        is_active=True
    )
    # September 2026 starts on Tuesday (Sep 1)
    # Sep 3, 10, 17, 24 are Thursdays (4 occurrences)
    obl_weekly = ScheduledObligation(
        id=2,
        user_id=10,
        title="Weekly Bill",
        amount=1000.0,
        category="bills",
        due_day=None,
        next_due_date=datetime(2026, 9, 3, 10, 0),
        frequency="weekly",
        is_essential=True,
        is_active=True
    )

    expanded = CashFlowCalendarService.expand_obligations_for_month([obl_monthly, obl_weekly], 2026, 9)
    monthly_events = [e for e in expanded if e["obligation_id"] == 1]
    weekly_events = [e for e in expanded if e["obligation_id"] == 2]

    assert len(monthly_events) == 1
    assert monthly_events[0]["date"] == "2026-09-15"

    assert len(weekly_events) == 4
    dates = [e["date"] for e in weekly_events]
    assert "2026-09-03" in dates
    assert "2026-09-10" in dates
    assert "2026-09-17" in dates
    assert "2026-09-24" in dates


def test_month_projection_and_summary_correctness(client, seeded_users):
    """Test GET /api/v1/calendar/month calculates correct totals and detects risk days."""
    headers_u1 = {"Authorization": f"Bearer {seeded_users['token1']}"}
    res = client.get("/api/v1/calendar/month?year=2026&month=9", headers=headers_u1)
    assert res.status_code == 200
    data = res.json()

    assert data["year"] == 2026
    assert data["month"] == 9
    assert len(data["days"]) == 30

    summary = data["summary"]
    # Check buffer safety values
    assert summary["current_buffer_balance"] == 8500.0
    assert summary["minimum_buffer_floor"] == 5000.0
    # Safe available buffer = 8500 - 5000 = 3500.0
    assert summary["safe_available_buffer"] == 3500.0
    assert summary["minimum_cash_reserve"] == 3000.0

    # Sep 10 has the 6500 EMI debit and 1000 weekly debit, so outflow on Sep 10 is at least 7500
    sep10 = next((d for d in data["days"] if d["date"] == "2026-09-10"), None)
    assert sep10 is not None
    assert sep10["total_outflow"] >= 7500.0

    # Risk detection should flag when projected balance falls below 3000 reserve
    risk_days = [d for d in data["days"] if d["is_risk_day"]]
    assert len(risk_days) > 0
    assert summary["critical_gap_date"] is not None


def test_day_detail_inspector_and_intraday_timing(client, seeded_users):
    """Test GET /api/v1/calendar/day returns intraday timeline and deterministic diagnosis."""
    headers_u1 = {"Authorization": f"Bearer {seeded_users['token1']}"}
    res = client.get("/api/v1/calendar/day?date=2026-09-10", headers=headers_u1)
    assert res.status_code == 200
    detail = res.json()

    assert detail["date"] == "2026-09-10"
    assert len(detail["deterministic_diagnosis"]) > 10
    assert "safe_buffer_available" in detail
    assert detail["safe_buffer_available"] == 3500.0
    assert detail["buffer_floor_safeguard"] == 5000.0

    # Intraday timeline has morning debits
    timeline = detail["intraday_timeline"]
    assert len(timeline) >= 1
    morning_debit = next((t for t in timeline if t["flow_type"] == "DEBIT"), None)
    assert morning_debit is not None
    assert morning_debit["time"] == "09:00 AM"


def test_empty_user_history_returns_valid_projection(client, seeded_users):
    """Fresh user with no transactions or obligations receives clean zeroed projection."""
    headers_u2 = {"Authorization": f"Bearer {seeded_users['token2']}"}
    res = client.get("/api/v1/calendar/month?year=2026&month=9", headers=headers_u2)
    assert res.status_code == 200
    data = res.json()

    assert data["total_obligations"] == 0
    assert data["total_transactions"] == 0
    assert data["summary"]["expected_income"] == 0.0
    assert data["summary"]["total_outflows"] == 0.0
    # No false critical gaps
    assert data["summary"]["critical_gap_date"] is None


def test_create_and_delete_obligation(client, seeded_users):
    """Test creating, updating, and deleting an obligation with input validation."""
    headers_u1 = {"Authorization": f"Bearer {seeded_users['token1']}"}

    # Invalid amount <= 0
    bad_res = client.post("/api/v1/obligations", json={
        "title": "Bad Bill",
        "amount": -50.0,
        "frequency": "monthly"
    }, headers=headers_u1)
    assert bad_res.status_code == 422

    # Invalid frequency
    bad_freq = client.post("/api/v1/obligations", json={
        "title": "Bad Freq",
        "amount": 1000.0,
        "frequency": "daily"
    }, headers=headers_u1)
    assert bad_freq.status_code == 422

    # Valid creation
    res_create = client.post("/api/v1/obligations", json={
        "title": "Fiber Internet Plan",
        "amount": 1199.0,
        "category": "utilities",
        "due_day": 18,
        "frequency": "monthly",
        "is_essential": True,
        "reminder_days_before": 2
    }, headers=headers_u1)
    assert res_create.status_code == 201
    created = res_create.json()
    new_id = created["id"]
    assert created["title"] == "Fiber Internet Plan"
    assert created["amount"] == 1199.0

    # Patch update
    res_patch = client.patch(f"/api/v1/obligations/{new_id}", json={
        "amount": 1499.0,
        "title": "High-Speed Fiber"
    }, headers=headers_u1)
    assert res_patch.status_code == 200
    assert res_patch.json()["amount"] == 1499.0
    assert res_patch.json()["title"] == "High-Speed Fiber"

    # Delete
    res_del = client.delete(f"/api/v1/obligations/{new_id}", headers=headers_u1)
    assert res_del.status_code == 200

    # Ensure deleted
    res_patch_after = client.patch(f"/api/v1/obligations/{new_id}", json={"amount": 1000.0}, headers=headers_u1)
    assert res_patch_after.status_code == 404
