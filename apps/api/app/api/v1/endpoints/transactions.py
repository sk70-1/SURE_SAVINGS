from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.models import User, Transaction, AuditLog
from app.schemas.schemas import (
    TransactionCreate, TransactionOut,
    CsvPreviewResponse, CsvCommitRequest, CsvCommitResponse, CategoryMetadataOut
)
from app.services.csv_parser_service import CsvParserService
from app.engine.categorization_engine import CategorizationEngine

router = APIRouter()


@router.get("/categories", response_model=List[CategoryMetadataOut])
def get_categories():
    """Returns available financial transaction categories with metadata."""
    return CategorizationEngine.CATEGORY_DEFINITIONS


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


@router.post("/import/preview", response_model=CsvPreviewResponse)
async def preview_transactions_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parses and auto-categorizes uploaded bank/UPI/gig statement CSV.
    Detects potential duplicates and returns preview items for user inspection.
    """
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    try:
        preview_data = CsvParserService.parse_and_preview(
            file_bytes=content,
            current_user=current_user,
            db=db
        )
        return preview_data
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=422, detail="Failed to parse CSV statement. Please verify file format and columns.")


@router.post("/import/confirm", response_model=CsvCommitResponse)
def confirm_transactions_csv(
    commit_req: CsvCommitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Commits approved transactions into the database after user review.
    Re-validates rows and re-checks duplicates against database before inserting.
    """
    if not commit_req.items:
        raise HTTPException(status_code=400, detail="No transactions selected for import.")

    # Query existing database transactions for authoritative deduplication
    existing_txs = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).all()
    existing_lookup = set()
    for t in existing_txs:
        t_date = t.date.strftime("%Y-%m-%d")
        existing_lookup.add((t_date, round(float(t.amount), 2), t.transaction_type.upper()))

    total_inflow = 0.0
    total_outflow = 0.0
    imported_count = 0
    duplicates_skipped = 0
    rejected_count = 0
    seen_in_batch = set()

    for item in commit_req.items:
        parsed_dt = CsvParserService.parse_date(item.date)
        if not parsed_dt:
            rejected_count += 1
            continue

        try:
            amt = round(float(item.amount), 2)
            if amt <= 0:
                rejected_count += 1
                continue
        except (ValueError, TypeError):
            rejected_count += 1
            continue

        ttype = item.transaction_type.upper()
        if ttype not in ("INCOME", "EXPENSE"):
            rejected_count += 1
            continue

        date_str = parsed_dt.strftime("%Y-%m-%d")
        lookup_key = (date_str, amt, ttype)

        # Authoritative server-side duplicate check
        if lookup_key in existing_lookup or lookup_key in seen_in_batch:
            duplicates_skipped += 1
            continue

        seen_in_batch.add(lookup_key)

        if ttype == "INCOME":
            total_inflow += amt
        else:
            total_outflow += amt

        tx = Transaction(
            user_id=current_user.id,
            date=parsed_dt,
            amount=amt,
            description=item.description.strip(),
            category=item.category.lower(),
            transaction_type=ttype,
            is_essential=item.is_essential,
            source=item.source or "csv_import"
        )
        db.add(tx)
        imported_count += 1

    audit = AuditLog(
        user_id=current_user.id,
        action="CSV_CONFIRM_IMPORT",
        details=(
            f"Imported {imported_count} transactions (+₹{total_inflow:,.2f} inflows, "
            f"-₹{total_outflow:,.2f} outflows), skipped {duplicates_skipped} duplicates, rejected {rejected_count} rows"
        )
    )
    db.add(audit)
    db.commit()

    return {
        "imported_count": imported_count,
        "duplicates_skipped": duplicates_skipped,
        "rejected_rows": rejected_count,
        "total_inflow": round(total_inflow, 2),
        "total_outflow": round(total_outflow, 2),
        "message": f"Successfully imported {imported_count} transactions ({duplicates_skipped} duplicates skipped, {rejected_count} rejected)."
    }


@router.post("/import")
async def import_transactions_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Direct legacy import endpoint with intelligent multi-format fallback.
    """
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty CSV file provided.")

    try:
        preview = CsvParserService.parse_and_preview(content, current_user, db)
        # Commit non-duplicate items directly
        imported_count = 0
        for item in preview["items"]:
            if item["is_duplicate"]:
                continue
            parsed_dt = CsvParserService.parse_date(item["date"])
            if not parsed_dt:
                continue
            tx = Transaction(
                user_id=current_user.id,
                date=parsed_dt,
                amount=item["amount"],
                description=item["clean_description"] or item["description"],
                category=item["category"],
                transaction_type=item["transaction_type"],
                is_essential=item["is_essential"],
                source="csv_import"
            )
            db.add(tx)
            imported_count += 1

        db.commit()
        return {
            "message": f"Successfully ingested {imported_count} transactions.",
            "imported": imported_count,
            "duplicates_skipped": preview["duplicate_rows"]
        }
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=422, detail="Failed to import CSV statement.")
