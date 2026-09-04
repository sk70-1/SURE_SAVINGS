"""0001_security_hardening

Revision ID: 0001_security_hardening
Revises: 
Create Date: 2026-09-04 05:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001_security_hardening"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create refresh_tokens table if not existing
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "refresh_tokens" not in tables:
        op.create_table(
            "refresh_tokens",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("token_jti", sa.String(length=64), nullable=False),
            sa.Column("token_hash", sa.String(length=128), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("revoked", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("revoked_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("user_agent", sa.String(length=255), nullable=True),
            sa.Column("ip_address", sa.String(length=45), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id")
        )
        op.create_index(op.f("ix_refresh_tokens_id"), "refresh_tokens", ["id"], unique=False)
        op.create_index(op.f("ix_refresh_tokens_user_id"), "refresh_tokens", ["user_id"], unique=False)
        op.create_index(op.f("ix_refresh_tokens_token_jti"), "refresh_tokens", ["token_jti"], unique=True)
        op.create_index(op.f("ix_refresh_tokens_token_hash"), "refresh_tokens", ["token_hash"], unique=False)
        op.create_index(op.f("ix_refresh_tokens_revoked"), "refresh_tokens", ["revoked"], unique=False)

    # 2. Add composite indexes if they do not exist
    if "transactions" in tables:
        indexes = [idx["name"] for idx in inspector.get_indexes("transactions")]
        if "ix_transactions_dedup" not in indexes:
            op.create_index("ix_transactions_dedup", "transactions", ["user_id", "date", "amount", "transaction_type"])

    if "money_allocation_plans" in tables:
        indexes = [idx["name"] for idx in inspector.get_indexes("money_allocation_plans")]
        if "ix_plans_user_status" not in indexes:
            op.create_index("ix_plans_user_status", "money_allocation_plans", ["user_id", "status"])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "transactions" in tables:
        indexes = [idx["name"] for idx in inspector.get_indexes("transactions")]
        if "ix_transactions_dedup" in indexes:
            op.drop_index("ix_transactions_dedup", table_name="transactions")

    if "money_allocation_plans" in tables:
        indexes = [idx["name"] for idx in inspector.get_indexes("money_allocation_plans")]
        if "ix_plans_user_status" in indexes:
            op.drop_index("ix_plans_user_status", table_name="money_allocation_plans")

    if "refresh_tokens" in tables:
        op.drop_table("refresh_tokens")
