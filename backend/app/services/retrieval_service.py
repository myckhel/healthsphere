from __future__ import annotations

import hashlib
import math
from collections.abc import Sequence
from datetime import datetime, timezone

from app.core.config import settings
from app.models.record import Record
from app.models.record_chunk import RecordChunk
from app.services.embedding_service import EmbeddingService


class RetrievalService:
    def __init__(self, embedding_service: EmbeddingService | None = None) -> None:
        self.embedding_service = embedding_service or EmbeddingService()

    def build_record_chunks(
        self,
        *,
        record: Record,
        text: str,
        chunk_size: int = 800,
        overlap: int = 120,
    ) -> list[RecordChunk]:
        segments = self._split_text(text=text, chunk_size=chunk_size, overlap=overlap)
        chunks: list[RecordChunk] = []
        for index, content in enumerate(segments):
            embedding = self.embedding_service.embed_text(content)
            chunks.append(
                RecordChunk(
                    clinic_id=record.clinic_id,
                    patient_id=record.patient_id,
                    record_id=record.id,
                    chunk_index=index,
                    content=content,
                    content_hash=hashlib.sha256(content.encode("utf-8")).hexdigest(),
                    chunk_metadata={"char_count": len(content)},
                    embedding=embedding,
                )
            )
        return chunks

    def rank_chunks(
        self,
        *,
        query: str,
        chunks: Sequence[RecordChunk],
        limit: int = 5,
    ) -> list[dict[str, object]]:
        candidate_limit = max(1, settings.retrieval_candidate_chunk_limit)
        bounded_chunks = sorted(
            chunks,
            key=lambda item: item.created_at or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )[:candidate_limit]
        query_embedding = self.embedding_service.embed_text(query)
        now = datetime.now(timezone.utc)
        ranked: list[dict[str, object]] = []
        for chunk in bounded_chunks:
            chunk_embedding = chunk.embedding or self.embedding_service.embed_text(chunk.content)
            cosine_similarity = self._cosine_similarity(query_embedding, chunk_embedding)
            lexical_similarity = self._token_overlap_similarity(query, chunk.content)
            similarity_score = (cosine_similarity * 0.3) + (lexical_similarity * 0.7)
            created_at = chunk.created_at or getattr(chunk.record, "created_at", now)
            age_days = max((now - created_at).total_seconds() / 86400.0, 0.0)
            recency_score = 1.0 / (1.0 + age_days)
            combined_score = (similarity_score * 0.8) + (recency_score * 0.2)
            record = chunk.record
            ranked.append(
                {
                    "record_id": chunk.record_id,
                    "chunk_id": chunk.id,
                    "patient_id": chunk.patient_id,
                    "title": record.title if record is not None else "Uploaded record",
                    "record_type": record.record_type if record is not None else "uploaded_document",
                    "review_status": record.review_status if record is not None else "needs_review",
                    "snippet": self._build_snippet(chunk.content),
                    "similarity_score": round(similarity_score, 6),
                    "recency_score": round(recency_score, 6),
                    "combined_score": round(combined_score, 6),
                    "created_at": created_at,
                }
            )
        ranked.sort(key=lambda item: item["combined_score"], reverse=True)
        return ranked[: max(1, min(limit, settings.retrieval_result_limit))]

    @staticmethod
    def _build_snippet(content: str, max_length: int = 220) -> str:
        normalized = " ".join(content.split())
        if len(normalized) <= max_length:
            return normalized
        return normalized[: max_length - 3].rstrip() + "..."

    @staticmethod
    def _split_text(text: str, *, chunk_size: int, overlap: int) -> list[str]:
        normalized = " ".join(text.split())
        if not normalized:
            return ["Uploaded record contained no extractable text."]
        words = normalized.split(" ")
        chunks: list[str] = []
        start = 0
        while start < len(words):
            current_words: list[str] = []
            current_length = 0
            index = start
            while index < len(words):
                word = words[index]
                projected = current_length + len(word) + (1 if current_words else 0)
                if projected > chunk_size and current_words:
                    break
                current_words.append(word)
                current_length = projected
                index += 1
            chunks.append(" ".join(current_words))
            if index >= len(words):
                break
            overlap_words = max(1, overlap // 8)
            start = max(index - overlap_words, start + 1)
        return chunks

    @staticmethod
    def _cosine_similarity(left: Sequence[float], right: Sequence[float]) -> float:
        limit = min(len(left), len(right))
        if limit == 0:
            return 0.0
        numerator = sum(left[index] * right[index] for index in range(limit))
        left_norm = math.sqrt(sum(value * value for value in left[:limit])) or 1.0
        right_norm = math.sqrt(sum(value * value for value in right[:limit])) or 1.0
        similarity = numerator / (left_norm * right_norm)
        return max(min(similarity, 1.0), -1.0)

    @staticmethod
    def _token_overlap_similarity(query: str, content: str) -> float:
        query_tokens = {token for token in query.lower().split() if token}
        content_tokens = {token for token in content.lower().split() if token}
        if not query_tokens or not content_tokens:
            return 0.0
        overlap = len(query_tokens & content_tokens)
        return overlap / float(len(query_tokens))
