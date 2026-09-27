# 0001 技術選型

- 狀態：已採用
- 日期：2026-09-27

## 背景

單人使用的台股記帳、看盤與教學網站，需要盤後資料批次抓取、盤中即時報價，以及電腦與手機都好用的介面。開發者使用 VS Code，每週約 8–10 小時。

## 決定

| 部分 | 選擇 |
| --- | --- |
| 網站 | Next.js（App Router、TypeScript）＋Tailwind CSS |
| 圖表 | Lightweight Charts（看盤）、Recharts（報表） |
| 資料庫 | PostgreSQL，本機以 Docker 執行 |
| 盤後資料 | Python worker＋FinMind 套件＋APScheduler |
| 即時行情 | 獨立 Node 服務，富果 WebSocket → 自己的 WebSocket |
| 專案組織 | 單一 repo（monorepo），npm workspaces 管理 JS 專案 |

## 理由

- Next.js 一個專案同時處理頁面與 API，減少要維護的服務數量
- FinMind 官方套件是 Python，資料處理生態完整
- 行情閘道獨立出來，才能在 Vercel 等無伺服器平台部署網站時仍維持常駐 WebSocket 連線，且金鑰不進瀏覽器
- 單一 repo 讓文件、schema、三個服務的改動可以在同一個 commit 中一起審查

## 代價

- 同時使用 TypeScript 與 Python 兩種語言
- 需要一台常駐主機跑 worker 與行情閘道（VPS 或 NAS）
