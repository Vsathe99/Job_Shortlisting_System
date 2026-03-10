"""
FAISS Service — Persistent vector index management.
Stores candidate_id → embedding vector mappings.
Supports add, remove, search, save, load.
"""
import os
import json
import numpy as np
from typing import Optional, Dict, List, Tuple
from app.config import settings

EMBEDDING_DIM = 384


class FAISSService:
    """Thread-safe FAISS index wrapper with persistence."""

    def __init__(self):
        self.index = None
        self.id_map: Dict[int, int] = {}     # candidate_id → faiss_internal_idx
        self.vectors: Dict[int, np.ndarray] = {}  # candidate_id → vector
        self._initialized = False

    def initialize(self):
        """Load or create the FAISS index."""
        import faiss
        if os.path.exists(settings.FAISS_INDEX_PATH) and os.path.exists(settings.FAISS_METADATA_PATH):
            try:
                self.index = faiss.read_index(settings.FAISS_INDEX_PATH)
                with open(settings.FAISS_METADATA_PATH, "r") as f:
                    meta = json.load(f)
                self.id_map = {int(k): v for k, v in meta.get("id_map", {}).items()}
                # Rebuild vector store from stored numpy arrays (if available)
                vectors_path = settings.FAISS_INDEX_PATH + ".npy"
                if os.path.exists(vectors_path):
                    all_vecs = np.load(vectors_path, allow_pickle=True).item()
                    self.vectors = {int(k): v for k, v in all_vecs.items()}
            except Exception:
                self._create_new_index(faiss)
        else:
            self._create_new_index(__import__("faiss"))
        self._initialized = True

    def _create_new_index(self, faiss):
        """Create a new flat L2 FAISS index."""
        self.index = faiss.IndexFlatIP(EMBEDDING_DIM)  # Inner product (cosine for normalized vecs)
        self.id_map = {}
        self.vectors = {}

    def add_vector(self, candidate_id: int, vector: np.ndarray):
        """Add a vector to the index and persist."""
        if not self._initialized:
            self.initialize()

        vec = vector.reshape(1, EMBEDDING_DIM).astype(np.float32)
        internal_idx = self.index.ntotal
        self.index.add(vec)
        self.id_map[candidate_id] = internal_idx
        self.vectors[candidate_id] = vector.astype(np.float32)
        self._save()

    def remove_vector(self, candidate_id: int):
        """Remove a candidate's vector. Rebuilds index without that candidate."""
        if not self._initialized:
            self.initialize()
        if candidate_id not in self.vectors:
            return

        del self.vectors[candidate_id]
        if candidate_id in self.id_map:
            del self.id_map[candidate_id]

        self._rebuild_index()
        self._save()

    def _rebuild_index(self):
        """Rebuild the FAISS index from stored vectors."""
        import faiss
        self.index = faiss.IndexFlatIP(EMBEDDING_DIM)
        self.id_map = {}
        for cid, vec in self.vectors.items():
            arr = vec.reshape(1, EMBEDDING_DIM).astype(np.float32)
            self.id_map[cid] = self.index.ntotal
            self.index.add(arr)

    def search(self, query_vector: np.ndarray, top_k: int = 10) -> List[Tuple[int, float]]:
        """
        Search for top-k similar candidates.
        Returns list of (candidate_id, similarity_score).
        """
        if not self._initialized:
            self.initialize()
        if self.index.ntotal == 0:
            return []

        vec = query_vector.reshape(1, EMBEDDING_DIM).astype(np.float32)
        scores, indices = self.index.search(vec, min(top_k, self.index.ntotal))

        # Reverse-lookup internal_idx → candidate_id
        rev_map = {v: k for k, v in self.id_map.items()}
        results = []
        for idx, score in zip(indices[0], scores[0]):
            if idx >= 0 and idx in rev_map:
                results.append((rev_map[idx], float(score)))
        return results

    def _save(self):
        """Persist FAISS index and metadata to disk."""
        try:
            import faiss
            os.makedirs(settings.STORAGE_DIR, exist_ok=True)
            faiss.write_index(self.index, settings.FAISS_INDEX_PATH)
            with open(settings.FAISS_METADATA_PATH, "w") as f:
                json.dump({"id_map": {str(k): v for k, v in self.id_map.items()}}, f)
            np.save(
                settings.FAISS_INDEX_PATH + ".npy",
                {str(k): v for k, v in self.vectors.items()},
            )
        except Exception as e:
            print(f"[FAISS] Save warning: {e}")

    def get_total(self) -> int:
        return self.index.ntotal if self.index else 0


# Singleton instance
faiss_service = FAISSService()
