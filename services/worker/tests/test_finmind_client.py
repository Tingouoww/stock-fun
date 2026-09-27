from datetime import date

from worker.finmind_client import to_daily_prices


def test_to_daily_prices_maps_finmind_columns():
    rows = to_daily_prices(
        [
            {
                "date": "2026-09-25",
                "stock_id": "2330",
                "Trading_Volume": 25000000,
                "Trading_money": 30000000000,
                "open": 1200.0,
                "max": 1215.0,
                "min": 1195.0,
                "close": 1210.0,
                "spread": 10.0,
                "Trading_turnover": 40000,
            }
        ]
    )
    assert rows == [
        {
            "symbol": "2330",
            "trade_date": date(2026, 9, 25),
            "open": 1200.0,
            "high": 1215.0,
            "low": 1195.0,
            "close": 1210.0,
            "volume": 25000000,
            "turnover": 30000000000,
        }
    ]
