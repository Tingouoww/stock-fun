# 開發流程

即使只有自己一個人開發，照著一套固定流程做，半年後回頭看才知道每個改動為什麼發生。

## 分支

- `main`：永遠可以執行、可以部署
- 每個功能開一條分支，完成後合回 `main`：
  - `feat/ledger-quick-add`（新功能）
  - `fix/fee-rounding`（修錯）
  - `docs/update-plan`（文件）
  - `chore/upgrade-next`（雜務、升級）

## Commit 訊息

採用 [Conventional Commits](https://www.conventionalcommits.org/zh-hant/)：

```
feat(ledger): 新增快速記帳對話框
fix(fees): 零股手續費低消改為 1 元
docs(plan): 補上看盤效能驗收標準
```

## 每個里程碑的節奏

1. 在 GitHub Issues 開好該里程碑的工作項目（對應 `docs/PLAN.md` 第 8 節）
2. 一個 issue 一條分支，完成後開 Pull Request 給自己看一次 diff 再合併
3. 里程碑結束時更新 `docs/PLAN.md` 的狀態，並跑一次 `docs/benchmarks.md` 的比較測試

## 架構決策紀錄（ADR）

重要技術選擇寫成 `docs/decisions/NNNN-標題.md`，格式參考 `0001-tech-stack.md`。
決策改變時不要刪舊檔，新增一份並在舊檔標註「已被 NNNN 取代」。

## 資料庫變更

- 已上線後不要直接改 `db/schema.sql` 的既有表，改為新增 `db/migrations/NNN_描述.sql`
- 金額一律 `numeric`，不用 `float`

## 測試

- 所有和錢有關的計算（手續費、稅、報酬率、平均成本）都要有單元測試
- 送出 PR 前執行 `npm test`
