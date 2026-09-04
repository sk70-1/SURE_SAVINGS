import pytest
import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.api.deps import get_db
from app.core.database import Base

from sqlalchemy.pool import StaticPool

# In-memory database with StaticPool for isolation testing
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


def test_registration_and_jwt_generation(client):
    """Test user registration issues valid access and refresh tokens."""
    res = client.post("/api/v1/auth/register", json={
        "email": "user_a@example.com",
        "password": "SecurePassword123!",
        "full_name": "User Alpha",
        "currency": "INR",
        "country": "India"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["email"] == "user_a@example.com"
    assert data["onboarding_completed"] is False
    assert data["is_demo"] is False


def test_registration_duplicate_email_rejected(client):
    """Test registering duplicate email is rejected with 400."""
    res = client.post("/api/v1/auth/register", json={
        "email": "user_a@example.com",
        "password": "AnotherPassword123!",
        "full_name": "Duplicate Alpha"
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]


def test_login_and_token_refresh(client):
    """Test user login returns valid tokens and refresh endpoint works."""
    # 1. Login with correct password
    login_res = client.post("/api/v1/auth/login", json={
        "email": "user_a@example.com",
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    access_token = login_data["access_token"]
    refresh_token = login_data["refresh_token"]

    # 2. Login with incorrect password
    bad_res = client.post("/api/v1/auth/login", json={
        "email": "user_a@example.com",
        "password": "WrongPassword!"
    })
    assert bad_res.status_code == 401

    # 3. Refresh token
    refresh_res = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_res.status_code == 200
    new_data = refresh_res.json()
    assert "access_token" in new_data
    assert new_data["email"] == "user_a@example.com"


def test_unauthenticated_request_rejected(client):
    """Test accessing protected route without Bearer token returns 401."""
    from app.core.config import settings
    orig = settings.DEMO_MODE_ENABLED
    try:
        settings.DEMO_MODE_ENABLED = False
        res = client.get("/api/v1/auth/me")
        assert res.status_code == 401

        tx_res = client.get("/api/v1/transactions")
        assert tx_res.status_code == 401
    finally:
        settings.DEMO_MODE_ENABLED = orig


def test_invalid_jwt_rejected(client):
    """Test accessing protected route with forged/invalid token returns 401."""
    headers = {"Authorization": "Bearer totally_fake_forged_jwt_token"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 401


def test_user_data_isolation_between_accounts(client):
    """Test User B CANNOT see or delete User A's transactions."""
    # 1. Register User B
    res_b = client.post("/api/v1/auth/register", json={
        "email": "user_b@example.com",
        "password": "SecurePassword456!",
        "full_name": "User Beta"
    })
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 2. Get User A's token
    login_a = client.post("/api/v1/auth/login", json={
        "email": "user_a@example.com",
        "password": "SecurePassword123!"
    })
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 3. User A creates a transaction
    create_res = client.post("/api/v1/transactions", json={
        "date": "2026-09-01T10:00:00Z",
        "amount": 12500.0,
        "description": "User A Private Contract Payout",
        "category": "freelance",
        "transaction_type": "INCOME",
        "is_essential": False
    }, headers=headers_a)
    assert create_res.status_code == 201
    tx_a = create_res.json()
    tx_a_id = tx_a["id"]

    # 4. User A sees their transaction
    tx_list_a = client.get("/api/v1/transactions", headers=headers_a).json()
    assert any(t["id"] == tx_a_id for t in tx_list_a)

    # 5. User B DOES NOT see User A's transaction
    tx_list_b = client.get("/api/v1/transactions", headers=headers_b).json()
    assert not any(t["id"] == tx_a_id for t in tx_list_b)

    # 6. User B ATTEMPTS TO DELETE User A's transaction -> MUST BE 404 NOT FOUND
    del_res = client.delete(f"/api/v1/transactions/{tx_a_id}", headers=headers_b)
    assert del_res.status_code == 404

    # 7. Transaction still exists for User A
    tx_list_a_after = client.get("/api/v1/transactions", headers=headers_a).json()
    assert any(t["id"] == tx_a_id for t in tx_list_a_after)


def test_user_onboarding_flow(client):
    """Test real user onboarding updates financial settings and buffer floor."""
    login_a = client.post("/api/v1/auth/login", json={
        "email": "user_a@example.com",
        "password": "SecurePassword123!"
    })
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    onboard_res = client.post("/api/v1/auth/onboarding", json={
        "currency": "INR",
        "country": "India",
        "pay_frequency": "weekly",
        "essential_weekly_expenses": 7500.0,
        "target_buffer": 30000.0,
        "minimum_buffer_floor": 6000.0,
        "minimum_cash_reserve": 3000.0
    }, headers=headers_a)
    assert onboard_res.status_code == 200
    prof = onboard_res.json()
    assert prof["essential_weekly_expenses"] == 7500.0
    assert prof["target_buffer"] == 30000.0
    assert prof["minimum_buffer_floor"] == 6000.0

    # Verify user profile shows onboarding completed
    me_res = client.get("/api/v1/auth/me", headers=headers_a)
    assert me_res.status_code == 200
    assert me_res.json()["onboarding_completed"] is True


def test_floor_cannot_exceed_target_validation(client):
    """Test onboarding rejects invalid financial settings where floor > target."""
    login_b = client.post("/api/v1/auth/login", json={
        "email": "user_b@example.com",
        "password": "SecurePassword456!"
    })
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    bad_onboard = client.post("/api/v1/auth/onboarding", json={
        "currency": "INR",
        "country": "India",
        "pay_frequency": "weekly",
        "essential_weekly_expenses": 5000.0,
        "target_buffer": 10000.0,
        "minimum_buffer_floor": 15000.0,  # Floor > Target is illegal
        "minimum_cash_reserve": 2000.0
    }, headers=headers_b)
    assert bad_onboard.status_code == 400
    assert "cannot exceed" in bad_onboard.json()["detail"]
