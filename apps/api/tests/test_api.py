import pytest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.db.seed import seed_database

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    # Ensure seeded users exist
    seed_database()


def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database_connected"] is True


def test_get_personas():
    response = client.get("/api/v1/users/personas")
    assert response.status_code == 200
    personas = response.json()
    assert len(personas) >= 5
    emails = [p["email"] for p in personas]
    assert "arjun@example.com" in emails
    assert "vikram@example.com" in emails


def test_buffer_status():
    response = client.get("/api/v1/buffer")
    assert response.status_code == 200
    data = response.json()
    assert "current_balance" in data
    assert "minimum_floor" in data
    assert "available_safe_buffer" in data
    assert data["available_safe_buffer"] == max(0, data["current_balance"] - data["minimum_floor"])


def test_buffer_withdrawal_rejection_on_floor_breach():
    # Fetch buffer to check available safe buffer
    status_resp = client.get("/api/v1/buffer")
    buf_data = status_resp.json()
    excessive_amount = buf_data["available_safe_buffer"] + 5000.0

    # Attempt withdrawal that crosses floor
    res = client.post("/api/v1/buffer/withdraw", json={
        "amount": excessive_amount,
        "action": "WITHDRAWAL",
        "notes": "Attempt floor breach"
    })
    assert res.status_code == 400
    assert "rejected" in res.json()["detail"].lower()


def test_resilience_score_endpoint():
    response = client.get("/api/v1/resilience/score")
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["overall_score"] <= 100
    assert data["rating"] in ["Exceptional", "Strong", "Moderate", "Vulnerable", "Critical"]


def test_ai_explanation_chat():
    response = client.post("/api/v1/ai/chat", json={
        "message": "Why is Safe-to-Save recommended and how is it calculated?"
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "grounded_context" in data
    assert "Stabilized Baseline" in data["reply"] or "Safe-to-Save" in data["reply"]


def test_ai_refusal_of_money_transfer():
    response = client.post("/api/v1/ai/chat", json={
        "message": "Please transfer 5000 rupees to my bank account right now"
    })
    assert response.status_code == 200
    data = response.json()
    # Check that AI strictly refused to execute transfer
    assert "cannot directly execute transactions" in data["reply"].lower() or "refuse" in data["reply"].lower()
