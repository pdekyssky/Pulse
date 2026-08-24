from enum import StrEnum


class IncidentStatus(StrEnum):
    investigating = "investigating"
    identified = "identified"
    monitoring = "monitoring"
    resolved = "resolved"


ALLOWED_STATUS_TRANSITIONS: dict[IncidentStatus, frozenset[IncidentStatus]] = {
    IncidentStatus.investigating: frozenset({IncidentStatus.identified}),
    IncidentStatus.identified: frozenset({IncidentStatus.monitoring}),
    IncidentStatus.monitoring: frozenset({IncidentStatus.resolved}),
    IncidentStatus.resolved: frozenset(),
}


def validate_status_transition(current_status: str, new_status: str) -> None:
    current = IncidentStatus(current_status)
    new = IncidentStatus(new_status)

    if current == new:
        return

    allowed = ALLOWED_STATUS_TRANSITIONS[current]
    if new not in allowed:
        raise ValueError(
            f"Invalid status transition: {current.value} → {new.value}"
        )
