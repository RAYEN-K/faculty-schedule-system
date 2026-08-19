"""FastAPI inference service for Head of Department recommendations."""

from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

SERVICE_ROOT = Path(__file__).resolve().parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import API_HOST, API_PORT, FEATURE_COLUMNS, MODEL_PATH, REASON_TYPES
from app.rationale import build_rationale
from app.schemas import HealthResponse, PredictRequest, PredictResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("ai-service")

_model_bundle: dict[str, Any] | None = None


def load_model_bundle() -> dict[str, Any]:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found at {MODEL_PATH}. Run `python train.py` first."
        )
    bundle = joblib.load(MODEL_PATH)
    if "pipeline" not in bundle:
        raise ValueError("Invalid model artifact: missing 'pipeline' key.")
    return bundle


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _model_bundle
    try:
        _model_bundle = load_model_bundle()
        logger.info("Loaded model '%s' from %s", _model_bundle.get("model_name"), MODEL_PATH)
    except Exception as exc:  # noqa: BLE001
        _model_bundle = None
        logger.warning("Service started without a trained model: %s", exc)
    yield


app = FastAPI(
    title="Faculty Schedule AI Service",
    description="Tier 3 intelligence API that recommends Approve/Reject for schedule modification requests.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok" if _model_bundle is not None else "model_unavailable",
        model_loaded=_model_bundle is not None,
        allowed_reason_types=REASON_TYPES,
    )


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    global _model_bundle
    if _model_bundle is None:
        try:
            _model_bundle = load_model_bundle()
        except FileNotFoundError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=500, detail=f"Failed to load model: {exc}") from exc

    bundle = _model_bundle

    pipeline = bundle["pipeline"]
    features = pd.DataFrame([payload.model_dump()], columns=FEATURE_COLUMNS)

    try:
        probabilities = pipeline.predict_proba(features)[0]
        class_index = int(probabilities.argmax())
        predicted_label = int(pipeline.classes_[class_index])
        confidence_score = float(probabilities[class_index])
    except Exception as exc:  # noqa: BLE001
        logger.exception("Inference failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    recommendation = "Approve" if predicted_label == 1 else "Reject"
    reason = build_rationale(payload.model_dump(), recommendation, confidence_score)

    return PredictResponse(
        recommendation=recommendation,
        confidence_score=round(confidence_score, 4),
        reason=reason,
        model_name=str(bundle.get("model_name", "unknown")),
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=False)
