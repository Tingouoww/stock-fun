"""FinMind 轉接層：只有這個檔案知道 FinMind 的欄位名稱。
換資料源時新增另一個轉接檔，回傳相同格式即可。"""

from datetime import date
from typing import TypedDict

from FinMind.data import DataLoader

from .config import FINMIND_TOKEN


class DailyPrice(TypedDict):
    symbol: str
    trade_date: date
    open: float
    high: float
    low: float
    close: float
    volume: int
    turnover: int


def _loader() -> DataLoader:
    api = DataLoader()
    if FINMIND_TOKEN:
        api.login_by_token(api_token=FINMIND_TOKEN)
    return api


def to_daily_prices(records: list[dict]) -> list[DailyPrice]:
    """把 FinMind TaiwanStockPrice 的列轉成我們的格式（純函式，方便測試）。"""
    out: list[DailyPrice] = []
    for r in records:
        out.append(
            DailyPrice(
                symbol=str(r["stock_id"]),
                trade_date=date.fromisoformat(str(r["date"])[:10]),
                open=float(r["open"]),
                high=float(r["max"]),
                low=float(r["min"]),
                close=float(r["close"]),
                volume=int(r["Trading_Volume"]),
                turnover=int(r["Trading_money"]),
            )
        )
    return out


def fetch_daily_prices(symbol: str, start: date, end: date) -> list[DailyPrice]:
    df = _loader().taiwan_stock_daily(
        stock_id=symbol, start_date=start.isoformat(), end_date=end.isoformat()
    )
    if df is None or df.empty:
        return []
    return to_daily_prices(df.to_dict("records"))
