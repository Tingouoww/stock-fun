import type { Metadata } from "next";
import { calcTradeCost } from "@/lib/fees";
import { formatTwd } from "@/lib/format";

export const metadata: Metadata = { title: "記帳" };

// M1、M2 會在這裡實作快速記帳與投資交易。目前先展示手續費計算結果。
export default function LedgerPage() {
  const example = calcTradeCost({ side: "buy", shares: 1000, price: 600, discount: 0.28 });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">記帳</h1>
      <p className="text-sm text-muted">快速記帳與投資交易將於 M1、M2 完成。</p>
      <section className="num rounded-lg border border-border bg-panel p-4 text-sm">
        <h2 className="mb-2 font-medium">試算：買進 2330 一張 @600，手續費 2.8 折</h2>
        <dl className="grid grid-cols-2 gap-1 sm:w-80">
          <dt className="text-muted">成交金額</dt>
          <dd className="text-right">{formatTwd(example.gross)}</dd>
          <dt className="text-muted">手續費</dt>
          <dd className="text-right">{formatTwd(example.fee)}</dd>
          <dt className="text-muted">應付金額</dt>
          <dd className="text-right font-medium">{formatTwd(example.net)}</dd>
        </dl>
      </section>
    </div>
  );
}
