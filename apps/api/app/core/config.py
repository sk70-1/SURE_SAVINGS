import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

# Canonical root directory for database resolution
CORE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(CORE_DIR)
API_DIR = os.path.dirname(APP_DIR)
ROOT_DIR = os.path.dirname(API_DIR)
CANONICAL_DB_PATH = os.path.join(API_DIR, "smart_buffer.db").replace("\\", "/")


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sure-Savings API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"  # "development" | "staging" | "production"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # CORS: Explicitly allow Next.js on 3000 & 3001
    CORS_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:3001,http://127.0.0.1:3001,"
        "http://localhost:8000,http://127.0.0.1:8000"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # Database: Supports PostgreSQL (e.g. postgresql://user:pass@localhost:5432/db)
    # with canonical SQLite fallback
    DATABASE_URL: str = Field(
        default_factory=lambda: os.getenv("DATABASE_URL", f"sqlite:///{CANONICAL_DB_PATH}")
    )

    # Security & JWT Auth
    SECRET_KEY: str = "sure_savings_production_secret_key_change_via_env_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Demo Mode: When True, demo sandbox personas are accessible
    # When False, strictly authenticates individual real users only
    DEMO_MODE_ENABLED: bool = True

    # AI Explanation Settings
    AI_PROVIDER: str = "deterministic_mock"  # "deterministic_mock" | "gemini" | "openai"
    AI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
