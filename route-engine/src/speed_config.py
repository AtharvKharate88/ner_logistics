from __future__ import annotations

import re
from typing import Any

DEFAULT_SPEED_BY_HIGHWAY: dict[str, float] = {
    "motorway": 80.0,
    "trunk": 60.0,
    "primary": 50.0,
    "secondary": 40.0,
    "tertiary": 30.0,
    "unclassified": 30.0,
    "residential": 20.0,
    "service": 15.0,
    "track": 10.0,
    "road": 30.0,
    "living_street": 15.0,
    "motorway_link": 60.0,
    "trunk_link": 50.0,
    "primary_link": 40.0,
    "secondary_link": 35.0,
    "tertiary_link": 30.0,
}

DEFAULT_FALLBACK_SPEED_KMH = 30.0
MIN_VALID_MAXSPEED_KMH = 5.0
MAX_VALID_MAXSPEED_KMH = 140.0


def parse_speed_value(raw_value: Any) -> float | None:
    if raw_value is None:
        return None
    if isinstance(raw_value, (int, float)):
        value = float(raw_value)
        if value > 0:
            return value
        return None
    text = str(raw_value).strip().lower()
    if not text or text in {"none", "nan", "null", "signals"}:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    if not match:
        return None
    value = float(match.group(1))
    if value <= 0:
        return None
    return value


def resolve_edge_speed_kmh(highway: str | None, maxspeed: Any = None) -> float:
    parsed_maxspeed = parse_speed_value(maxspeed)
    if parsed_maxspeed is not None and MIN_VALID_MAXSPEED_KMH <= parsed_maxspeed <= MAX_VALID_MAXSPEED_KMH:
        return parsed_maxspeed
    if highway:
        return DEFAULT_SPEED_BY_HIGHWAY.get(str(highway).strip().lower(), DEFAULT_FALLBACK_SPEED_KMH)
    return DEFAULT_FALLBACK_SPEED_KMH
