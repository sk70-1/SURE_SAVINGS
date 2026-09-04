import pytest
import sys
import os
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.config import Settings, settings
from app.core.database import Base
from app.api.deps import get_db
from app.core.security import (
    hash_password, verify_password,
    validate_password_strength, _legacy_sha256_hash, create_access_token,
    create_refresh_token
)
from app.models.models import User, FinancialProfile, BufferAccount, MoneyAllocationPlan, RefreshToken
from app.engine.financial_engine import FinancialEngine

# Isolated in-memory database fixture
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


# 1. Production Startup Guardrails
def test_production_fails_on_insecure_secret():
    """Verify that in production ENVIRONMENT, missing/weak/placeholder secret raises RuntimeError."""
    s = Settings(ENVIRONMENT="production", SECRET_KEY="replace_with_a_long_random_secret", DEMO_MODE_ENABLED=False)
    with pytest.raises(RuntimeError, match="known default or placeholder"):
        s.validate_production_configuration()

    s_short = Settings(ENVIRONMENT="production", SECRET_KEY="short_key", DEMO_MODE_ENABLED=False)
    with pytest.raises(RuntimeError, match="at least 32 characters"):
        s_short.validate_production_configuration()

    s_demo = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="c8f1e2d3b4a567890123456789abcdef0123456789abcdef0123456789abcdef",
        DEMO_MODE_ENABLED=True
    )
    s_demo.validate_production_configuration()  # Allows demo mode with warning, does not crash
    assert s_demo.is_demo_mode is True

    # Safe production configuration
    s_safe = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="c8f1e2d3b4a567890123456789abcdef0123456789abcdef0123456789abcdef",
        DEMO_MODE_ENABLED=False
    )
    s_safe.validate_production_configuration()  # Should succeed without error


# 2. Strong Password Validation
def test_password_strength_enforcement():
    """Verify that password requires 12+ chars, uppercase, lowercase, digit, and symbol."""
    is_ok, _ = validate_password_strength("Short1!")
    assert not is_ok

    is_ok, _ = validate_password_strength("alllowercase123!")
    assert not is_ok

    is_ok, _ = validate_password_strength("ALLUPPERCASE123!")
    assert not is_ok

    is_ok, _ = validate_password_strength("NoDigitsHere!!")
    assert not is_ok

    is_ok, _ = validate_password_strength("NoSymbols12345")
    assert not is_ok

    is_ok, err = validate_password_strength("StrongPass123!@#")
    assert is_ok
    assert err == ""


def test_registration_rejects_weak_password(client):
    """Registration endpoint must reject weak passwords."""
    res = client.post("/api/v1/auth/register", json={
        "email": "weak@example.com",
        "password": "simplepassword",
        "full_name": "Weak User"
    })
    assert res.status_code == 422


# 3. Bcrypt Hashing with Unique Salt
def test_bcrypt_hashing():
    """Bcrypt must generate distinct salt hashes for identical passwords."""
    h1 = hash_password("StrongPass123!@#")
    h2 = hash_password("StrongPass123!@#")
    assert h1 != h2
    assert h1.startswith("$2b$")
    assert verify_password("StrongPass123!@#", h1)
    assert not verify_password("WrongPass123!@#", h1)


