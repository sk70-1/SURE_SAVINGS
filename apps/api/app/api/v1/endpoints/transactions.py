from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.models import User, Transaction, AuditLog
from app.schemas.schemas import TransactionCreate, TransactionOut

router = APIRouter()


@router.get("", response_model=List[TransactionOut])
def get_transactions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    transaction_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type.upper())
    
    return query.order_by(Transaction.date.desc()).offset(offset).limit(limit).all()


@router.post("", response_model=TransactionOut)
def create_transaction(
    tx_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tx = Transaction(
        user_id=current_user.id,
        date=tx_in.date,
        amount=tx_in.amount,
        description=tx_in.description,
        category=tx_in.category.lower(),
        transaction_type=tx_in.transaction_type.upper(),
        is_essential=tx_in.is_essential,
        source=tx_in.source
    )
    db.add(tx)

    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE_TRANSACTION",
        details=f"Added {tx.transaction_type} of ₹{tx.amount:,.2f} for '{tx.description}'"
    )
    db.add(audit)
    db.commit()
    db.refresh(tx)
    return tx


@router.post("/import")
async def import_transactions_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parses CSV transaction file.
    Expected columns: date, amount, description, category, transaction_type, is_essential
    """
    content = await file.read()
    lines = content.decode("utf-8-sig").splitlines()
    if not lines:
        raise HTTPException(status_code=400, detail="Empty CSV file provided.")

    imported_count = 0
    header = [h.strip().lower() for h in lines[0].split(",")]

    for line in lines[1:]:
        if not line.strip():
            continue
        parts = [p.strip() for p in line.split(",")]
        row = dict(zip(header, parts))
        try:
            date_val = datetime.fromisoformat(row.get("date", datetime.utcnow().isoformat()))
            amt = float(row.get("amount", 0.0))
            desc = row.get("description", "Imported statement item")
            cat = row.get("category", "other").lower()
            ttype = row.get("transaction_type", "EXPENSE").upper()
            is_ess = row.get("is_essential", "false").lower() in ["true", "1", "yes"]

            tx = Transaction(
                user_id=current_user.id,
                date=date_val,
                amount=amt,
                description=desc,
                category=cat,
                transaction_type=ttype,
                is_essential=is_ess,
                source="csv_import"
            )
            db.add(tx)
            imported_count += 1
        except Exception:
            continue

    db.commit()
    return {"message": f"Successfully ingested {imported_count} transactions."}
