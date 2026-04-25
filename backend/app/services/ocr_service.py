from __future__ import annotations


class OCRService:
    async def extract_record(
        self,
        document_bytes: bytes,
        *,
        filename: str | None = None,
        content_type: str | None = None,
    ) -> dict:
        warnings: list[str] = []
        text = document_bytes.decode("utf-8", errors="ignore").strip()
        extraction_method = "utf8_decode"

        if not text:
            text = document_bytes.decode("latin-1", errors="ignore").strip()
            extraction_method = "latin1_decode"

        if not text:
            warnings.append("No decodable text content detected in upload.")
            text = "Uploaded record contained no extractable text."
            extraction_method = "empty_fallback"

        normalized_text = "\n".join(
            line.strip() for line in text.splitlines() if line.strip()
        ) or text
        non_empty_lines = [line for line in normalized_text.splitlines() if line.strip()]

        return {
            "status": "completed",
            "method": extraction_method,
            "raw_text": normalized_text,
            "structured_data": {
                "filename": filename,
                "content_type": content_type,
                "line_count": len(non_empty_lines),
                "character_count": len(normalized_text),
                "preview": normalized_text[:280],
            },
            "warnings": warnings,
        }
