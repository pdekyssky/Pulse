from enum import StrEnum


class AlertStatus(StrEnum):
    new = "new"
    acknowledged = "acknowledged"
    resolved = "resolved"


ALLOWED_STATUS_TRANSITIONS: dict[AlertStatus, frozenset[AlertStatus]] = {
    AlertStatus.new: frozenset({AlertStatus.acknowledged}),
    AlertStatus.acknowledged: frozenset({AlertStatus.resolved}),
    AlertStatus.resolved: frozenset(),
}


def validate_status_transition(current_status: str, new_status: str) -> None:
    current = AlertStatus(current_status)
    new = AlertStatus(new_status)

    if current == new:
        return

    allowed = ALLOWED_STATUS_TRANSITIONS[current]
    if new not in allowed:
        raise ValueError(
            f"Invalid status transition: {current.value} → {new.value}"
        )
