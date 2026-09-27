"""每日收盤後更新日 K。預設補最近 10 天，已存在的資料會覆寫（冪等，重跑安全）。"""

import logging
import time
from datetime import date, timedelta

from ..db import connect, tracked_symbols
from ..finmind_client import fetch_daily_prices

log = logging.getLogger(__name__)

UPSERT = """
INSERT INTO daily_prices (symbol, trade_date, open, high, low, close, volume, turnover)
VALUES (%(symbol)s, %(trade_date)s, %(open)s, %(high)s, %(low)s, %(close)s,
        %(volume)s, %(turnover)s)
ON CONFLICT (symbol, trade_date) DO UPDATE SET
  open = EXCLUDED.open, high = EXCLUDED.high, low = EXCLUDED.low, close = EXCLUDED.close,
  volume = EXCLUDED.volume, turnover = EXCLUDED.turnover
"""


def run(days: int = 10) -> None:
    end = date.today()
    start = end - timedelta(days=days)
    with connect() as conn:
        symbols = tracked_symbols(conn)
        log.info("更新日 K：%d 檔，%s ~ %s", len(symbols), start, end)
        for symbol in symbols:
            try:
                rows = fetch_daily_prices(symbol, start, end)
            except Exception:
                # 單檔失敗不影響其他檔；不立即重試，避免觸發 FinMind 封鎖
                log.exception("抓取 %s 失敗", symbol)
                continue
            with conn.cursor() as cur:
                cur.executemany(UPSERT, rows)
            conn.commit()
            log.info("%s：%d 筆", symbol, len(rows))
            time.sleep(0.5)  # 節流，遠低於 600 次/小時上限
