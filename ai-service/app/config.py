"""Shared configuration for training and inference."""

from __future__ import annotations

from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parent.parent
MODEL_FILENAME = "best_schedule_ai_model.pkl"
MODEL_PATH = SERVICE_ROOT / MODEL_FILENAME

NUMERICAL_FEATURES: list[str] = [
    "working_days_count",
    "has_schedule_conflict",
    "institutional_event_conflict",
    "previous_requests_count",
    "department_coverage",
]
CATEGORICAL_FEATURES: list[str] = ["reason_type"]
FEATURE_COLUMNS: list[str] = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
TARGET_COLUMN = "decision"

REASON_TYPES: tuple[str, ...] = ("Medical", "Personal", "Research")

TEST_SIZE = 0.30
RANDOM_STATE = 42
N_SAMPLES = 4000

API_HOST = "0.0.0.0"
API_PORT = 8000
