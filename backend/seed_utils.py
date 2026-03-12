"""
Shared deterministic hash helpers for seed scripts.
Matches frontend mock-metrics.ts logic.
"""


def hash_str(s, salt=0):
    h = 0
    s = s + str(salt)
    for c in s:
        h = ((h << 5) - h + ord(c)) & 0xFFFFFFFF
    return h


def in_range(name, salt, min_val, max_val):
    return min_val + (hash_str(name, salt) % (max_val - min_val + 1))


def in_range_float(name, salt, min_val, max_val, precision=100):
    """Return a deterministic float in [min_val, max_val]."""
    raw = hash_str(name, salt) % (precision + 1)
    return min_val + (max_val - min_val) * raw / precision
