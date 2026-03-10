"""
Similarity Engine — Cosine similarity computation using numpy.
Embeddings are L2-normalized, so cosine similarity = dot product.
"""
import numpy as np
from typing import Union


def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """
    Compute cosine similarity between two 1-D vectors.
    Both vectors are expected to be L2-normalized (from sentence-transformers).
    Returns a score in [0, 1] range.
    """
    # Flatten to 1-D
    a = vec_a.flatten().astype(np.float32)
    b = vec_b.flatten().astype(np.float32)

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    raw_similarity = float(np.dot(a, b) / (norm_a * norm_b))

    # Normalize from [-1, 1] to [0, 1]
    normalized = (raw_similarity + 1) / 2
    return round(float(np.clip(normalized, 0.0, 1.0)), 6)


def compute_semantic_similarity(
    resume_embedding: np.ndarray,
    job_embedding: np.ndarray,
) -> float:
    """
    Compute semantic similarity between a resume and a job description.
    Returns a score in [0, 1].
    """
    return cosine_similarity(resume_embedding, job_embedding)
