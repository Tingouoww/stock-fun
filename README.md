# tw-finance

個人用的台股教學、看盤、記帳網站。完整規劃見 [docs/PLAN.md](docs/PLAN.md)。

## 專案結構

```
tw-finance/
├── apps/web/                 Next.js 網站（頁面＋API）
├── services/quote-gateway/   盤中即時行情閘道（Node，連富果 WebSocket 後推給瀏覽器）
├── services/worker/          盤後資料排程（Python，FinMind → PostgreSQL）
├── db/                       schema.sql、seed.sql、migrations/
├── docs/                     規劃書、架構決策紀錄（decisions/）、開發流程
├── docker-compose.yml        本機 PostgreSQL
└── .env.example              環境變數範本（複製成 .env）
```

## 第一次啟動

需要：Node.js 20.9+、Python 3.11+、Docker Desktop、Git、VS Code。

```bash
# 0. 建立 Git 版本庫（第一次）
git init
git add .
git commit -m "chore: 初始專案骨架"

# 1. 環境變數
cp .env.example .env          # 打開 .env 填入密碼與金鑰

# 2. 資料庫（第一次啟動會自動建表與放入範例資料）
docker compose up -d db

# 3. 網站與行情閘道
npm install
npm run dev                   # http://localhost:3000
npm run dev:quotes            # 另開終端機；需要 FUGLE_API_KEY，盤中才有跳價

# 4. 盤後資料 worker
cd services/worker
python -m venv .venv
source .venv/bin/activate     # Windows：.venv\Scripts\activate
pip install -r requirements.txt
python -m worker.main --once  # 先手動抓一次；不加 --once 則常駐排程
```

VS Code 打開資料夾後，右下角會提示安裝建議的擴充套件（ESLint、Prettier、Tailwind、Python、Ruff、Docker、SQLTools、Mermaid 預覽），建議全部安裝。

## 常用指令

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 啟動網站開發伺服器 |
| `npm run dev:quotes` | 啟動行情閘道 |
| `npm test` | 執行所有單元測試 |
| `npm run build` | 正式建置 |
| `npm run db:reset` | 清空資料庫並重建（會刪除所有資料） |

## 開發流程

見 [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)：分支命名、commit 格式、如何記錄架構決策。

## 安全

- `.env` 永遠不提交；新增環境變數時同步更新 `.env.example`（只放範例值）
- 行情與 AI 金鑰只在伺服器端使用，瀏覽器看得到的變數必須以 `NEXT_PUBLIC_` 開頭且不可含金鑰
- 若金鑰不小心推上 GitHub，立刻到服務商後台作廢重發，光刪 commit 不夠
