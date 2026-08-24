from enum import StrEnum


class AnalyticsDateRange(StrEnum):
    seven_days = "7d"
    fourteen_days = "14d"
    thirty_days = "30d"


DATE_RANGE_DAYS: dict[AnalyticsDateRange, int] = {
    AnalyticsDateRange.seven_days: 7,
    AnalyticsDateRange.fourteen_days: 14,
    AnalyticsDateRange.thirty_days: 30,
}
