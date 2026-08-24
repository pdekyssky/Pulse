from enum import StrEnum


class ServiceStatus(StrEnum):
    operational = "operational"
    degraded = "degraded"
    partial_outage = "partial_outage"
    major_outage = "major_outage"
