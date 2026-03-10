"""
BERT Embedding Engine using sentence-transformers/all-MiniLM-L6-v2.
Singleton model loader — model loaded once on startup.
Embedding size: 384 dimensions.
"""
import numpy as np
from functools import lru_cache
from typing import Union, List
from app.config import settings


@lru_cache(maxsize=1)
def _load_model():
    """Load SentenceTransformer model once and cache."""
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return model


def embed(text: str) -> np.ndarray:
    """
    Generate a 384-d embedding vector for a single text.
    Returns: np.ndarray of shape (384,), dtype float32.
    """
    model = _load_model()
    # Truncate to 512 tokens equivalent (~2000 chars) for speed
    truncated = text[:4096]
    vector = model.encode(truncated, normalize_embeddings=True)
    return vector.astype(np.float32)


def embed_batch(texts: List[str], batch_size: int = 32) -> np.ndarray:
    """
    Generate embeddings for a batch of texts.
    Returns: np.ndarray of shape (N, 384), dtype float32.
    """
    model = _load_model()
    truncated = [t[:4096] for t in texts]
    vectors = model.encode(truncated, batch_size=batch_size, normalize_embeddings=True)
    return vectors.astype(np.float32)


def get_model():
    """Public accessor for the loaded model."""
    return _load_model()
