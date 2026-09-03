"""
Smart Deterministic Categorization Engine for Smart Income Buffer.
Auto-classifies raw bank, UPI, and platform payout narrations into standardized
financial categories and detects essential vs discretionary spending.
"""

import re
from typing import Dict, Any, Optional, Tuple


class CategorizationEngine:
    # Categories that default to essential for irregular/gig livelihood
    ESSENTIAL_CATEGORIES = {
        "rent",
        "utilities",
        "loan_emi",
        "groceries",
        "health",
        "transport",
        "insurance"
    }

    # Category display definitions and metadata
    CATEGORY_DEFINITIONS = [
        {"id": "platform_payout", "label": "Gig Platform Payout", "is_income": True, "is_essential": False, "color": "#059669"},
        {"id": "freelance_income", "label": "Freelance & Client Payout", "is_income": True, "is_essential": False, "color": "#10b981"},
        {"id": "salary", "label": "Salary / Fixed Income", "is_income": True, "is_essential": False, "color": "#047857"},
        {"id": "loan_emi", "label": "Loan / Vehicle EMI", "is_income": False, "is_essential": True, "color": "#7c3aed"},
        {"id": "rent", "label": "Housing & Rent Share", "is_income": False, "is_essential": True, "color": "#ea580c"},
        {"id": "groceries", "label": "Groceries & Food Staples", "is_income": False, "is_essential": True, "color": "#d97706"},
        {"id": "utilities", "label": "Utilities & Broadband", "is_income": False, "is_essential": True, "color": "#ca8a04"},
        {"id": "transport", "label": "Fuel & Transport", "is_income": False, "is_essential": True, "color": "#b45309"},
        {"id": "health", "label": "Health & Medicine", "is_income": False, "is_essential": True, "color": "#e11d48"},
        {"id": "insurance", "label": "Insurance Premium", "is_income": False, "is_essential": True, "color": "#0284c7"},
        {"id": "dining", "label": "Dining & Takeout", "is_income": False, "is_essential": False, "color": "#64748b"},
        {"id": "shopping", "label": "Shopping & Lifestyle", "is_income": False, "is_essential": False, "color": "#64748b"},
        {"id": "entertainment", "label": "Entertainment & Subscriptions", "is_income": False, "is_essential": False, "color": "#64748b"},
        {"id": "investments", "label": "Savings & Investments", "is_income": False, "is_essential": False, "color": "#0891b2"},
        {"id": "bills", "label": "General Bills & Charges", "is_income": False, "is_essential": False, "color": "#6b7280"},
        {"id": "other", "label": "Other Uncategorized", "is_income": False, "is_essential": False, "color": "#9ca3af"}
    ]

    # Keyword and Pattern Mappings
    RULES = [
        # --- Platform & Freelance Incomes ---
        {
            "category": "platform_payout",
            "type": "INCOME",
            "confidence": 0.95,
            "patterns": [
                r"\b(zomato|swiggy|blinkit|zepto|dunzo)\b.*(payout|salary|batch|settlement|cr|transfer)",
                r"\b(uber|ola|rapido|porter|shadowfax|urban\s*company)\b",
                r"\b(delivery\s*partner|rider\s*payout|driver\s*settlement)\b"
            ],
            "keywords": ["blinkit commerce", "zomato media", "swiggy partner", "uber b.v", "ani technologies", "rapido payout"]
        },
        {
            "category": "freelance_income",
            "type": "INCOME",
            "confidence": 0.94,
            "patterns": [
                r"\b(upwork|fiverr|toptal|freelancer|guru|peopleperhour)\b",
                r"\b(client\s*(payout|payment|neft|rtgs|imps|credit))\b",
                r"\b(consulting\s*fee|design\s*project|development\s*milestone|invoice\s*pmt)\b",
                r"\b(razorpay\s*software|stripe\s*payout|paypal\s*transfer)\b"
            ],
            "keywords": ["upwork global", "fiverr intl", "stripe payments", "razorpay payout", "client payment", "freelance income"]
        },
        {
            "category": "salary",
            "type": "INCOME",
            "confidence": 0.92,
            "patterns": [
                r"\b(salary|payroll|stipend|wages)\b",
                r"\b(infosys|tcs|wipro|cognizant|accenture|hcl|tech\s*mahindra)\b"
            ],
            "keywords": ["salary credit", "monthly stipend", "payroll transfer"]
        },

        # --- Mandatory Living Essentials ---
        {
            "category": "loan_emi",
            "type": "EXPENSE",
            "confidence": 0.95,
            "patterns": [
                r"\b(emi|loan|nach|ecs\s*mandate|auto\s*debit)\b",
                r"\b(bajaj\s*finance|tvs\s*credit|idfc\s*first|hdfc\s*bank\s*loan|sbi\s*loan)\b",
                r"\b(bike\s*loan|car\s*loan|home\s*loan|personal\s*loan)\b"
            ],
            "keywords": ["emi debit", "nach mandate", "loan repayment", "bajaj finserv", "credit card payment"]
        },
        {
            "category": "rent",
            "type": "EXPENSE",
            "confidence": 0.93,
            "patterns": [
                r"\b(rent|landlord|house\s*rent|society\s*maintenance|flat\s*maintenance)\b",
                r"\b(pg\s*rent|coliving|nestaway|stanza\s*living|nobroker)\b"
            ],
            "keywords": ["house rent", "studio rent", "society maintenance", "landlord pmt", "pg stay"]
        },
        {
            "category": "groceries",
            "type": "EXPENSE",
            "confidence": 0.92,
            "patterns": [
                r"\b(dmart|bigbasket|blinkit|zepto|instamart|nature's\s*basket)\b",
                r"\b(supermarket|hypermarket|kirana|provision|grocer)\b",
                r"\b(reliance\s*smart|spencer|more\s*retail|heritage\s*fresh)\b",
                r"\b(milk|dairy|vegetables|amul|mother\s*dairy)\b"
            ],
            "keywords": ["dmart supermarket", "bigbasket groceries", "supermarket", "kirana store", "daily milk"]
        },
        {
            "category": "utilities",
            "type": "EXPENSE",
            "confidence": 0.92,
            "patterns": [
                r"\b(bescom|tatapower|tata\s*power|adani\s*electricity|mseb|cesc|bwssb|tneb)\b",
                r"\b(airtel|jio|vodafone|vi|bsnl|act\s*corp|act\s*fibernet|hathway)\b",
                r"\b(electricity|water\s*board|gas\s*bill|broadband|wifi|cylinder|indane|bharat\s*gas|hp\s*gas)\b"
            ],
            "keywords": ["electricity bill", "water supply", "act fibernet", "airtel broadband", "jio fiber"]
        },
        {
            "category": "transport",
            "type": "EXPENSE",
            "confidence": 0.90,
            "patterns": [
                r"\b(petrol|diesel|fuel|cng|fastag|toll)\b",
                r"\b(indian\s*oil|iocl|hpcl|bpcl|bharat\s*petroleum|shell\s*petrol)\b",
                r"\b(metro\s*card|irctc|railway|ev\s*battery|battery\s*swapping|bounce\s*infinity)\b"
            ],
            "keywords": ["petrol pump", "fuel station", "ev battery", "battery swap", "fastag recharge", "metro travel"]
        },
        {
            "category": "health",
            "type": "EXPENSE",
            "confidence": 0.92,
            "patterns": [
                r"\b(apollo|medplus|netmeds|1mg|tata\s*1mg|pharmeasy)\b",
                r"\b(hospital|clinic|doctor|pharmacy|chemist|diagnostic|pathlab|dental)\b"
            ],
            "keywords": ["apollo pharmacy", "medplus chemist", "diagnostic lab", "medical clinic"]
        },
        {
            "category": "insurance",
            "type": "EXPENSE",
            "confidence": 0.92,
            "patterns": [
                r"\b(lic|star\s*health|hdfc\s*life|icici\s*prudential|max\s*life|sbi\s*life|acko|digit\s*insurance)\b",
                r"\b(insurance\s*premium|policy\s*bazaar)\b"
            ],
            "keywords": ["insurance premium", "life insurance", "health insurance", "vehicle insurance"]
        },

        # --- Discretionary & Lifestyle ---
        {
            "category": "dining",
            "type": "EXPENSE",
            "confidence": 0.88,
            "patterns": [
                r"\b(starbucks|mcdonald|burger\s*king|kfc|domino|pizza\s*hut|subway)\b",
                r"\b(cafe|restaurant|bistro|diner|dhaba|bakery|chai|coffee)\b",
                r"\b(zomato\s*(order|food)|swiggy\s*(order|food))\b"
            ],
            "keywords": ["starbucks coffee", "dominos pizza", "food order", "cafe coffee", "restaurant dining"]
        },
        {
            "category": "shopping",
            "type": "EXPENSE",
            "confidence": 0.87,
            "patterns": [
                r"\b(amazon|flipkart|myntra|meesho|nykaa|ajio|tata\s*cliq)\b",
                r"\b(zara|h&m|uniqlo|westside|pantaloons|lifestyle)\b"
            ],
            "keywords": ["amazon seller", "flipkart internet", "myntra designs", "online shopping"]
        },
        {
            "category": "entertainment",
            "type": "EXPENSE",
            "confidence": 0.91,
            "patterns": [
                r"\b(netflix|spotify|bookmyshow|pvr|inox|prime\s*video|disney|hotstar|youtube\s*premium|sonyliv)\b"
            ],
            "keywords": ["netflix subscription", "spotify music", "bookmyshow movies", "pvr cinemas"]
        },
        {
            "category": "investments",
            "type": "EXPENSE",
            "confidence": 0.90,
            "patterns": [
                r"\b(zerodha|groww|upstox|angel\s*one|kuvera|coin|smallcase|mutual\s*fund|sip\s*investment)\b"
            ],
            "keywords": ["zerodha broking", "groww invest", "mutual fund sip"]
        }
    ]

    @classmethod
    def clean_narration(cls, text: str) -> str:
        """
        Cleans bank statement/UPI transaction strings into readable merchant names.
        Example:
        'UPI/CR/42819203/ZOMATO/Paytm' -> 'Zomato'
        'NEFT-UPWORK GLOBAL INC-INVOICE9921' -> 'Upwork Global Inc'
        'POS 4910283 DMART BANGALORE IN' -> 'DMart Bangalore'
        """
        if not text:
            return "Transaction"

        cleaned = str(text).strip()

        # Strip common banking prefixes: UPI/CR/, UPI/DR/, NEFT-, RTGS-, IMPS-, POS-, ACH-, NACH-
        cleaned = re.sub(r"^(UPI|NEFT|RTGS|IMPS|POS|ACH|NACH|ECS|BIL|CMS)[\s/:\-_]+(CR|DR)?[\s/:\-_]*", "", cleaned, flags=re.IGNORECASE)
        # Strip trailing reference IDs or numbers: e.g. /19482931/Paytm or - 48293182
        cleaned = re.sub(r"[\s/:\-_]+[0-9]{6,}[\s/:\-_]*.*$", "", cleaned)
        # Strip long hex/numeric IDs
        cleaned = re.sub(r"\b[A-Z0-9]{10,}\b", "", cleaned)
        # Collapse whitespace
        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        # Title case if all caps or all lower
        if cleaned.isupper() or cleaned.islower():
            cleaned = cleaned.title()

        return cleaned if len(cleaned) >= 2 else str(text).strip()

    @classmethod
    def classify(
        cls,
        narration: str,
        amount: Optional[float] = None,
        tx_type_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Determines category, flow type, is_essential flag, and clean title.
        """
        text = str(narration or "").strip().lower()
        clean_title = cls.clean_narration(narration)

        # 1. Match against known rules
        matched_category = None
        matched_type = None
        confidence = 0.50

        for rule in cls.RULES:
            # Check exact keyword substrings first
            for kw in rule.get("keywords", []):
                if kw in text:
                    matched_category = rule["category"]
                    matched_type = rule["type"]
                    confidence = rule["confidence"]
                    break

            if matched_category:
                break

            # Check regex patterns
            for pat in rule.get("patterns", []):
                if re.search(pat, text, re.IGNORECASE):
                    matched_category = rule["category"]
                    matched_type = rule["type"]
                    confidence = rule["confidence"]
                    break

            if matched_category:
                break

        # 2. Determine Transaction Type (INCOME vs EXPENSE)
        if tx_type_hint:
            final_type = tx_type_hint.upper()
        elif matched_type:
            final_type = matched_type
        else:
            # Heuristic from narration hints
            if any(w in text for w in ["credit", "cr", "refund", "cashback", "salary", "payout", "received"]):
                final_type = "INCOME"
            else:
                final_type = "EXPENSE"

        # 3. Final Category Resolution
        if not matched_category:
            if final_type == "INCOME":
                matched_category = "freelance_income"
                confidence = 0.60
            else:
                matched_category = "bills" if any(w in text for w in ["bill", "recharge", "fee", "tax", "charge"]) else "other"
                confidence = 0.50

        is_essential = matched_category in cls.ESSENTIAL_CATEGORIES

        return {
            "clean_description": clean_title,
            "category": matched_category,
            "transaction_type": final_type,
            "is_essential": is_essential,
            "confidence": round(confidence, 2)
        }
