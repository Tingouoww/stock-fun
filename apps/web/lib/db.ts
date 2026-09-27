import "server-only";
import { Pool, types } from "pg";

// NUMERIC 預設回傳字串以保留精度；金額在顯示前再轉換，計算請在 SQL 內完成
types.setTypeParser(types.builtins.INT8, (v) => Number(v));

const globalForPool = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPool.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });

// 開發模式熱重載時重複使用同一個連線池
if (process.env.NODE_ENV !== "production") globalForPool.pgPool = pool;

export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool.query<T>(text, params);
  return res.rows;
}
