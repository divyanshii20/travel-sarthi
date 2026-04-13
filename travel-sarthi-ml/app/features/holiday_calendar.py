"""
Indian holiday calendar 2020-2030.
Used as a feature in price prediction — holidays cause demand surges.
"""
from datetime import date, datetime
from typing import Optional
import holidays

# Build Indian public holiday calendar 2020-2030
INDIA_HOLIDAYS = {}

for year in range(2020, 2031):
    # Python `holidays` package supports India
    try:
        india = holidays.India(years=year)
        for holiday_date, name in india.items():
            INDIA_HOLIDAYS[holiday_date] = name
    except Exception:
        pass

# Additional Indian festival dates (not always public holidays but high-demand travel days)
ADDITIONAL_FESTIVAL_DATES: dict[date, str] = {
    # Diwali (approximate — varies by year)
    date(2024, 11, 1): "Diwali",
    date(2025, 10, 20): "Diwali",
    date(2026, 11, 8): "Diwali",
    date(2027, 10, 29): "Diwali",
    date(2028, 10, 17): "Diwali",
    # Holi
    date(2025, 3, 14): "Holi",
    date(2026, 3, 3): "Holi",
    date(2027, 3, 22): "Holi",
    # Eid al-Fitr (approximate)
    date(2025, 3, 31): "Eid al-Fitr",
    date(2026, 3, 20): "Eid al-Fitr",
    # Navratri start (9 days of high travel)
    date(2025, 9, 22): "Navratri",
    date(2026, 10, 11): "Navratri",
    # New Year's Eve
    date(2024, 12, 31): "New Year's Eve",
    date(2025, 12, 31): "New Year's Eve",
    date(2026, 12, 31): "New Year's Eve",
    # Christmas
    date(2024, 12, 25): "Christmas",
    date(2025, 12, 25): "Christmas",
    date(2026, 12, 25): "Christmas",
    # Long weekends — Independence Day
    date(2025, 8, 15): "Independence Day",
    date(2026, 8, 15): "Independence Day",
    # Republic Day
    date(2025, 1, 26): "Republic Day",
    date(2026, 1, 26): "Republic Day",
    # Ganesh Chaturthi
    date(2025, 8, 27): "Ganesh Chaturthi",
    date(2026, 9, 15): "Ganesh Chaturthi",
}

INDIA_HOLIDAYS.update(ADDITIONAL_FESTIVAL_DATES)


def is_holiday(d: date) -> bool:
    """Check if a given date is an Indian holiday or major festival."""
    return d in INDIA_HOLIDAYS


def get_holiday_name(d: date) -> Optional[str]:
    """Get the name of the holiday on a given date, or None."""
    return INDIA_HOLIDAYS.get(d)


def is_holiday_adjacent(d: date) -> bool:
    """Check if a date is within 2 days of a major holiday (creates demand spike)."""
    from datetime import timedelta
    for delta in range(-2, 3):
        if delta == 0:
            continue
        if (d + timedelta(days=delta)) in INDIA_HOLIDAYS:
            return True
    return False


def get_season(month: int) -> str:
    """Return travel season classification for India."""
    if month in [12, 1, 2]:
        return "peak"      # Winter peak travel
    elif month in [3, 4]:
        return "shoulder"  # Pre-summer
    elif month in [5, 6]:
        return "off"       # Summer (hot)
    elif month in [7, 8, 9]:
        return "off"       # Monsoon
    elif month in [10, 11]:
        return "peak"      # Post-monsoon peak
    return "shoulder"


def is_summer_peak(month: int) -> bool:
    """April-June is summer school holidays — high domestic travel."""
    return month in [4, 5, 6]


def is_winter_peak(month: int) -> bool:
    """Nov-Feb is peak tourist season in India."""
    return month in [11, 12, 1, 2]


def is_monsoon(month: int) -> bool:
    """Jun-Sep is monsoon season in most of India."""
    return month in [6, 7, 8, 9]


def get_departure_time_slot(hour: int) -> str:
    """Classify departure hour into time slot."""
    if 4 <= hour < 8:
        return "early_morning"
    elif 8 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"
