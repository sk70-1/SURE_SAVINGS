"""
Database Seeder for Smart Income Buffer.
Initializes tables and seeds the 5 canonical personas with realistic transaction history.
"""

from datetime import datetime, timezone
import sys
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
API_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))  # apps/api
ROOT_DIR = os.path.abspath(os.path.join(API_DIR, "..", ".."))     # project root
SEEDS_DIR = os.path.join(ROOT_DIR, "database", "seeds")

sys.path.insert(0, API_DIR)
sys.path.insert(0, ROOT_DIR)
sys.path.insert(0, SEEDS_DIR)

from app.core.database import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models.models import (
    User, FinancialProfile, Transaction, BufferAccount,
    BufferTransaction, ResilienceScore, Recommendation, Notification, AuditLog,
    MoneyAllocationPlan, FinancialGoal
)
from app.engine.financial_engine import FinancialEngine
from app.engine.forecast_engine import ForecastEngine
from app.engine.recommendation_engine import RecommendationEngine
from synthetic_generator import generate_persona_data


def seed_database():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        persona_types = [
            "moderate_volatile",  # Golden Path A (Arjun)
            "declining_income",   # Golden Path B (Vikram)
            "daily_construction", # Ramesh (Low-Income Construction Worker)
            "stable_gig",         # Pooja
            "extreme_volatile",   # Rohan
            "high_expense"        # Sneha
        ]

        print(f"Seeding {len(persona_types)} synthetic personas...")

        for p_type in persona_types:
            bundle = generate_persona_data(p_type, days=90)
            prof_data = bundle["profile"]
            tx_data = bundle["transactions"]

            # Check if user already exists
            existing_user = db.query(User).filter(User.email == prof_data["email"]).first()
            if existing_user:
                print(f"User {prof_data['email']} already exists. Skipping.")
                continue

            # 1. Create User
            user = User(
                email=prof_data["email"],
                hashed_password=hash_password("password123"),
                full_name=prof_data["name"],
                is_active=True
            )
            db.add(user)
            db.flush()

            # 2. Create Financial Profile
            profile = FinancialProfile(
                user_id=user.id,
                persona_name=prof_data["persona_name"],
                persona_type=prof_data["persona_type"],
                minimum_cash_reserve=prof_data["minimum_cash_reserve"],
                minimum_buffer_floor=prof_data["minimum_buffer_floor"],
                essential_weekly_expenses=prof_data["essential_weekly_expenses"],
                policy_limit_ratio=0.50
            )
            db.add(profile)

            # 3. Create Buffer Account
            buffer_account = BufferAccount(
                user_id=user.id,
                current_balance=prof_data["starting_buffer"],
                target_amount=prof_data["buffer_target"],
                minimum_floor=prof_data["minimum_buffer_floor"],
                policy_limit=round(prof_data["essential_weekly_expenses"] * 0.75, 2)
            )
            db.add(buffer_account)
            db.flush()

            # Initial buffer transaction record
            initial_tx = BufferTransaction(
                buffer_account_id=buffer_account.id,
                user_id=user.id,
                transaction_type="CONTRIBUTION",
                amount=prof_data["starting_buffer"],
                resulting_balance=prof_data["starting_buffer"],
                notes="Initial Reserve Balance"
            )
            db.add(initial_tx)

            # 4. Insert Transactions
            incomes = []
            total_expenses = 0.0
            essential_expenses = 0.0

            for tx in tx_data:
                db_tx = Transaction(
                    user_id=user.id,
                    date=tx["date"],
                    amount=tx["amount"],
                    description=tx["description"],
                    category=tx["category"],
                    transaction_type=tx["transaction_type"],
                    is_essential=tx["is_essential"],
                    source=tx["source"]
                )
                db.add(db_tx)

                if tx["transaction_type"] == "INCOME":
                    incomes.append(tx["amount"])
                else:
                    total_expenses += tx["amount"]
                    if tx["is_essential"]:
                        essential_expenses += tx["amount"]

            db.flush()

            # 5. Run Financial Engines to compute baseline analytics
            income_stats = FinancialEngine.calculate_income_analytics(incomes)
            forecast = ForecastEngine.forecast_next_period(incomes)

            # Net cash flow (last 30 days approximated as last 4 cycles)
            recent_incomes = incomes[-4:] if len(incomes) >= 4 else incomes
            cash_flow_net = sum(recent_incomes) - (prof_data["essential_weekly_expenses"] * len(recent_incomes))
            essential_ratio = (essential_expenses / total_expenses) if total_expenses > 0 else 0.65

            # Compute Resilience Score
            resilience = FinancialEngine.calculate_resilience_score(
                income_volatility_cv=income_stats["cv"],
                current_buffer=buffer_account.current_balance,
                buffer_target=buffer_account.target_amount,
                essential_ratio=essential_ratio,
                cash_flow_net=cash_flow_net
            )

            res_record = ResilienceScore(
                user_id=user.id,
                score=resilience["overall_score"],
                income_stability=resilience["income_stability"],
                buffer_coverage=resilience["buffer_coverage"],
                expense_health=resilience["expense_health"],
                cash_flow_health=resilience["cash_flow_health"]
            )
            db.add(res_record)

            # 6. Generate Recommendations
            recent_actual_income = incomes[-1] if incomes else prof_data["essential_weekly_expenses"]
            is_declining = (p_type == "declining_income")

            recs = RecommendationEngine.generate_recommendations(
                recent_actual_income=recent_actual_income,
                stabilized_income=income_stats["stabilized_income"],
                essential_weekly_expenses=prof_data["essential_weekly_expenses"],
                current_buffer=buffer_account.current_balance,
                buffer_target=buffer_account.target_amount,
                minimum_buffer_floor=prof_data["minimum_buffer_floor"],
                minimum_cash_reserve=prof_data["minimum_cash_reserve"],
                income_volatility_cv=income_stats["cv"],
                forecast_expected=forecast["expected_income"],
                forecast_confidence=forecast["confidence"],
                is_income_declining=is_declining
            )

            for r in recs:
                db_rec = Recommendation(
                    user_id=user.id,
                    type=r["type"],
                    what=r["what"],
                    why=r["why"],
                    impact=r["impact"],
                    priority=r["priority"],
                    confidence=r["confidence"],
                    recommended_amount=r["recommended_amount"],
                    status="PENDING"
                )
                db.add(db_rec)

            # 7. Initial Notifications
            welcome_notif = Notification(
                user_id=user.id,
                type="SYSTEM",
                title=f"Welcome to Smart Income Buffer, {prof_data['name'].split()[0]}!",
                message=f"Your profile '{prof_data['persona_name']}' is initialized with {len(tx_data)} analyzed transactions."
            )
            db.add(welcome_notif)

            # Audit record
            audit = AuditLog(
                user_id=user.id,
                action="INITIALIZE_PERSONA",
                details=f"Seeded synthetic profile for {prof_data['persona_name']} with ₹{buffer_account.current_balance:,.2f} starting buffer."
            )
            db.add(audit)

        # Seed default financial goals for users
        all_users = db.query(User).all()
        for u in all_users:
            existing_goal = db.query(FinancialGoal).filter(FinancialGoal.user_id == u.id).first()
            if not existing_goal:
                if "arjun" in u.email:
                    goal = FinancialGoal(
                        user_id=u.id,
                        title="Ergonomic Studio Workstation",
                        target_amount=25000.0,
                        current_amount=8000.0,
                        category="EQUIPMENT",
                        priority=1
                    )
                elif "vikram" in u.email:
                    goal = FinancialGoal(
                        user_id=u.id,
                        title="Vehicle Tyre & Brake Overhaul",
                        target_amount=12000.0,
                        current_amount=3500.0,
                        category="VEHICLE",
                        priority=1
                    )
                elif "ramesh" in u.email:
                    goal = FinancialGoal(
                        user_id=u.id,
                        title="Monsoon Emergency Home Repair",
                        target_amount=6000.0,
                        current_amount=1200.0,
                        category="HOUSING",
                        priority=1
                    )
                else:
                    goal = FinancialGoal(
                        user_id=u.id,
                        title="Emergency Reserves Goal",
                        target_amount=10000.0,
                        current_amount=2500.0,
                        category="GENERAL",
                        priority=1
                    )
                db.add(goal)

        db.commit()
        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
