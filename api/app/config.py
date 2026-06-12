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

    # Public base URL of this API — used to build dev upload URLs when R2 is unconfigured.
    api_base_url: str = "http://localhost:8000"

    # Cloudflare R2 (S3-compatible) for avatar uploads. Leave blank to use the local
    # dev upload fallback (presign returns a URL served by this API instead of R2).
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = ""
    r2_public_base_url: str = ""  # public base for objects, e.g. https://cdn.example.com

    # Razorpay (TEST MODE). Leave key_id/key_secret blank to use the dev payment fallback
    # (simulates authorize->held on checkout and capture->released on complete).
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""

    # Platform service fee percent, deducted from the agreed amount at release.
    service_fee_percent: int = 15

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def r2_configured(self) -> bool:
        return bool(
            self.r2_account_id
            and self.r2_access_key_id
            and self.r2_secret_access_key
            and self.r2_bucket
        )

    @property
    def razorpay_configured(self) -> bool:
        return bool(self.razorpay_key_id and self.razorpay_key_secret)


@lru_cache
def get_settings() -> Settings:
    return Settings()
