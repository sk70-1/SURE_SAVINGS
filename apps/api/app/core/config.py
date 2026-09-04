import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

# Canonical root directory for database resolution
CORE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(CORE_DIR)
API_DIR = os.path.dirname(APP_DIR)
ROOT_DIR = os.path.dirname(API_DIR)
CANONICAL_DB_PATH = os.path.join(API_DIR, "smart_buffer.db").replace("\\", "/")

KNOWN_INSECURE_SECRETS = {
    "",
    "sure_savings_production_secret_key_change_via_env_in_production",
    "sure_savings_dev_secret_key_change_in_production",
    "replace_with_a_long_random_secret",
    "prod_super_secret_sure_savings_key_change_via_env",
    "dev_only_insecure_jwt_secret_key_must_override_in_prod_at_least_32_chars",
    "secret",
    "changeme",
}

DEV_FALLBACK_SECRET = "dev_only_insecure_jwt_secret_key_must_override_in_prod_at_least_32_chars"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "Sure-Savings API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"  # "development" | "staging" | "production"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # CORS: Explicitly allow Next.js on 3000 & 3001 and Render production domains
    CORS_ORIGINS: str = (
        "https://sure-savings-web-pss8.onrender.com,https://sure-savings-web.onrender.com,"
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:3001,http://127.0.0.1:3001,"
        "http://localhost:8000,http://127.0.0.1:8000"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        origins = []
        for origin in self.CORS_ORIGINS.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned and cleaned != "*":
                origins.append(cleaned)
        return origins

    # Database: Supports PostgreSQL (e.g. postgresql://user:pass@localhost:5432/db)
    # with canonical SQLite fallback
    DATABASE_URL: str = Field(
        default_factory=lambda: os.getenv("DATABASE_URL", f"sqlite:///{CANONICAL_DB_PATH}")
    )

    # Security & JWT Auth
    SECRET_KEY: str = Field(default=DEV_FALLBACK_SECRET)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Short-lived 15 min access token
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Cookie settings for refresh token
    REFRESH_COOKIE_NAME: str = "refresh_token"
    REFRESH_COOKIE_SAMESITE: str = "lax"
    REFRESH_COOKIE_PATH: str = "/api/v1/auth"
    REFRESH_COOKIE_SECURE: Optional[bool] = None

    # Demo Mode: Disabled by default. Strictly forbidden in production.
    DEMO_MODE_ENABLED: bool = False

    # AI Explanation Settings
    AI_PROVIDER: str = "deterministic_mock"  # "deterministic_mock" | "gemini" | "openai"
    AI_API_KEY: str = ""

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def is_demo_mode(self) -> bool:
        return bool(self.DEMO_MODE_ENABLED)

    @property
    def cookie_secure(self) -> bool:
        if self.REFRESH_COOKIE_SECURE is not None:
            return self.REFRESH_COOKIE_SECURE
        return self.is_production

    def validate_production_configuration(self) -> None:
        """Validates that security settings are safe for production."""
        if self.is_production:
            if not self.SECRET_KEY or self.SECRET_KEY in KNOWN_INSECURE_SECRETS:
                raise RuntimeError(
                    "FATAL: In production ENVIRONMENT, SECRET_KEY must be provided via environment variable "
                    "and cannot match any known default or placeholder value."
                )
            if len(self.SECRET_KEY) < 32:
                raise RuntimeError(
                    f"FATAL: In production ENVIRONMENT, SECRET_KEY must be at least 32 characters long "
                    f"(current length: {len(self.SECRET_KEY)})."
                )
            if self.DEMO_MODE_ENABLED:
                import logging
                logging.getLogger("uvicorn.error").warning(
                    "SECURITY NOTICE: DEMO_MODE_ENABLED is True in production ENVIRONMENT. "
                    "Demo sandbox personas are active for evaluation. All real user accounts remain strictly isolated."
                )


settings = Settings()
