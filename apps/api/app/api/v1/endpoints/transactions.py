from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
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
    """Retrieve transactions strictly isolated to current user."""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type.upper())
    
    return query.order_by(Transaction.date.desc()).offset(offset).limit(limit).all()


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a manual transaction for current user."""
    tx = Transaction(
        user_id=current_user.id,
        date=tx_in.date,
        amount=tx_in.amount,
        description=tx_in.description,
        category=tx_in.category.lower(),
        transaction_type=tx_in.transaction_type.upper(),
        is_essential=tx_in.is_essential,
        source=tx_in.source or "manual"
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


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a transaction strictly owned by current user."""
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()

    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found or you do not have permission to delete it."
        )

    db.delete(tx)
    audit = AuditLog(
        user_id=current_user.id,
        action="DELETE_TRANSACTION",
        details=f"Deleted transaction {transaction_id} ('{tx.description}')"
    )
    db.add(audit)
    db.commit()
    return {"message": "Transaction deleted successfully."}


@router.post("/import")
async def import_transactions_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parses CSV transaction file with duplicate prevention and user isolation.
    Expected columns: date, amount, description, category, transaction_type, is_essential
    """
    content = await file.read()
    lines = content.decode("utf-8-sig").splitlines()
    if not lines:
        raise HTTPException(status_code=400, detail="Empty CSV file provided.")

    imported_count = 0
    duplicate_count = 0
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

            # Duplicate prevention check
            existing = db.query(Transaction).filter(
                Transaction.user_id == current_user.id,
                Transaction.date == date_val,
                Transaction.amount == amt,
                Transaction.description == desc
            ).first()

            if existing:
                duplicate_count += 1
                continue

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

    audit = AuditLog(
        user_id=current_user.id,
        action="CSV_IMPORT",
        details=f"Imported {imported_count} transactions (skipped {duplicate_count} duplicates)"
    )
    db.add(audit)
    db.commit()
    return {
        "message": f"Successfully ingested {imported_count} transactions.",
        "imported": imported_count,
        "duplicates_skipped": duplicate_count
    }
