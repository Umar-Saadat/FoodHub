"""Environment-backed settings. Secrets are never hardcoded."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./foodhub.db"
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""
    COOKIE_SECURE: bool = False
    DEMO_TRACKING: bool = False
    CURRENCY: str = "usd"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def stripe_enabled(self) -> bool:
        return bool(self.STRIPE_SECRET_KEY.strip())


settings = Settings()
