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
        self.id_map: Dict[str, int] = {}     # candidate_id (str) → faiss_internal_idx (int)
        self.vectors: Dict[str, np.ndarray] = {}  # candidate_id (str) → vector
        self._initialized = False

    def initialize(self):
        """Load or create the FAISS index."""
        import faiss
        if os.path.exists(settings.FAISS_INDEX_PATH) and os.path.exists(settings.FAISS_METADATA_PATH):
            try:
                self.index = faiss.read_index(settings.FAISS_INDEX_PATH)
                with open(settings.FAISS_METADATA_PATH, "r") as f:
                    meta = json.load(f)
                # Ensure keys are strings
                self.id_map = {str(k): v for k, v in meta.get("id_map", {}).items()}
                
                # Rebuild vector store from stored numpy arrays
                vectors_path = settings.FAISS_INDEX_PATH + ".npy"
                if os.path.exists(vectors_path):
                    all_vecs = np.load(vectors_path, allow_pickle=True).item()
                    self.vectors = {str(k): v for k, v in all_vecs.items()}
            except Exception as e:
                print(f"[FAISS] Load error, creating new: {e}")
                self._create_new_index(faiss)
        else:
            self._create_new_index(__import__("faiss"))
        self._initialized = True

    def _create_new_index(self, faiss):
        """Create a new flat L2 FAISS index."""
        self.index = faiss.IndexFlatIP(EMBEDDING_DIM)
        self.id_map = {}
        self.vectors = {}

    def add_vector(self, candidate_id: str, vector: np.ndarray):
        """Add a vector to the index and persist."""
        if not self._initialized:
            self.initialize()

        vec = vector.reshape(1, EMBEDDING_DIM).astype(np.float32)
        internal_idx = self.index.ntotal
        self.index.add(vec)
        self.id_map[str(candidate_id)] = internal_idx
        self.vectors[str(candidate_id)] = vector.astype(np.float32)
        self._save()

    def remove_vector(self, candidate_id: str):
        """Remove a candidate's vector. Rebuilds index without that candidate."""
        if not self._initialized:
            self.initialize()
        
        cid_str = str(candidate_id)
        if cid_str not in self.vectors:
            return

        del self.vectors[cid_str]
        if cid_str in self.id_map:
            del self.id_map[cid_str]

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

    def search(self, query_vector: np.ndarray, top_k: int = 10) -> List[Tuple[str, float]]:
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
                json.dump({"id_map": self.id_map}, f)
            np.save(
                settings.FAISS_INDEX_PATH + ".npy",
                self.vectors,
            )
        except Exception as e:
            print(f"[FAISS] Save warning: {e}")

    def get_total(self) -> int:
        return self.index.ntotal if self.index else 0


# Singleton instance
faiss_service = FAISSService()
