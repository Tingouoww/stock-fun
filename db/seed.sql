-- 開發用初始資料：預設帳戶、分類與幾檔常見標的
BEGIN;

INSERT INTO accounts (name, kind) VALUES
  ('薪轉帳戶', 'bank'),
  ('現金', 'cash'),
  ('信用卡', 'credit_card'),
  ('證券交割戶', 'brokerage');

INSERT INTO categories (name, direction) VALUES
  ('薪資', 'income'), ('股利', 'income'), ('其他收入', 'income'),
  ('餐飲', 'expense'), ('交通', 'expense'), ('居住', 'expense'),
  ('日用品', 'expense'), ('娛樂', 'expense'), ('醫療', 'expense'),
  ('保險', 'expense'), ('學習', 'expense'), ('其他支出', 'expense');

INSERT INTO securities (symbol, name, market, industry, is_etf) VALUES
  ('2330', '台積電', 'TWSE', '半導體業', false),
  ('2317', '鴻海', 'TWSE', '其他電子業', false),
  ('2454', '聯發科', 'TWSE', '半導體業', false),
  ('0050', '元大台灣50', 'TWSE', 'ETF', true),
  ('0056', '元大高股息', 'TWSE', 'ETF', true);

INSERT INTO investor_profile (id) VALUES (1);

INSERT INTO watchlist (symbol, sort_order) VALUES ('2330', 1), ('0050', 2);

COMMIT;
