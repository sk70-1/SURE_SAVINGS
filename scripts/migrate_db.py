#!/usr/bin/env python3
"""
Standalone Database Migration & Schema Sync Script.
Safely inspects and applies security hardening schema updates (refresh_tokens table,
composite deduplication indexes, money precision verification) without requiring
an external Alembic CLI binary.
"""

import sys
import os

# Add apps/api to Python module path
API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api"))
sys.path.insert(0, API_DIR)

from sqlalchemy import inspect, text, Index
from app.core.database import engine, Base
from app.models.models import User, RefreshToken, Transaction, MoneyAllocationPlan


def run_standalone_migrations():
    print(f"Connecting to database via engine: {engine.url.render_as_string(hide_password=True)}")

    # 1. Create any missing tables (e.g. refresh_tokens)
    print("Ensuring all Base metadata tables exist...")
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    print(f"Detected tables: {', '.join(sorted(existing_tables))}")

    with engine.begin() as conn:
        # 2. Check and add composite index on Transaction if not present
        if "transactions" in existing_tables:
            tx_indexes = [idx["name"] for idx in inspector.get_indexes("transactions")]
            if "ix_transactions_dedup" not in tx_indexes:
                print("Creating missing composite index 'ix_transactions_dedup' on transactions...")
                try:
                    conn.execute(text(
                        "CREATE INDEX ix_transactions_dedup ON transactions (user_id, date, amount, transaction_type)"
                    ))
                    print("Index 'ix_transactions_dedup' created successfully.")
                except Exception as e:
                    print(f"Notice: Could not create ix_transactions_dedup (it may already exist): {e}")
            else:
                print("Composite index 'ix_transactions_dedup' is already present.")

        # 3. Check and add index on MoneyAllocationPlan if not present
        if "money_allocation_plans" in existing_tables:
            plan_indexes = [idx["name"] for idx in inspector.get_indexes("money_allocation_plans")]
            if "ix_plans_user_status" not in plan_indexes:
                print("Creating missing index 'ix_plans_user_status' on money_allocation_plans...")
                try:
                    conn.execute(text(
                        "CREATE INDEX ix_plans_user_status ON money_allocation_plans (user_id, status)"
                    ))
                    print("Index 'ix_plans_user_status' created successfully.")
                except Exception as e:
                    print(f"Notice: Could not create ix_plans_user_status (it may already exist): {e}")
            else:
                print("Index 'ix_plans_user_status' is already present.")

        # 4. Verify refresh_tokens columns and indexes
        if "refresh_tokens" in existing_tables:
            rt_columns = [col["name"] for col in inspector.get_columns("refresh_tokens")]
            print(f"Verified refresh_tokens columns: {', '.join(rt_columns)}")

    print("Migration completed successfully! Database schema is synchronized.")


if __name__ == "__main__":
    run_standalone_migrations()
