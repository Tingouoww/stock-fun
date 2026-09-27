import { query } from "@/lib/db";
import { formatPrice, formatTwd } from "@/lib/format";

export const dynamic = "force-dynamic";

type Holding = {
  symbol: string;
  name: string;
  shares: number;
  avg_cost: string | null;
  last_close: string | null;
  market_value: string | null;
};

async function loadHoldings(): Promise<{ rows: Holding[]; error?: string }> {
  try {
    return { rows: await query<Holding>("SELECT * FROM holdings ORDER BY market_value DESC NULLS LAST") };
  } catch {
    return { rows: [], error: "連不上資料庫。請確認已執行 docker compose up -d db 並設定 .env。" };
  }
}

export default async function DashboardPage() {
  const { rows, error } = await loadHoldings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">總覽</h1>

      {error && (
        <p className="rounded-lg border border-border bg-panel p-4 text-sm text-muted">{error}</p>
      )}

      <section className="rounded-lg border border-border bg-panel p-4">
        <h2 className="mb-3 font-medium">我的持股</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">
            還沒有持股紀錄。先到「記帳」新增一筆買進，這裡就會出現持股與損益。
          </p>
        ) : (
          <table className="num w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="py-1">代號</th>
                <th>名稱</th>
                <th className="text-right">股數</th>
                <th className="text-right">平均成本</th>
                <th className="text-right">收盤</th>
                <th className="text-right">市值</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <tr key={h.symbol} className="border-t border-border">
                  <td className="py-1">{h.symbol}</td>
                  <td>{h.name}</td>
                  <td className="text-right">{formatTwd(h.shares)}</td>
                  <td className="text-right">{formatPrice(h.avg_cost)}</td>
                  <td className="text-right">{formatPrice(h.last_close)}</td>
                  <td className="text-right">{formatTwd(h.market_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
