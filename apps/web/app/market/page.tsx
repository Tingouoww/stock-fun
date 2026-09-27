import type { Metadata } from "next";
import LiveBoard from "@/components/LiveBoard";
import { query } from "@/lib/db";

export const metadata: Metadata = { title: "看盤" };
export const dynamic = "force-dynamic";

async function loadWatchlist(): Promise<string[]> {
  try {
    const rows = await query<{ symbol: string }>(
      "SELECT symbol FROM watchlist ORDER BY sort_order, added_at",
    );
    if (rows.length) return rows.map((r) => r.symbol);
  } catch {
    // 資料庫未啟動時使用預設清單，方便先開發介面
  }
  return ["2330", "0050"];
}

export default async function MarketPage() {
  const symbols = await loadWatchlist();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">看盤</h1>
      <LiveBoard symbols={symbols} />
    </div>
  );
}
