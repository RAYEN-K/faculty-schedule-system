"""Human-readable recommendation rationale for HOD review."""

from __future__ import annotations

from typing import Mapping, Union

Number = Union[int, float]


def build_rationale(
    features: Mapping[str, Number | str],
    recommendation: str,
    confidence_score: float,
) -> str:
    """Explain the decision using the most material conflict and fairness signals."""
    drivers: list[str] = []

    if int(features["has_schedule_conflict"]) == 1:
        drivers.append("an overlapping faculty schedule conflict")
    if int(features["institutional_event_conflict"]) == 1:
        drivers.append("a clash with an institutional event")

    coverage = float(features["department_coverage"])
    if coverage < 0.45:
        drivers.append(f"low department coverage ({coverage:.0%})")
    elif coverage >= 0.80:
        drivers.append(f"strong remaining department coverage ({coverage:.0%})")

    previous_requests = int(features["previous_requests_count"])
    if previous_requests >= 4:
        drivers.append(f"a high recent request volume ({previous_requests})")

    working_days = int(features["working_days_count"])
    if working_days <= 2:
        drivers.append(f"already light weekly load ({working_days} working days)")
    elif working_days >= 5:
        drivers.append(f"a heavy weekly load ({working_days} working days)")

    reason_type = str(features["reason_type"])
    if reason_type == "Medical":
        drivers.append("a medical justification")
    elif reason_type == "Research":
        drivers.append("a research-related justification")
    elif reason_type == "Personal":
        drivers.append("a personal justification")

    if not drivers:
        drivers.append("balanced workload and conflict indicators")

    lead = (
        "Recommend Approve"
        if recommendation == "Approve"
        else "Recommend Reject"
    )
    joined = ", ".join(drivers[:3])
    return f"{lead} ({confidence_score:.0%} confidence) based on {joined}."
