from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.v1.api import api_router
from app.schemas.schemas import HealthOut
from app.models.models import User

# Ensure database tables are created
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Deterministic Financial Intelligence and Safe Reserve Engine for Irregular Earners."
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
