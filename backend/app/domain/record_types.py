from __future__ import annotations

LAB_RECORD_TYPE_FILTER_VALUES = frozenset(
    {
        "lab",
        "lab result",
        "lab-result",
        "lab_result",
        "laboratory",
        "laboratory result",
        "laboratory-result",
        "laboratory_result",
    }
)


def normalize_record_type(value: str | None) -> str:
    if not value:
        return ""
    normalized = value.strip().lower().replace("_", " ").replace("-", " ")
    return " ".join(part for part in normalized.split() if part)


def is_lab_result_record_type(value: str | None) -> bool:
    return normalize_record_type(value) in {"lab", "lab result", "laboratory", "laboratory result"}


def expand_record_type_filter(value: str | None) -> set[str]:
    normalized = normalize_record_type(value)
    if not normalized:
        return set()
    if is_lab_result_record_type(normalized):
        return set(LAB_RECORD_TYPE_FILTER_VALUES)
    return {value.strip().lower()} if value else set()