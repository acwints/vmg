from datetime import date, datetime, timedelta

REFERENCE_DATE = datetime(2026, 3, 11, 12, 0, 0)
REFERENCE_DAY = REFERENCE_DATE.date()
REFERENCE_DATE_LABEL = "March 11, 2026"


def years_before_reference(years: int) -> datetime:
    return REFERENCE_DATE - timedelta(days=365 * years)


def clamp_date_to_reference(year: int, month: int, day: int = 15) -> date:
    candidate = date(year, month, day)
    if candidate > REFERENCE_DAY:
        return REFERENCE_DAY
    return candidate
