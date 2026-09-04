"""
Multi-Format CSV Statement Parser & Deduplication Service.
Parses bank statements, UPI exports, and gig platform payout CSVs.
"""

import csv
import io
import re
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.models import Transaction, User
from app.engine.categorization_engine import CategorizationEngine


class CsvParserService:
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB maximum
    MAX_ROW_COUNT = 10000            # 10,000 rows maximum

    DATE_FORMATS = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%m/%d/%Y",
        "%d/%m/%y",
        "%d-%m-%y",
        "%d-%b-%Y",
        "%d-%b-%y",
        "%d %b %Y",
        "%Y/%m/%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ"
    ]

    @staticmethod
    def normalize_description(text: str) -> str:
        """Strip extra whitespace and normalize description for deduplication comparison."""
        return re.sub(r"\s+", " ", str(text).strip()).lower()

    @staticmethod
    def clean_amount(val: Any) -> Optional[float]:
        if val is None:
            return None
        text = str(val).strip()
        if not text or text == "-" or text.lower() == "nan" or text.lower() == "null":
            return None

        # Check for negative accounting parenthesis: e.g. (1,400.00)
        is_negative = False
        if text.startswith("(") and text.endswith(")"):
            is_negative = True
            text = text[1:-1]
        elif text.startswith("-"):
            is_negative = True
            text = text[1:]

        # Strip currency symbols and commas
        cleaned = re.sub(r"[^\d.]", "", text)
        if not cleaned:
            return None

        try:
            amt = float(cleaned)
            return -amt if is_negative else amt
        except ValueError:
            return None

    @classmethod
    def parse_date(cls, text: Any) -> Optional[datetime]:
        if not text:
            return None
        cleaned = str(text).strip()
        # Remove time component if present for simple parsing
        date_part = cleaned.split(" ")[0].split("T")[0]

        for fmt in cls.DATE_FORMATS:
            try:
                dt = datetime.strptime(date_part, fmt)
                return dt.replace(tzinfo=timezone.utc)
            except ValueError:
                pass

        # Try full string with time
        for fmt in cls.DATE_FORMATS:
            try:
                dt = datetime.strptime(cleaned, fmt)
                return dt.replace(tzinfo=timezone.utc)
            except ValueError:
                pass

        return None

    @classmethod
    def identify_columns(cls, headers: List[str]) -> Dict[str, Optional[str]]:
        """
        Intelligently maps raw CSV headers to logical column names.
        """
        mapping: Dict[str, Optional[str]] = {
            "date": None,
            "description": None,
            "amount": None,
            "debit": None,
            "credit": None,
            "type": None,
            "category": None,
            "is_essential": None,
        }

        for h in headers:
            clean = h.strip().lower()

            # Date
            if not mapping["date"] and any(k in clean for k in ["date", "txn date", "tx date", "value date", "post date"]):
                mapping["date"] = h

            # Description / Narration
            elif not mapping["description"] and any(k in clean for k in ["description", "narration", "particulars", "remarks", "details", "memo", "merchant", "payee"]):
                mapping["description"] = h

            # Debit / Withdrawal
            elif not mapping["debit"] and any(k in clean for k in ["debit", "withdrawal", "dr amount", "dr", "expense"]):
                mapping["debit"] = h

            # Credit / Deposit
            elif not mapping["credit"] and any(k in clean for k in ["credit", "deposit", "cr amount", "cr", "income"]):
                mapping["credit"] = h

            # Generic Amount
            elif not mapping["amount"] and any(k in clean for k in ["amount", "txn amount", "net amount"]):
                mapping["amount"] = h

            # Type
            elif not mapping["type"] and any(k in clean for k in ["type", "cr/dr", "transaction type", "dr/cr"]):
                mapping["type"] = h

            # Category (if user already exports with category)
            elif not mapping["category"] and "category" in clean:
                mapping["category"] = h

            # Essential
            elif not mapping["is_essential"] and any(k in clean for k in ["essential", "is_essential"]):
                mapping["is_essential"] = h

        return mapping

    @classmethod
    def parse_and_preview(
        cls,
        file_bytes: bytes,
        current_user: User,
        db: Session
    ) -> Dict[str, Any]:
        """
        Parses CSV content, auto-classifies transactions, and checks for duplicates.
        Enforces maximum size (5 MB) and maximum rows (10,000).
        Rejects invalid date formats explicitly.
        """
        if len(file_bytes) > cls.MAX_FILE_SIZE:
            raise ValueError(f"File size ({len(file_bytes) / (1024 * 1024):.1f} MB) exceeds maximum allowed limit of 5 MB.")

        # Decode bytes with fallback encoding support
        text_content = ""
        for encoding in ["utf-8-sig", "utf-8", "latin1", "cp1252"]:
            try:
                text_content = file_bytes.decode(encoding)
                break
            except UnicodeDecodeError:
                continue

        if not text_content.strip():
            raise ValueError("CSV file is empty or could not be decoded.")

        # Read CSV rows
        f = io.StringIO(text_content)
        reader = csv.reader(f)
        rows = list(reader)

        if not rows:
            raise ValueError("CSV contains no rows.")

        if len(rows) > cls.MAX_ROW_COUNT + 1:
            raise ValueError(f"File contains {len(rows)} rows, exceeding maximum limit of {cls.MAX_ROW_COUNT} rows.")

        # Find header row (first non-empty row)
        header_idx = 0
        while header_idx < len(rows) and not any(rows[header_idx]):
            header_idx += 1

        if header_idx >= len(rows):
            raise ValueError("No header row detected in CSV.")

        raw_headers = [h.strip() for h in rows[header_idx]]
        col_map = cls.identify_columns(raw_headers)

        # Fallbacks if columns are missing
        if not col_map["date"]:
            col_map["date"] = raw_headers[0]

        if not col_map["description"]:
            for h in raw_headers:
                if h != col_map["date"] and h != col_map["amount"] and h != col_map["debit"] and h != col_map["credit"]:
                    col_map["description"] = h
                    break

        # Calculate import batch fingerprint
        batch_fingerprint = hashlib.sha256(file_bytes + f":{current_user.id}".encode("utf-8")).hexdigest()

        # Load existing user transactions to cross-check duplicates
        existing_txs = db.query(Transaction).filter(
            Transaction.user_id == current_user.id
        ).all()

        existing_lookup = set()
        for t in existing_txs:
            t_date = t.date.strftime("%Y-%m-%d")
            existing_lookup.add((t_date, round(float(t.amount), 2), t.transaction_type.upper()))

        items: List[Dict[str, Any]] = []
        total_inflow = 0.0
        total_outflow = 0.0
        duplicate_count = 0
        seen_in_batch = set()

        # Parse data rows
        for row_idx, row in enumerate(rows[header_idx + 1:], start=header_idx + 1):
            if not row or not any(row):
                continue

            row_dict = dict(zip(raw_headers, [c.strip() for c in row]))

            # 1. Parse Date - Strictly reject invalid dates without silent fallback to today
            raw_date = row_dict.get(col_map["date"] or "", "")
            parsed_dt = cls.parse_date(raw_date)
            if not parsed_dt:
                raise ValueError(
                    f"Row {row_idx}: Invalid or unparseable date '{raw_date}'. "
                    f"Please provide a valid date format (e.g. YYYY-MM-DD or DD/MM/YYYY)."
                )
            date_str = parsed_dt.strftime("%Y-%m-%d")

            # 2. Parse Description
            raw_desc = row_dict.get(col_map["description"] or "", "Bank Transaction")
            if not raw_desc:
                raw_desc = "Imported Item"

            # 3. Determine Amount & Transaction Type
            final_amount = 0.0
            tx_type = "EXPENSE"

            if col_map["debit"] and col_map["credit"]:
                debit_amt = cls.clean_amount(row_dict.get(col_map["debit"], ""))
                credit_amt = cls.clean_amount(row_dict.get(col_map["credit"], ""))

                if credit_amt and credit_amt > 0:
                    final_amount = credit_amt
                    tx_type = "INCOME"
                elif debit_amt and debit_amt > 0:
                    final_amount = debit_amt
                    tx_type = "EXPENSE"
                elif col_map["amount"]:
                    single_amt = cls.clean_amount(row_dict.get(col_map["amount"], ""))
                    if single_amt is not None:
                        final_amount = abs(single_amt)
                        tx_type = "INCOME" if single_amt > 0 else "EXPENSE"
            elif col_map["amount"]:
                raw_amt = cls.clean_amount(row_dict.get(col_map["amount"], ""))
                if raw_amt is not None:
                    final_amount = abs(raw_amt)
                    if raw_amt < 0:
                        tx_type = "EXPENSE"
                    else:
                        type_str = (row_dict.get(col_map["type"] or "", "")).upper()
                        if any(t in type_str for t in ["CR", "CREDIT", "INCOME", "DEPOSIT"]):
                            tx_type = "INCOME"
                        elif any(t in type_str for t in ["DR", "DEBIT", "EXPENSE", "WITHDRAWAL"]):
                            tx_type = "EXPENSE"
                        else:
                            # Let classification engine decide
                            tx_type = "EXPENSE"

            if final_amount <= 0:
                continue

            # 4. Smart Auto-Categorization
            classified = CategorizationEngine.classify(
                narration=raw_desc,
                amount=final_amount,
                tx_type_hint=tx_type
            )

            category = row_dict.get(col_map["category"] or "") or classified["category"]
            clean_title = classified["clean_description"]
            is_essential = classified["is_essential"]
            if col_map["is_essential"]:
                raw_ess = row_dict.get(col_map["is_essential"], "").lower()
                if raw_ess in ["true", "1", "yes"]:
                    is_essential = True
                elif raw_ess in ["false", "0", "no"]:
                    is_essential = False

            # 5. Duplicate Detection
            amt_rounded = round(final_amount, 2)
            lookup_key = (date_str, amt_rounded, tx_type)

            is_duplicate = False
            duplicate_reason = None

            if lookup_key in existing_lookup:
                is_duplicate = True
                duplicate_reason = f"Already exists in your transactions on {date_str} (₹{amt_rounded:,.2f})"
                duplicate_count += 1
            elif lookup_key in seen_in_batch:
                is_duplicate = True
                duplicate_reason = f"Duplicate entry within this CSV file on {date_str}"
                duplicate_count += 1
            else:
                seen_in_batch.add(lookup_key)

            if tx_type == "INCOME":
                total_inflow += final_amount
            else:
                total_outflow += final_amount

            items.append({
                "row_index": row_idx,
                "date": date_str,
                "description": raw_desc,
                "clean_description": clean_title,
                "amount": round(final_amount, 2),
                "transaction_type": tx_type,
                "category": category,
                "is_essential": is_essential,
                "confidence": classified["confidence"],
                "is_duplicate": is_duplicate,
                "duplicate_reason": duplicate_reason,
                "selected": not is_duplicate  # Default selected if not a duplicate
            })

        return {
            "total_rows": len(items),
            "valid_rows": len(items) - duplicate_count,
            "duplicate_rows": duplicate_count,
            "total_inflow": round(total_inflow, 2),
            "total_outflow": round(total_outflow, 2),
            "batch_fingerprint": batch_fingerprint,
            "items": items
        }