# 4. Transparent Legacy Password Migration
def test_legacy_sha256_login_upgrades_to_bcrypt(client, db_session):
    """User with legacy SHA-256 password hash can log in and gets hash upgraded to bcrypt."""
    plain = "LegacyStrong123!"
    legacy_hash = _legacy_sha256_hash(plain)

    user = User(
        email="legacy@example.com",
        hashed_password=legacy_hash,
        full_name="Legacy User",
        is_active=True,
        is_demo=False
    )
    db_session.add(user)
    db_session.commit()

    # Login with plain password
    res = client.post("/api/v1/auth/login", json={
        "email": "legacy@example.com",
        "password": plain
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data

    # Verify database hash was updated to bcrypt
    db_session.refresh(user)
    assert user.hashed_password.startswith("$2b$")
    assert user.hashed_password != legacy_hash


# 5. Public Seed Endpoint is Disabled
def test_seed_endpoint_disabled(client):
    """GET /api/v1/seed must be removed and return 404."""
    res = client.get("/api/v1/seed")
    assert res.status_code in (404, 405)


# 6. Unauthenticated Requests Return 401
def test_unauthenticated_request_returns_401(client):
    """Without auth token or demo mode, protected endpoints return 401."""
    original_demo = settings.DEMO_MODE_ENABLED
    try:
        settings.DEMO_MODE_ENABLED = False
        res = client.get("/api/v1/buffer")
        assert res.status_code == 401
    finally:
        settings.DEMO_MODE_ENABLED = original_demo


# 7. Demo Personas Isolation & PII Protection
def test_personas_isolation_and_pii_protection(client, db_session):
    """Personas endpoint only returns synthetic demo accounts and never exposes real user PII."""
    # Create real user
    real_user = User(
        email="real_client@private.com",
        hashed_password=hash_password("RealSecret123!"),
        full_name="Real Client",
        is_demo=False
    )
    # Create demo user
    demo_user = User(
        email="synthetic_persona@example.com",
        hashed_password=hash_password("DemoSecret123!"),
        full_name="Synthetic Persona",
        is_demo=True
    )
    db_session.add(real_user)
    db_session.add(demo_user)
    db_session.commit()

    original_demo = settings.DEMO_MODE_ENABLED
    try:
        # With demo mode enabled
        settings.DEMO_MODE_ENABLED = True
        res = client.get("/api/v1/users/personas")
        assert res.status_code == 200
        personas = res.json()
        emails = [p["email"] for p in personas]
        assert "synthetic_persona@example.com" in emails
        assert "real_client@private.com" not in emails  # Real PII is strictly excluded!

        # With demo mode disabled
        settings.DEMO_MODE_ENABLED = False
        res_disabled = client.get("/api/v1/users/personas")
        assert res_disabled.status_code == 403
    finally:
        settings.DEMO_MODE_ENABLED = original_demo


# 8. Idempotent Allocation Plan Approvals
def test_idempotent_allocation_approval(client, db_session):
    """Repeated approval of the same allocation plan is safe and idempotent."""
    user = User(
        email="idempotent_test@example.com",
        hashed_password=hash_password("StrongPass123!"),
        full_name="Idempotent Test",
        is_active=True
    )
    db_session.add(user)
    db_session.flush()

    buf = BufferAccount(
        user_id=user.id,
        current_balance=Decimal("1000.00"),
        target_amount=Decimal("10000.00"),
        minimum_floor=Decimal("2000.00")
    )
    prof = FinancialProfile(
        user_id=user.id,
        target_buffer=Decimal("10000.00"),
        minimum_buffer_floor=Decimal("2000.00"),
        essential_weekly_expenses=Decimal("3000.00")
    )
    plan = MoneyAllocationPlan(
        user_id=user.id,
        income_amount=Decimal("5000.00"),
        essential_amount=Decimal("3000.00"),
        buffer_amount=Decimal("1500.00"),
        obligation_amount=Decimal("0.00"),
        flexible_amount=Decimal("500.00"),
        goal_amount=Decimal("0.00"),
        recovery_amount=Decimal("0.00"),
        status="PENDING"
    )
    db_session.add(buf)
    db_session.add(prof)
    db_session.add(plan)
    db_session.commit()

    token = create_access_token(subject=str(user.id))
    headers = {"Authorization": f"Bearer {token}"}

    # First approval
    res1 = client.post(f"/api/v1/allocation/{plan.id}/approve", headers=headers)
    assert res1.status_code == 200, res1.text
    data1 = res1.json()
    assert data1["status"] == "APPROVED"
    assert data1["updated_buffer_balance"] == 2500.0  # 1000 + 1500

    # Second approval (Idempotency test)
    res2 = client.post(f"/api/v1/allocation/{plan.id}/approve", headers=headers)
    assert res2.status_code == 200, res2.text
    data2 = res2.json()
    assert data2["status"] == "APPROVED"
    assert "already approved" in data2["message"].lower()

    # Balance must NOT have been double-credited!
    db_session.refresh(buf)
    assert buf.current_balance == Decimal("2500.00")


# 9. Profile Floor and BufferAccount Synchronization
def test_profile_update_validation_and_sync(client, db_session):
    """Profile update enforces minimum_buffer_floor <= target_buffer and synchronizes BufferAccount."""
    user = User(
        email="profile_sync@example.com",
        hashed_password=hash_password("StrongPass123!"),
        full_name="Profile Sync",
        is_active=True
    )
    db_session.add(user)
    db_session.flush()

    prof = FinancialProfile(
        user_id=user.id,
        target_buffer=Decimal("20000.00"),
        minimum_buffer_floor=Decimal("5000.00"),
        essential_weekly_expenses=Decimal("4000.00"),
        policy_limit_ratio=Decimal("0.5000")
    )
    buf = BufferAccount(
        user_id=user.id,
        current_balance=Decimal("5000.00"),
        target_amount=Decimal("20000.00"),
        minimum_floor=Decimal("5000.00")
    )
    db_session.add(prof)
    db_session.add(buf)
    db_session.commit()

    token = create_access_token(subject=str(user.id))
    headers = {"Authorization": f"Bearer {token}"}

    # Invalid: floor > target
    res_bad = client.put("/api/v1/users/profile", headers=headers, json={
        "target_buffer": 10000.0,
        "minimum_buffer_floor": 15000.0
    })
    assert res_bad.status_code in (400, 422)

    # Valid: update target and floor
    res_good = client.put("/api/v1/users/profile", headers=headers, json={
        "target_buffer": 30000.0,
        "minimum_buffer_floor": 8000.0
    })
    assert res_good.status_code == 200
    db_session.refresh(buf)
    assert buf.target_amount == Decimal("30000.00")
    assert buf.minimum_floor == Decimal("8000.00")


# 10. Token Rotation & Reuse Detection
def test_refresh_token_rotation_and_reuse_detection(client, db_session):
    """Token refresh rotates refresh token; attempting to reuse old token revokes all sessions."""
    user = User(
        email="reuse_test@example.com",
        hashed_password=hash_password("StrongPass123!"),
        full_name="Reuse Test",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    # Initial token pair
    ref_token1, jti1, exp1 = create_refresh_token(subject=str(user.id))
    s1 = RefreshToken(
        user_id=user.id,
        token_jti=jti1,
        token_hash="hash1",
        expires_at=exp1,
        revoked=False
    )
    db_session.add(s1)
    db_session.commit()

    # 1. Normal refresh: rotates to ref_token2
    client.cookies.set("refresh_token", ref_token1)
    res_refresh = client.post("/api/v1/auth/refresh")
    assert res_refresh.status_code == 200, res_refresh.text
    data_ref = res_refresh.json()
    ref_token2 = data_ref["refresh_token"]
    assert ref_token2 != ref_token1

    # s1 in DB must now be revoked
    db_session.refresh(s1)
    assert s1.revoked is True

    # 2. Attacker attempts to REUSE ref_token1 (Reuse Detection Trigger!)
    client.cookies.set("refresh_token", ref_token1)
    res_reuse = client.post("/api/v1/auth/refresh")
    assert res_reuse.status_code == 401
    assert "reuse detected" in res_reuse.json()["detail"].lower()

    # All sessions for user must now be revoked
    sessions = db_session.query(RefreshToken).filter(RefreshToken.user_id == user.id).all()
    assert all(s.revoked for s in sessions)


# 11. Money Precision & Float Drift Protection
def test_money_precision_decimal_accuracy():
    """Verify that arithmetic does not suffer from float drift (0.1 + 0.2 == 0.30)."""
    surplus = FinancialEngine.calculate_financial_surplus(
        actual_income=0.3,
        essential_expenses=0.2,
        minimum_cash_reserve=0.0
    )
    assert surplus == 0.1

    gap = FinancialEngine.calculate_buffer_gap(
        buffer_target=0.3,
        current_buffer=0.1
    )
    assert gap == 0.2

    # Verify exact Decimal helpers
    dec_val = FinancialEngine.round_money(Decimal("0.1") + Decimal("0.2"))
    assert dec_val == Decimal("0.30")
