from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, transactions, income, buffer, resilience, recommendations, notifications, ai, allocation
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(income.router, prefix="/income", tags=["income"])
api_router.include_router(buffer.router, prefix="/buffer", tags=["buffer"])
api_router.include_router(resilience.router, prefix="/resilience", tags=["resilience"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(allocation.router, prefix="/allocation", tags=["allocation"])

