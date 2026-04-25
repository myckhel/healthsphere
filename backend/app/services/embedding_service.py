from __future__ import annotations

import hashlib
import math


class EmbeddingService:
    dimension = 1536

    def embed_text(self, text: str) -> list[float]:
        normalized = text.strip() or "empty"
        digest = hashlib.sha256(normalized.encode("utf-8")).digest()
        values = [((digest[index % len(digest)] / 255.0) * 2.0) - 1.0 for index in range(self.dimension)]
        magnitude = math.sqrt(sum(value * value for value in values)) or 1.0
        return [value / magnitude for value in values]

    def average_embeddings(self, embeddings: list[list[float]]) -> list[float] | None:
        if not embeddings:
            return None
        combined = [0.0] * self.dimension
        for embedding in embeddings:
            for index, value in enumerate(embedding[: self.dimension]):
                combined[index] += value
        averaged = [value / float(len(embeddings)) for value in combined]
        magnitude = math.sqrt(sum(value * value for value in averaged)) or 1.0
        return [value / magnitude for value in averaged]
