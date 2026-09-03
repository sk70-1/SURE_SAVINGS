from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.v1.api import api_router
from app.schemas.schemas import HealthOut
from app.models.models import User

from contextlib import asynccontextmanager
import time

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Resilient database connection on cloud container startup
    for attempt in range(5):
        try:
            Base.metadata.create_all(bind=engine)
            print("Database connected and schema initialized successfully.")

            # Auto-seed initial demo personas if fresh database (0 demo users)
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


@app.get("/api/v1/seed", tags=["admin"])
def trigger_seed():
    """Endpoint to seed or re-seed initial personas without requiring a terminal."""
    from app.db.seed import seed_database
    seed_database()
    return {"status": "success", "message": "Database seeded successfully!"}

