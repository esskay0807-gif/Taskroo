from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment variables / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql+psycopg://taskmarket:taskmarket@localhost:5432/taskmarket"

    # Clerk JWT verification.
    # CLERK_JWKS_URL is the JWKS endpoint for your Clerk instance, e.g.
    #   https://<your-subdomain>.clerk.accounts.dev/.well-known/jwks.json
    # CLERK_ISSUER is the `iss` claim Clerk puts on session tokens, e.g.
    #   https://<your-subdomain>.clerk.accounts.dev
    clerk_jwks_url: str = ""
    clerk_issuer: str = ""
    clerk_audience: str = ""  # optional; leave blank to skip audience checks

    # Local development convenience: when true, /v1/me skips Clerk verification and
    # returns a synthetic dev user so the app can be exercised without a live token.
    # NEVER enable in production.
    dev_auth_bypass: bool = False

    # CORS — comma-separated list of allowed web origins.
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
