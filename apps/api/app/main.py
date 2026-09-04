from contextlib import asynccontextmanager
import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.v1.api import api_router
from app.schemas.schemas import HealthOut
from app.models.models import User

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Production guardrail: immediately validate critical production configuration
    settings.validate_production_configuration()

    # Resilient database connection on cloud container startup
    for attempt in range(5):
        try:
            Base.metadata.create_all(bind=engine)
            print("Database connected and schema initialized successfully.")

            # Auto-seed initial demo personas only if demo mode is enabled
            if settings.is_demo_mode:
                try:
                    db = SessionLocal()
                    demo_count = db.query(User).filter(User.is_demo == True).count()
                    db.close()
                    if demo_count == 0:
                        print("Fresh database detected. Auto-seeding initial demo personas...")
                        from app.db.seed import seed_database
                        seed_database()
                        print("Auto-seeding completed successfully!")
                except Exception as se:
                    print(f"Auto-seed check notice: {se}")

            break
        except Exception as e:
            print(f"Database connection attempt {attempt + 1}/5: {e}")
            time.sleep(2)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Deterministic Financial Intelligence and Safe Reserve Engine for Irregular Earners.",
    lifespan=lifespan
)


# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        return response


app.add_middleware(SecurityHeadersMiddleware)

# CORS Configuration: restricted strictly to configured origins and allowed headers/methods
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https://.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Demo-Persona", "Accept"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Centralized exception handler to sanitize 500 errors and avoid leaking internal traces."""
    logger.exception(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )


# Mount API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health", response_model=HealthOut, tags=["health"])
@app.get("/api/v1/health", response_model=HealthOut, tags=["health"])
def health_check():
    db_ok = False
    try:
        db = SessionLocal()
        db.execute(Base.metadata.tables["users"].select().limit(1))
        db_ok = True
        db.close()
    except Exception:
        db_ok = False

    return HealthOut(
        status="healthy" if db_ok else "degraded",
        environment=settings.ENVIRONMENT,
        version=settings.VERSION,
        database_connected=db_ok
    )


@app.get("/", tags=["root"])
def root_redirect():
    return {
        "message": "Welcome to Smart Income Buffer API",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

