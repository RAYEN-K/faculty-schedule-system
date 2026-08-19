"""Pydantic contracts for the prediction API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.config import REASON_TYPES


class PredictRequest(BaseModel):
    working_days_count: int = Field(..., ge=0, le=7, description="Faculty working days in the week")
    has_schedule_conflict: int = Field(..., ge=0, le=1, description="1 if the proposed slot overlaps another schedule")
    institutional_event_conflict: int = Field(..., ge=0, le=1, description="1 if the slot clashes with an event")
    previous_requests_count: int = Field(..., ge=0, description="Prior modification requests from this faculty member")
    department_coverage: float = Field(..., ge=0.0, le=1.0, description="Share of department coverage remaining")
    reason_type: Literal["Medical", "Personal", "Research"] = Field(..., description="Categorical request reason")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "working_days_count": 4,
                    "has_schedule_conflict": 0,
                    "institutional_event_conflict": 0,
                    "previous_requests_count": 1,
                    "department_coverage": 0.82,
                    "reason_type": "Medical",
                }
            ]
        }
    }


class PredictResponse(BaseModel):
    recommendation: Literal["Approve", "Reject"]
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    reason: str
    model_name: str | None = None


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    allowed_reason_types: tuple[str, ...] = REASON_TYPES
