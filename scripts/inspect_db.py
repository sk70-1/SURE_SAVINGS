import sqlite3
import glob
import os

db_files = glob.glob("**/*.db", recursive=True)
print("DB files:", db_files)

for db_path in db_files:
    print(f"\n--- Checking {db_path} ---")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, email, full_name, is_demo FROM users;")
        users = cur.fetchall()
        print("Users:", users)
        for u in users:
            uid = u[0]
            cur.execute("SELECT COUNT(*) FROM transactions WHERE user_id=?", (uid,))
            tx_count = cur.fetchone()[0]
            cur.execute("SELECT current_balance, target_amount, minimum_floor FROM buffer_accounts WHERE user_id=?", (uid,))
            buf = cur.fetchone()
            cur.execute("SELECT essential_weekly_expenses FROM financial_profiles WHERE user_id=?", (uid,))
            prof = cur.fetchone()
            cur.execute("SELECT id, income_amount, essential_amount, buffer_amount, flexible_amount, status FROM money_allocation_plans WHERE user_id=?", (uid,))
            plans = cur.fetchall()
            print(f"User {u[1]} (id={uid}): tx_count={tx_count}, buf={buf}, prof={prof}, plans={plans}")
    except Exception as e:
        print(f"Error checking {db_path}: {e}")
