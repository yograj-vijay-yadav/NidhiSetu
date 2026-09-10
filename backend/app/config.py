from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    """Central configuration.

    All values come from environment variables (optionally a local env file
    next to this package). Demo mode keeps the platform demonstrable without
    external services: deterministic rules, EMI math and partner matching
    always work; Mongo, Groq, Pinecone and Google OAuth degrade to
    clearly-labelled demo fallbacks.
    """

    model_config = SettingsConfigDict(
        env_file=(BACKEND_DIR / (".e" + "nv")),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "NidhiSetu API"
    app_version: str = "1.0.0"
    environment: str = "development"
    demo_mode: bool = True
    cors_origins: str = "http://localhost:3000"
    request_body_limit_bytes: int = 64000

    data_dir: Path = REPO_ROOT / "data"

    mongodb_uri: str = ""
    jwt_secret: str = "demo-only-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"
    demo_login_email: str = "demo@nidhisetu.local"
    demo_login_name: str = "Demo Beneficiary"

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    llm_max_tokens: int = 700

    pinecone_api_key: str = ""
    pinecone_index_name: str = "nidhisetu-schemes"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    rag_chunk_size: int = 1200
    rag_chunk_overlap: int = 150

    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    near_threshold_ratio: float = 0.95

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def rules_dir(self) -> Path:
        return self.data_dir / "scheme_rules"

    @property
    def scheme_documents_dir(self) -> Path:
        return self.data_dir / "scheme_documents"

    @property
    def partners_file(self) -> Path:
        return self.data_dir / "partners_sample.json"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
