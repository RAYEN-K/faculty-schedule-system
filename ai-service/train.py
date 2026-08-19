"""Train, compare, and export the best schedule-request classifier."""

from __future__ import annotations

import logging
import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

import joblib
from sklearn.model_selection import train_test_split

from app.config import FEATURE_COLUMNS, MODEL_PATH, RANDOM_STATE, TARGET_COLUMN, TEST_SIZE
from app.data import clean_dataset, generate_raw_dataset, inject_quality_issues
from app.evaluation import evaluate_pipeline, format_comparison_table, select_best_model
from app.pipeline import build_candidate_models, wrap_with_preprocessor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("train")


def main() -> int:
    logger.info("Generating synthetic faculty schedule-request dataset")
    raw = inject_quality_issues(generate_raw_dataset())
    dataset = clean_dataset(raw)
    logger.info("Cleaned dataset shape: %s (from %s raw rows)", dataset.shape, raw.shape)

    features = dataset[FEATURE_COLUMNS]
    target = dataset[TARGET_COLUMN]
    x_train, x_test, y_train, y_test = train_test_split(
        features,
        target,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=target,
    )
    logger.info(
        "Split complete | train=%s (%.0f%%) test=%s (%.0f%%)",
        x_train.shape[0],
        (1 - TEST_SIZE) * 100,
        x_test.shape[0],
        TEST_SIZE * 100,
    )

    results = []
    fitted = {}
    for name, estimator in build_candidate_models().items():
        logger.info("Training %s", name)
        pipeline = wrap_with_preprocessor(estimator)
        pipeline.fit(x_train, y_train)
        metrics = evaluate_pipeline(name, pipeline, x_test, y_test)
        results.append(metrics)
        fitted[name] = pipeline

    winner = select_best_model(results)
    print("\nSchedule AI model comparison")
    print(format_comparison_table(results, winner))

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "pipeline": fitted[winner.name],
        "model_name": winner.name,
        "metrics": winner.__dict__,
        "feature_columns": FEATURE_COLUMNS,
    }
    joblib.dump(payload, MODEL_PATH)
    logger.info("Exported best pipeline (%s) to %s", winner.name, MODEL_PATH)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001 - top-level CLI guard
        logging.exception("Training failed: %s", exc)
        sys.exit(1)
