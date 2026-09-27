-- 台股理財網站資料庫結構（PostgreSQL 15+）
-- 規則：金額一律 NUMERIC；時間用 timestamptz；日期用 date。
-- 變更結構時請新增 db/migrations/NNN_描述.sql，不要直接改已上線的資料表。

BEGIN;

-- =========================================================
-- 市場資料（由 services/worker 寫入）
-- =========================================================

CREATE TABLE securities (
  symbol        text PRIMARY KEY,               -- 2330、0050
  name          text NOT NULL,
  market        text NOT NULL CHECK (market IN ('TWSE', 'TPEx')),
  industry      text,
  is_etf        boolean NOT NULL DEFAULT false,
  listed_on     date,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE daily_prices (
  symbol        text NOT NULL REFERENCES securities(symbol),
  trade_date    date NOT NULL,
  open          numeric(12,2),
  high          numeric(12,2),
  low           numeric(12,2),
  close         numeric(12,2),
  volume        bigint,                          -- 股數
  turnover      numeric(18,0),                   -- 成交金額
  pe_ratio      numeric(10,2),
  pb_ratio      numeric(10,2),
  dividend_yield numeric(6,2),
  PRIMARY KEY (symbol, trade_date)
);

CREATE TABLE monthly_revenue (
  symbol        text NOT NULL REFERENCES securities(symbol),
  year_month    date NOT NULL,                   -- 當月第一天
  revenue       numeric(18,0) NOT NULL,          -- 千元
  yoy_pct       numeric(8,2),
  mom_pct       numeric(8,2),
  announced_on  date,
  PRIMARY KEY (symbol, year_month)
);

CREATE TABLE financials (
  symbol            text NOT NULL REFERENCES securities(symbol),
  fiscal_year       smallint NOT NULL,
  fiscal_quarter    smallint NOT NULL CHECK (fiscal_quarter BETWEEN 1 AND 4),
  revenue           numeric(18,0),
  gross_profit      numeric(18,0),
  operating_income  numeric(18,0),
  net_income        numeric(18,0),
  eps               numeric(10,2),
  equity            numeric(18,0),
  operating_cash_flow numeric(18,0),
  capex             numeric(18,0),
  published_on      date,
  PRIMARY KEY (symbol, fiscal_year, fiscal_quarter)
);

CREATE TABLE dividend_events (
  symbol          text NOT NULL REFERENCES securities(symbol),
  ex_date         date NOT NULL,
  pay_date        date,
  cash_dividend   numeric(10,4) NOT NULL DEFAULT 0,   -- 每股元
  stock_dividend  numeric(10,4) NOT NULL DEFAULT 0,   -- 每股配股（元，面額 10）
  PRIMARY KEY (symbol, ex_date)
);

CREATE TABLE institutional_flows (
  symbol        text NOT NULL REFERENCES securities(symbol),
  trade_date    date NOT NULL,
  foreign_net   bigint NOT NULL DEFAULT 0,       -- 股數
  trust_net     bigint NOT NULL DEFAULT 0,
  dealer_net    bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (symbol, trade_date)
);

CREATE TABLE news_items (
  id            bigserial PRIMARY KEY,
  symbol        text REFERENCES securities(symbol),
  kind          text NOT NULL CHECK (kind IN ('news', 'material_info')),
  title         text NOT NULL,
  source        text,
  url           text NOT NULL UNIQUE,
  published_at  timestamptz NOT NULL,
  ai_summary    text
);
CREATE INDEX news_items_symbol_time ON news_items (symbol, published_at DESC);

CREATE TABLE events_calendar (
  id            bigserial PRIMARY KEY,
  symbol        text REFERENCES securities(symbol),
  event_date    date NOT NULL,
  kind          text NOT NULL CHECK (kind IN ('investor_conf', 'ex_dividend', 'financials', 'revenue')),
  note          text,
  UNIQUE (symbol, event_date, kind)
);

-- =========================================================
-- 我的資料
-- =========================================================

CREATE TABLE accounts (
  id              serial PRIMARY KEY,
  name            text NOT NULL UNIQUE,
  kind            text NOT NULL CHECK (kind IN ('bank', 'cash', 'credit_card', 'brokerage')),
  currency        char(3) NOT NULL DEFAULT 'TWD',
  opening_balance numeric(14,2) NOT NULL DEFAULT 0,
  archived        boolean NOT NULL DEFAULT false
);

CREATE TABLE categories (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  direction   text NOT NULL CHECK (direction IN ('income', 'expense')),
  parent_id   int REFERENCES categories(id),
  UNIQUE (name, parent_id)
);

-- 所有現金流：日常收支、轉帳、投資買賣與股利產生的現金進出
-- amount：流入為正、流出為負
CREATE TABLE transactions (
  id            bigserial PRIMARY KEY,
  occurred_on   date NOT NULL,
  account_id    int NOT NULL REFERENCES accounts(id),
  category_id   int REFERENCES categories(id),       -- 轉帳與投資可為 NULL
  amount        numeric(14,2) NOT NULL CHECK (amount <> 0),
  note          text,
  transfer_id   uuid,                                 -- 同一次轉帳的兩筆共用
  trade_id      bigint,                               -- 由投資交易產生時指回 trades
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_account_date ON transactions (account_id, occurred_on);

CREATE TABLE recurring_rules (
  id              serial PRIMARY KEY,
  name            text NOT NULL,
  frequency       text NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  day_of_period   smallint NOT NULL,
  next_on         date NOT NULL,
  account_id      int NOT NULL REFERENCES accounts(id),
  category_id     int REFERENCES categories(id),
  amount          numeric(14,2) NOT NULL,
  -- 定期定額：填入 symbol 時改為產生 trades
  symbol          text REFERENCES securities(symbol),
  active          boolean NOT NULL DEFAULT true
);

CREATE TABLE budgets (
  month         date NOT NULL,                       -- 當月第一天
  category_id   int NOT NULL REFERENCES categories(id),
  limit_amount  numeric(14,2) NOT NULL CHECK (limit_amount > 0),
  PRIMARY KEY (month, category_id)
);

CREATE TABLE trades (
  id              bigserial PRIMARY KEY,
  traded_on       date NOT NULL,
  account_id      int NOT NULL REFERENCES accounts(id),
  symbol          text NOT NULL REFERENCES securities(symbol),
  side            text NOT NULL CHECK (side IN ('buy', 'sell')),
  shares          int NOT NULL CHECK (shares > 0),
  price           numeric(12,2) NOT NULL CHECK (price > 0),
  fee             numeric(10,0) NOT NULL DEFAULT 0,
  tax             numeric(10,0) NOT NULL DEFAULT 0,
  is_day_trade    boolean NOT NULL DEFAULT false,
  is_dca          boolean NOT NULL DEFAULT false,     -- 定期定額
  reason          text,                               -- 投資日誌：當初理由
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE transactions
  ADD CONSTRAINT transactions_trade_fk FOREIGN KEY (trade_id) REFERENCES trades(id);

CREATE TABLE dividends_received (
  id                bigserial PRIMARY KEY,
  received_on       date NOT NULL,
  account_id        int NOT NULL REFERENCES accounts(id),
  symbol            text NOT NULL REFERENCES securities(symbol),
  cash_amount       numeric(12,0) NOT NULL DEFAULT 0,
  stock_shares      int NOT NULL DEFAULT 0,
  nhi_premium       numeric(10,0) NOT NULL DEFAULT 0  -- 二代健保補充保費
);

-- 持股（簡化版）：以所有買進的平均單價 × 目前持有的股數估算成本，配股攤入成本。
-- 限制：「全部賣光後再買回」或「配股之後才買進」時平均成本會有偏差。
-- M2 會改為在程式中逐筆以移動平均法計算（並寫單元測試），取代這個檢視。
CREATE VIEW holdings AS
WITH lots AS (
  SELECT symbol,
         SUM(CASE WHEN side = 'buy' THEN shares ELSE -shares END) AS shares,
         SUM(CASE WHEN side = 'buy' THEN shares * price + fee ELSE 0 END) AS buy_cost,
         SUM(CASE WHEN side = 'buy' THEN shares ELSE 0 END) AS bought
  FROM trades
  GROUP BY symbol
),
stock_div AS (
  SELECT symbol, SUM(stock_shares) AS shares FROM dividends_received GROUP BY symbol
),
latest AS (
  SELECT DISTINCT ON (symbol) symbol, close, trade_date
  FROM daily_prices
  ORDER BY symbol, trade_date DESC
)
SELECT l.symbol,
       s.name,
       l.shares + COALESCE(d.shares, 0)                                   AS shares,
       ROUND(l.buy_cost / NULLIF(l.bought, 0) * l.shares
             / NULLIF(l.shares + COALESCE(d.shares, 0), 0), 4)            AS avg_cost,
       p.close                                                            AS last_close,
       p.trade_date                                                       AS priced_on,
       ROUND((l.shares + COALESCE(d.shares, 0)) * p.close, 0)             AS market_value
FROM lots l
JOIN securities s USING (symbol)
LEFT JOIN stock_div d USING (symbol)
LEFT JOIN latest p USING (symbol)
WHERE l.shares + COALESCE(d.shares, 0) > 0;

CREATE TABLE watchlist (
  symbol      text PRIMARY KEY REFERENCES securities(symbol),
  added_at    timestamptz NOT NULL DEFAULT now(),
  sort_order  int NOT NULL DEFAULT 0
);

CREATE TABLE alerts (
  id            serial PRIMARY KEY,
  symbol        text REFERENCES securities(symbol),
  kind          text NOT NULL CHECK (kind IN ('price_above', 'price_below', 'change_pct', 'volume_spike', 'event')),
  threshold     numeric(12,2),
  active        boolean NOT NULL DEFAULT true,
  last_fired_at timestamptz
);

CREATE TABLE investor_profile (
  id                    smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- 單一使用者，只有一列
  risk_score            smallint CHECK (risk_score BETWEEN 1 AND 5),
  horizon_years         smallint,
  goal_amount           numeric(14,0),
  target_equity_pct     numeric(5,2),
  target_bond_pct       numeric(5,2),
  target_cash_pct       numeric(5,2),
  emergency_fund_months smallint NOT NULL DEFAULT 6,
  broker_fee_discount   numeric(4,3) NOT NULL DEFAULT 1.000,          -- 0.28 = 2.8 折
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lesson_progress (
  lesson_slug   text PRIMARY KEY,
  completed_on  date,
  quiz_score    smallint
);

COMMIT;
