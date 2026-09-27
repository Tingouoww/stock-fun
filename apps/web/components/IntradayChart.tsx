"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";

export type IntradayChartHandle = { push: (timeMs: number, price: number) => void };

/** 分時走勢圖：以 Canvas 繪製，逐筆增量更新，不重畫整張圖 */
export default function IntradayChart({
  onReady,
  height = 320,
}: {
  onReady: (handle: IntradayChartHandle) => void;
  height?: number;
}) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!el.current) return;
    const css = getComputedStyle(document.documentElement);
    const chart = createChart(el.current, {
      height,
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: css.getPropertyValue("--muted").trim(),
      },
      grid: {
        vertLines: { color: css.getPropertyValue("--border").trim() },
        horzLines: { color: css.getPropertyValue("--border").trim() },
      },
      rightPriceScale: { borderColor: css.getPropertyValue("--border").trim() },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: css.getPropertyValue("--border").trim(),
      },
      localization: { locale: "zh-TW" },
    });
    const series: ISeriesApi<"Line"> = chart.addSeries(LineSeries, {
      color: css.getPropertyValue("--accent").trim(),
      lineWidth: 2,
    });

    // lightweight-charts 以 UTC 秒為單位；加 8 小時讓時間軸顯示台北時間
    const TAIPEI_OFFSET = 8 * 3600;
    onReady({
      push: (timeMs, price) =>
        series.update({ time: (Math.floor(timeMs / 1000) + TAIPEI_OFFSET) as UTCTimestamp, value: price }),
    });

    return () => chart.remove();
  }, [onReady, height]);

  return <div ref={el} className="w-full" style={{ height }} />;
}
