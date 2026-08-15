"""Utility helpers for the backend."""

import os


def ensure_dir(path: str) -> str:
    os.makedirs(path, exist_ok=True)
    return path


def clamp(value, lo, hi):
    return max(lo, min(hi, value))
