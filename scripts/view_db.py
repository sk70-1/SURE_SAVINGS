import sqlite3
import os
import sys

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "apps", "api", "smart_buffer.db")

def view_database(table_name=None):
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    if not table_name:
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = [t[0] for t in cur.fetchall()]
        print("\n=======================================================")
        print("          SURE-SAVINGS DATABASE VIEWER                ")
        print("=======================================================")
        print(f"Database File: {DB_PATH}\n")
        print("Available Tables:")
        for idx, tbl in enumerate(tables, 1):
            cnt = cur.execute(f"SELECT count(*) FROM {tbl}").fetchone()[0]
            print(f" {idx:2d}. {tbl:<25} ({cnt} rows)")
        
        print("\n-------------------------------------------------------")
        print("Usage:")
        print("  python scripts/view_db.py users")
        print("  python scripts/view_db.py transactions")
        print("  python scripts/view_db.py buffer_accounts")
        print("  python scripts/view_db.py audit_logs")
        print("  python scripts/view_db.py money_allocation_plans")
        print("=======================================================\n")
        return

    # View specific table
    cur.execute(f"PRAGMA table_info({table_name})")
    columns = [col[1] for col in cur.fetchall()]
    if not columns:
        print(f"Error: Table '{table_name}' does not exist.")
        return

    cur.execute(f"SELECT * FROM {table_name} LIMIT 25")
    rows = cur.fetchall()

    print(f"\n=== TABLE: {table_name.upper()} (Showing up to 25 rows) ===")
    print(" | ".join(columns[:6]))
    print("-" * 75)
    for r in rows:
        formatted = [str(val)[:20] for val in r[:6]]
        print(" | ".join(formatted))
    print(f"Total rows displayed: {len(rows)}\n")

if __name__ == "__main__":
    table = sys.argv[1] if len(sys.argv) > 1 else None
    view_database(table)
