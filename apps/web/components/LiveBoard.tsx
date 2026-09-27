"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import IntradayChart, { type IntradayChartHandle } from "./IntradayChart";
import { useQuotes } from "./useQuotes";
import { changeClass, formatPrice } from "@/lib/format";

const STATUS_TEXT = {
  connecting: "連線中…",
  live: "即時",
  demo: "模擬資料（未設定 FUGLE_API_KEY）",
  offline: "延遲中：行情閘道未連線，重試中",
} as const;

export default function LiveBoard({ symbols }: { symbols: string[] }) {
  const [selected, setSelected] = useState(symbols[0]);
  const chart = useRef<IntradayChartHandle | null>(null);
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const onTrade = useCallback((t: { symbol: string; price: number; time: number }) => {
    if (t.symbol === selectedRef.current) chart.current?.push(t.time, t.price);
  }, []);
  const { quotes, status } = useQuotes(symbols, onTrade);
  const onReady = useCallback((h: IntradayChartHandle) => {
    chart.current = h;
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <section className="rounded-lg border border-border bg-panel">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted">
          <span>自選股</span>
          <span>{STATUS_TEXT[status]}</span>
        </div>
        <ul className="num">
          {symbols.map((s) => {
            const q = quotes[s];
            const change = q?.price != null && q.referencePrice ? q.price - q.referencePrice : 0;
            const pct = q?.referencePrice ? (change / q.referencePrice) * 100 : 0;
            return (
              <li key={s}>
                <button
                  onClick={() => setSelected(s)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors ${
                    s === selected ? "bg-bg" : ""
                  }`}
                >
                  <span className="font-medium">{s}</span>
                  <span className={`text-right ${changeClass(change)}`}>
                    {/* key 變動會重新觸發閃色動畫 */}
                    <span
                      key={q?.updatedAt}
                      className={`block rounded px-1 ${q?.tick === "up" ? "flash-up" : q?.tick === "down" ? "flash-down" : ""}`}
                    >
                      {formatPrice(q?.price)}
                    </span>
                    <span className="block text-xs">
                      {change >= 0 ? "+" : ""}
                      {formatPrice(change)}（{pct.toFixed(2)}%）
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-panel p-3">
        <h2 className="mb-2 font-medium">{selected} 分時走勢</h2>
        {/* key 讓切換個股時重建圖表 */}
        <IntradayChart key={selected} onReady={onReady} />
      </section>
    </div>
  );
}
