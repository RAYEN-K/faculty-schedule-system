"""Synthetic dataset generation aligned with HOD scheduling policy."""

from __future__ import annotations

import numpy as np
import pandas as pd

from app.config import (
    FEATURE_COLUMNS,
    N_SAMPLES,
    RANDOM_STATE,
    REASON_TYPES,
    TARGET_COLUMN,
)


def _assign_decision(frame: pd.DataFrame, rng: np.random.Generator) -> np.ndarray:
    """Label requests using domain rules plus light stochastic noise."""
    medical = (frame["reason_type"] == "Medical").astype(float)
    research = (frame["reason_type"] == "Research").astype(float)
    personal = (frame["reason_type"] == "Personal").astype(float)

    score = (
        0.35
        - 2.40 * frame["has_schedule_conflict"]
        - 1.90 * frame["institutional_event_conflict"]
        - 1.60 * (frame["department_coverage"] < 0.40).astype(float)
        - 0.90 * (frame["department_coverage"] < 0.55).astype(float)
        - 1.10 * (frame["previous_requests_count"] >= 4).astype(float)
        - 0.55 * (frame["previous_requests_count"] >= 6).astype(float)
        - 0.70 * (frame["working_days_count"] <= 2).astype(float)
        - 0.45 * ((frame["working_days_count"] >= 5) & (frame["department_coverage"] < 0.60)).astype(float)
        + 1.55 * medical
        + 0.55 * research
        - 0.15 * personal
        + 0.70 * (frame["department_coverage"] >= 0.75).astype(float)
    )
    noise = rng.normal(0.0, 0.35, size=len(frame))
    return (score + noise > 0.0).astype(int)


def generate_raw_dataset(n_samples: int = N_SAMPLES, random_state: int = RANDOM_STATE) -> pd.DataFrame:
    """Create a realistic but synthetic modification-request dataset."""
    rng = np.random.default_rng(random_state)

    reason_type = rng.choice(REASON_TYPES, size=n_samples, p=[0.28, 0.42, 0.30])
    working_days_count = rng.integers(1, 7, size=n_samples)
    has_schedule_conflict = rng.choice([0, 1], size=n_samples, p=[0.72, 0.28])
    institutional_event_conflict = rng.choice([0, 1], size=n_samples, p=[0.80, 0.20])
    previous_requests_count = rng.poisson(2.2, size=n_samples).clip(0, 12)
    department_coverage = rng.beta(5.0, 2.4, size=n_samples).clip(0.05, 1.0)

    frame = pd.DataFrame(
        {
            "working_days_count": working_days_count,
            "has_schedule_conflict": has_schedule_conflict,
            "institutional_event_conflict": institutional_event_conflict,
            "previous_requests_count": previous_requests_count,
            "department_coverage": department_coverage,
            "reason_type": reason_type,
        }
    )
    frame[TARGET_COLUMN] = _assign_decision(frame, rng)
    return frame


def inject_quality_issues(frame: pd.DataFrame, random_state: int = RANDOM_STATE) -> pd.DataFrame:
    """Add missing values, duplicates, and invalid rows so cleaning can be demonstrated."""
    rng = np.random.default_rng(random_state + 7)
    dirty = frame.copy()

    missing_idx = rng.choice(dirty.index, size=max(8, len(dirty) // 80), replace=False)
    dirty.loc[missing_idx[: len(missing_idx) // 2], "department_coverage"] = np.nan
    dirty.loc[missing_idx[len(missing_idx) // 2 :], "reason_type"] = None

    duplicates = dirty.sample(n=max(5, len(dirty) // 120), random_state=random_state)
    invalid_rows = pd.DataFrame(
        {
            "working_days_count": [-1, 12, 3],
            "has_schedule_conflict": [0, 2, 1],
            "institutional_event_conflict": [1, 0, -1],
            "previous_requests_count": [-4, 2, 1],
            "department_coverage": [1.4, -0.2, 0.5],
            "reason_type": ["Medical", "Unknown", "Personal"],
            TARGET_COLUMN: [1, 0, 1],
        }
    )
    return pd.concat([dirty, duplicates, invalid_rows], ignore_index=True)


def clean_dataset(frame: pd.DataFrame) -> pd.DataFrame:
    """Drop duplicates and physically invalid rows; keep missing values for the imputer."""
    cleaned = frame.copy()
    cleaned = cleaned.drop_duplicates()
    cleaned = cleaned[cleaned[TARGET_COLUMN].isin([0, 1])]

    cleaned = cleaned[
        cleaned["working_days_count"].isna()
        | ((cleaned["working_days_count"] >= 0) & (cleaned["working_days_count"] <= 7))
    ]
    cleaned = cleaned[
        cleaned["has_schedule_conflict"].isna()
        | cleaned["has_schedule_conflict"].isin([0, 1])
    ]
    cleaned = cleaned[
        cleaned["institutional_event_conflict"].isna()
        | cleaned["institutional_event_conflict"].isin([0, 1])
    ]
    cleaned = cleaned[
        cleaned["previous_requests_count"].isna()
        | (cleaned["previous_requests_count"] >= 0)
    ]
    cleaned = cleaned[
        cleaned["department_coverage"].isna()
        | ((cleaned["department_coverage"] >= 0.0) & (cleaned["department_coverage"] <= 1.0))
    ]
    cleaned = cleaned[
        cleaned["reason_type"].isna()
        | cleaned["reason_type"].isin(REASON_TYPES)
    ]

    cleaned = cleaned.dropna(subset=[TARGET_COLUMN])
    cleaned[TARGET_COLUMN] = cleaned[TARGET_COLUMN].astype(int)
    return cleaned.reset_index(drop=True)[FEATURE_COLUMNS + [TARGET_COLUMN]]
