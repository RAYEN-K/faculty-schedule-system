"""Model evaluation helpers and console reporting."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.pipeline import Pipeline


@dataclass(frozen=True)
class ModelMetrics:
    name: str
    accuracy: float
    precision: float
    recall: float
    f1: float


def evaluate_pipeline(name: str, pipeline: Pipeline, x_test: pd.DataFrame, y_test: pd.Series) -> ModelMetrics:
    predictions = pipeline.predict(x_test)
    return ModelMetrics(
        name=name,
        accuracy=float(accuracy_score(y_test, predictions)),
        precision=float(precision_score(y_test, predictions, zero_division=0)),
        recall=float(recall_score(y_test, predictions, zero_division=0)),
        f1=float(f1_score(y_test, predictions, zero_division=0)),
    )


def select_best_model(results: list[ModelMetrics]) -> ModelMetrics:
    """Prefer highest accuracy; break ties with F1, then recall."""
    return max(results, key=lambda item: (item.accuracy, item.f1, item.recall))


def format_comparison_table(results: list[ModelMetrics], winner: ModelMetrics) -> str:
    header = f"{'Model':<24} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1':>10}"
    divider = "-" * len(header)
    rows = [
        f"{item.name:<24} {item.accuracy:>10.4f} {item.precision:>10.4f} {item.recall:>10.4f} {item.f1:>10.4f}"
        for item in results
    ]
    footer = (
        f"\nBest model: {winner.name} "
        f"(Accuracy={winner.accuracy:.4f}, F1={winner.f1:.4f})"
    )
    return "\n".join([header, divider, *rows, divider, footer])
