from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI Resume Shortlisting Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Security
    JWT_SECRET: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database (MongoDB)
    MONGODB_URL: str = "mongodb://mongodb:27017/ats_db"

    # Storage
    STORAGE_DIR: str = "storage"
    RESUMES_DIR: str = "storage/resumes"

    # ML Models
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    SPACY_MODEL: str = "en_core_web_sm"
    FAISS_INDEX_PATH: str = "storage/faiss_index.bin"
    FAISS_METADATA_PATH: str = "storage/faiss_metadata.json"

    # Ranking weights
    SEMANTIC_WEIGHT: float = 0.7
    SKILL_WEIGHT: float = 0.3

    # Shortlisting thresholds
    TOP_CANDIDATE_THRESHOLD: float = 0.75
    POTENTIAL_CANDIDATE_THRESHOLD: float = 0.50

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

# Ensure storage directories exist
os.makedirs(settings.RESUMES_DIR, exist_ok=True)
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
