from collections.abc import Iterator
from contextlib import contextmanager

import psycopg

from .config import DATABASE_URL


@contextmanager
def connect() -> Iterator[psycopg.Connection]:
    if not DATABASE_URL:
        raise RuntimeError("未設定 DATABASE_URL，請檢查 repo 根目錄的 .env")
    with psycopg.connect(DATABASE_URL) as conn:
        yield conn


def tracked_symbols(conn: psycopg.Connection) -> list[str]:
    """需要更新的代號：觀察清單＋曾經交易過的標的。"""
    rows = conn.execute(
        """
        SELECT symbol FROM watchlist
        UNION
        SELECT DISTINCT symbol FROM trades
        """
    ).fetchall()
    return sorted(r[0] for r in rows)
