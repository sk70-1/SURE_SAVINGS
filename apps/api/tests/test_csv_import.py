import pytest
import sys
import os
import io
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
from app.models.models import User, Transaction
from app.engine.categorization_engine import CategorizationEngine

# In-memory SQLite database
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

    u1 = User(
        email="csv_user1@example.com",
        hashed_password=hash_password("Pass1234!"),
        full_name="User CSV One",
        currency="INR",
        country="India",
        is_active=True
    )
    u2 = User(
        email="csv_user2@example.com",
        hashed_password=hash_password("Pass1234!"),
        full_name="User CSV Two",
        currency="INR",
        country="India",
        is_active=True
    )
    db.add_all([u1, u2])
    db.commit()
    db.refresh(u1)
    db.refresh(u2)

    # Pre-seed one transaction for User 1 to test duplicate detection
    tx_existing = Transaction(
        user_id=u1.id,
        date=datetime(2026, 9, 5, 10, 0, tzinfo=timezone.utc),
        amount=6500.0,
        description="Bike Loan EMI",
        category="loan_emi",
        transaction_type="EXPENSE",
        is_essential=True
    )
    db.add(tx_existing)
    db.commit()

    u1_id = u1.id
    u2_id = u2.id
    token1 = create_access_token(u1_id)
    token2 = create_access_token(u2_id)

    db.close()
    return {
        "u1_id": u1_id,
        "u2_id": u2_id,
        "token1": token1,
        "token2": token2
    }


def test_categorization_engine_rules():
    """Verify smart deterministic rule classifications for gig, living, and discretionary transactions."""
    # Gig Platform Payout
    c1 = CategorizationEngine.classify("UPI/CR/42381203/ZOMATO/Paytm Payout")
    assert c1["category"] == "platform_payout"
    assert c1["transaction_type"] == "INCOME"

    # Upwork Client Payout
    c2 = CategorizationEngine.classify("NEFT-UPWORK GLOBAL INC-INVOICE9921")
    assert c2["category"] == "freelance_income"
    assert c2["transaction_type"] == "INCOME"

    # Groceries (Essential)
    c3 = CategorizationEngine.classify("POS 4910283 DMART SUPERMARKET BANGALORE")
    assert c3["category"] == "groceries"
    assert c3["is_essential"] is True
    assert c3["transaction_type"] == "EXPENSE"

    # Loan EMI (Essential)
    c4 = CategorizationEngine.classify("ACH/BAJAJ FINANCE/EMI DEBIT")
    assert c4["category"] == "loan_emi"
    assert c4["is_essential"] is True
    assert c4["transaction_type"] == "EXPENSE"

    # Utilities (Essential)
    c5 = CategorizationEngine.classify("UPI/DR/BESCOM ELECTRICITY BILL/BANGALORE")
    assert c5["category"] == "utilities"
    assert c5["is_essential"] is True

    # Dining (Discretionary)
    c6 = CategorizationEngine.classify("POS STARBUCKS COFFEE INDIRANAGAR")
    assert c6["category"] == "dining"
    assert c6["is_essential"] is False


def test_categories_endpoint(client):
    """GET /api/v1/transactions/categories returns metadata definitions."""
    res = client.get("/api/v1/transactions/categories")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 10
    ids = [c["id"] for c in data]
    assert "platform_payout" in ids
    assert "groceries" in ids
    assert "loan_emi" in ids


def test_csv_preview_and_deduplication(client, seeded_users):
    """POST /api/v1/transactions/import/preview parses bank CSV and flags existing duplicates."""
    headers = {"Authorization": f"Bearer {seeded_users['token1']}"}

    # CSV with HDFC/Bank style columns: Date, Description, Debit, Credit
    csv_content = (
        "Date,Narration,Withdrawal,Deposit\n"
        "05/09/2026,ACH/BAJAJ FINANCE/BIKE LOAN EMI,6500.00,\n"  # Exact duplicate of pre-seeded tx
        "08/09/2026,UPI/CR/9921/BLINKIT COMMERCE/PAYOUT,,8400.00\n"
        "12/09/2026,POS DMART GROCERIES,3200.00,\n"
        "15/09/2026,UPI/DR/AIRTEL BROADBAND,1599.00,\n"
    ).encode("utf-8")

    file_tuple = ("statement.csv", io.BytesIO(csv_content), "text/csv")
    res = client.post(
        "/api/v1/transactions/import/preview",
        files={"file": file_tuple},
        headers=headers
    )
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["total_rows"] == 4
    assert data["duplicate_rows"] == 1  # 05/09/2026 6500.00 was already in db
    assert data["valid_rows"] == 3

    # Check Blinkit payout classified as income
    blinkit_item = next((it for it in data["items"] if "blinkit" in it["description"].lower()), None)
    assert blinkit_item is not None
    assert blinkit_item["transaction_type"] == "INCOME"
    assert blinkit_item["amount"] == 8400.0
    assert blinkit_item["category"] == "platform_payout"

    # Check duplicate item flagged
    dup_item = next((it for it in data["items"] if it["is_duplicate"]), None)
    assert dup_item is not None
    assert dup_item["amount"] == 6500.0
    assert dup_item["selected"] is False


def test_csv_confirm_and_user_isolation(client, seeded_users):
    """POST /api/v1/transactions/import/confirm saves approved items with strict user isolation."""
    headers_u1 = {"Authorization": f"Bearer {seeded_users['token1']}"}
    headers_u2 = {"Authorization": f"Bearer {seeded_users['token2']}"}

    commit_payload = {
        "items": [
            {
                "date": "2026-09-08",
                "description": "Blinkit Platform Payout",
                "amount": 8400.0,
                "transaction_type": "INCOME",
                "category": "platform_payout",
                "is_essential": False
            },
            {
                "date": "2026-09-12",
                "description": "DMart Weekly Groceries",
                "amount": 3200.0,
                "transaction_type": "EXPENSE",
                "category": "groceries",
                "is_essential": True
            }
        ]
    }

    res_confirm = client.post(
        "/api/v1/transactions/import/confirm",
        json=commit_payload,
        headers=headers_u1
    )
    assert res_confirm.status_code == 200
    confirm_data = res_confirm.json()
    assert confirm_data["imported_count"] == 2
    assert confirm_data["total_inflow"] == 8400.0
    assert confirm_data["total_outflow"] == 3200.0

    # Verify transactions are in User 1's list
    res_u1_list = client.get("/api/v1/transactions", headers=headers_u1)
    assert res_u1_list.status_code == 200
    u1_txs = res_u1_list.json()
    assert any(t["description"] == "Blinkit Platform Payout" for t in u1_txs)

    # User 2 must NOT see User 1's imported transactions
    res_u2_list = client.get("/api/v1/transactions", headers=headers_u2)
    assert res_u2_list.status_code == 200
    u2_txs = res_u2_list.json()
    assert not any(t["description"] == "Blinkit Platform Payout" for t in u2_txs)


def test_empty_or_bad_csv_rejected(client, seeded_users):
    """Empty CSV uploads are rejected gracefully."""
    headers = {"Authorization": f"Bearer {seeded_users['token1']}"}

    file_tuple = ("empty.csv", io.BytesIO(b""), "text/csv")
    res = client.post(
        "/api/v1/transactions/import/preview",
        files={"file": file_tuple},
        headers=headers
    )
    assert res.status_code == 400
