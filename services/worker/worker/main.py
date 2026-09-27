"""盤後資料排程。

用法：
  python -m worker.main          常駐，依排程執行
  python -m worker.main --once   立即執行所有工作一次後結束
"""

import argparse
import logging

from apscheduler.schedulers.blocking import BlockingScheduler

from .jobs import daily_prices

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


def run_all() -> None:
    daily_prices.run()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="立即執行一次後結束")
    args = parser.parse_args()

    if args.once:
        run_all()
        return

    sched = BlockingScheduler(timezone="Asia/Taipei")
    # 收盤 13:30，證交所盤後資料約 14:30 後陸續更新；FinMind 通常稍晚
    sched.add_job(daily_prices.run, "cron", day_of_week="mon-fri", hour=17, minute=5)
    # 之後的里程碑加入：月營收（每月 1–12 日）、財報、除權息、新聞、法人
    logging.info("排程已啟動，Ctrl+C 結束")
    sched.start()


if __name__ == "__main__":
    main()
