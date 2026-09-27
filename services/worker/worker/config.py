"""集中讀取環境變數。.env 放在 repo 根目錄，三個服務共用。"""

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[3]
load_dotenv(ROOT / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL", "")
FINMIND_TOKEN = os.environ.get("FINMIND_TOKEN", "")
