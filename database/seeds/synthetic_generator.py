"""
Realistic Synthetic Data Generator for Smart Income Buffer.
Creates 60–180 days of granular income and expense transactions for 5 canonical profiles.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
import random


def generate_persona_data(persona_type: str, days: int = 90) -> Dict[str, Any]:
    """
    Generates synthetic profile configuration and transaction history.
    """
    base_date = datetime.now(timezone.utc) - timedelta(days=days)
    transactions = []

    if persona_type == "moderate_volatile":
        # Golden Path A: Freelance UX Designer with occasional surplus weeks
        profile = {
            "name": "Arjun Mehta (Freelance UX)",
            "email": "arjun@example.com",
            "persona_name": "Moderately Volatile Freelancer",
            "persona_type": "moderate_volatile",
            "essential_weekly_expenses": 7000.0,
            "minimum_cash_reserve": 3000.0,
            "minimum_buffer_floor": 6000.0,
            "buffer_target": 28000.0,
            "starting_buffer": 15000.0,
        }
        
        # Weekly cycles
        weeks = days // 7
        for w in range(weeks):
            week_start = base_date + timedelta(days=w * 7)
            # Normal week ~8,000 - 11,000. Most recent week is a strong milestone payout: 15,000
            if w == weeks - 1:
                # Golden Path A payout: income is high (₹15,000 this week)
                income_amt = 15000.0
            elif w % 4 == 0:
                income_amt = 13500.0
            elif w % 3 == 0:
                income_amt = 7500.0
            else:
                income_amt = 9500.0

            transactions.append({
                "date": week_start + timedelta(days=random.randint(1, 4)),
                "amount": income_amt,
                "description": "Client Design Milestone Payout",
                "category": "freelance_income",
                "transaction_type": "INCOME",
                "is_essential": False,
                "source": "synthetic"
            })

            # Essential weekly expenses (groceries, utilities, rent share)
            transactions.append({
                "date": week_start + timedelta(days=1),
                "amount": 3500.0,
                "description": "Apartment Rent & Society Share",
                "category": "housing",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })
            transactions.append({
                "date": week_start + timedelta(days=3),
                "amount": 2200.0,
                "description": "Supermarket Essentials & Groceries",
                "category": "food",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })
            transactions.append({
                "date": week_start + timedelta(days=5),
                "amount": 1300.0,
                "description": "Utilities & Wi-Fi Internet",
                "category": "utilities",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })
            # Non-essential dining/subscriptions
            transactions.append({
                "date": week_start + timedelta(days=6),
                "amount": 950.0,
                "description": "Weekend Dining & Streaming",
                "category": "entertainment",
                "transaction_type": "EXPENSE",
                "is_essential": False,
                "source": "synthetic"
            })

    elif persona_type == "declining_income":
        # Golden Path B: Rideshare Driver facing multi-week contraction
        profile = {
            "name": "Vikram Singh (Rideshare Driver)",
            "email": "vikram@example.com",
            "persona_name": "Declining Trend (Income Shock)",
            "persona_type": "declining_income",
            "essential_weekly_expenses": 6500.0,
            "minimum_cash_reserve": 2000.0,
            "minimum_buffer_floor": 5000.0,
            "buffer_target": 26000.0,
            "starting_buffer": 18000.0,
        }

        weeks = days // 7
        for w in range(weeks):
            week_start = base_date + timedelta(days=w * 7)
            # Declining trajectory: started at 11,000/wk, steadily declined to 3,800/wk
            progress = w / max(1, weeks - 1)
            income_amt = 11000.0 - (progress * 7200.0)  # Down to ~3,800 in final week
            income_amt = max(3500.0, round(income_amt, 2))

            transactions.append({
                "date": week_start + timedelta(days=2),
                "amount": income_amt,
                "description": "Weekly Platform Rideshare Settlement",
                "category": "gig_income",
                "transaction_type": "INCOME",
                "is_essential": False,
                "source": "synthetic"
            })

            # Essential vehicle fuel + maintenance
            transactions.append({
                "date": week_start + timedelta(days=2),
                "amount": 2500.0,
                "description": "EV Charging & Fleet Maintenance",
                "category": "transport",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })
            transactions.append({
                "date": week_start + timedelta(days=4),
                "amount": 2800.0,
                "description": "Family Household Supplies & Ration",
                "category": "food",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })
            transactions.append({
                "date": week_start + timedelta(days=6),
                "amount": 1200.0,
                "description": "Cellular Plan & Road Tolls",
                "category": "utilities",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })

    elif persona_type == "stable_gig":
        # Stable delivery partner
        profile = {
            "name": "Pooja Sharma (Quick Commerce Partner)",
            "email": "pooja@example.com",
            "persona_name": "Stable Gig Earner",
            "persona_type": "stable_gig",
            "essential_weekly_expenses": 4500.0,
            "minimum_cash_reserve": 1500.0,
            "minimum_buffer_floor": 4000.0,
            "buffer_target": 18000.0,
            "starting_buffer": 12000.0,
        }
        weeks = days // 7
        for w in range(weeks):
            week_start = base_date + timedelta(days=w * 7)
            transactions.append({
                "date": week_start + timedelta(days=2),
                "amount": random.uniform(6200.0, 6800.0),
                "description": "Delivery Earnings & Peak Bonus",
                "category": "gig_income",
                "transaction_type": "INCOME",
                "is_essential": False,
                "source": "synthetic"
            })
            transactions.append({
                "date": week_start + timedelta(days=3),
                "amount": 2200.0,
                "description": "Rental Accommodation",
                "category": "housing",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })
            transactions.append({
                "date": week_start + timedelta(days=5),
                "amount": 1600.0,
                "description": "Weekly Food & Meals",
                "category": "food",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })

    elif persona_type == "extreme_volatile":
        # Event production audio engineer
        profile = {
            "name": "Rohan Deshmukh (Event Technician)",
            "email": "rohan@example.com",
            "persona_name": "Extreme Volatility (Spikes & Droughts)",
            "persona_type": "extreme_volatile",
            "essential_weekly_expenses": 8000.0,
            "minimum_cash_reserve": 4000.0,
            "minimum_buffer_floor": 8000.0,
            "buffer_target": 32000.0,
            "starting_buffer": 14000.0,
        }
        weeks = days // 7
        for w in range(weeks):
            week_start = base_date + timedelta(days=w * 7)
            # Spikes (festival weeks) vs zero-income dry spells
            if w in [1, 5, 8, 11]:
                income_amt = 32000.0
            elif w in [2, 6, 9]:
                income_amt = 0.0
            else:
                income_amt = 7000.0

            if income_amt > 0:
                transactions.append({
                    "date": week_start + timedelta(days=3),
                    "amount": income_amt,
                    "description": "Live Concert Production Retainer",
                    "category": "freelance_income",
                    "transaction_type": "INCOME",
                    "is_essential": False,
                    "source": "synthetic"
                })
            transactions.append({
                "date": week_start + timedelta(days=2),
                "amount": 5000.0,
                "description": "Studio Rent & Gear Insurance",
                "category": "housing",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })
            transactions.append({
                "date": week_start + timedelta(days=4),
                "amount": 3000.0,
                "description": "Food & Travel",
                "category": "food",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })

    elif persona_type == "daily_construction":
        # Low-income daily wage construction worker
        profile = {
            "name": "Ramesh Kumar (Construction Worker)",
            "email": "ramesh@example.com",
            "persona_name": "Low-Income Daily Earner",
            "persona_type": "daily_construction",
            "essential_weekly_expenses": 2100.0,
            "minimum_cash_reserve": 800.0,
            "minimum_buffer_floor": 1500.0,
            "buffer_target": 8500.0,
            "starting_buffer": 2400.0,
        }
        weeks = days // 7
        for w in range(weeks):
            week_start = base_date + timedelta(days=w * 7)
            # Fragile weekly income: ~₹1,000 - ₹2,800/week (₹400-500/day for 2-6 days of hard labor)
            # Most recent week was slow due to rain/cement shortages (only 2 days worked = ₹1,000)
            if w == weeks - 1:
                income_amt = 1000.0  # Slow rain week
            elif w % 4 == 0:
                income_amt = 2800.0  # 6 days of brick masonry work
            elif w % 3 == 0:
                income_amt = 1600.0  # Material shortage delay
            else:
                income_amt = 2200.0  # Normal 4-5 days wage

            transactions.append({
                "date": week_start + timedelta(days=6),
                "amount": income_amt,
                "description": "Weekly Site Labor Cash Settlement",
                "category": "gig_income",
                "transaction_type": "INCOME",
                "is_essential": False,
                "source": "synthetic"
            })

            # Essential expenses: shared room rent ₹800, food rations ₹1,000, bus pass ₹200
            transactions.append({
                "date": week_start + timedelta(days=1),
                "amount": 800.0,
                "description": "Shared Room Rent",
                "category": "housing",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })
            transactions.append({
                "date": week_start + timedelta(days=3),
                "amount": 1000.0,
                "description": "Weekly Food Rations & Dal",
                "category": "food",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })
            transactions.append({
                "date": week_start + timedelta(days=5),
                "amount": 200.0,
                "description": "Daily Bus Fare & Chai",
                "category": "transport",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })

    else:  # high_expense
        profile = {
            "name": "Sneha Roy (Contract Content Creator)",
            "email": "sneha@example.com",
            "persona_name": "High Fixed Expense Profile",
            "persona_type": "high_expense",
            "essential_weekly_expenses": 11000.0,
            "minimum_cash_reserve": 3500.0,
            "minimum_buffer_floor": 7500.0,
            "buffer_target": 44000.0,
            "starting_buffer": 16000.0,
        }
        weeks = days // 7
        for w in range(weeks):
            week_start = base_date + timedelta(days=w * 7)
            transactions.append({
                "date": week_start + timedelta(days=1),
                "amount": 13500.0,
                "description": "Sponsored Campaign Release",
                "category": "freelance_income",
                "transaction_type": "INCOME",
                "is_essential": False,
                "source": "synthetic"
            })
            transactions.append({
                "date": week_start + timedelta(days=2),
                "amount": 7000.0,
                "description": "Office Co-working & Equipment Lease",
                "category": "housing",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })
            transactions.append({
                "date": week_start + timedelta(days=4),
                "amount": 4000.0,
                "description": "Production Crew Essentials & Transport",
                "category": "transport",
                "transaction_type": "EXPENSE",
                "is_essential": True,
                "source": "synthetic"
            })

    return {"profile": profile, "transactions": transactions}
