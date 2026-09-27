"use client";

import { useEffect, useRef, useState } from "react";
import type { ServerMessage } from "@/lib/quotes";

export type Quote = {
  symbol: string;
  price: number | null;
  referencePrice: number | null;
  /** 最近一次跳價方向，用來閃色提示 */
  tick: "up" | "down" | null;
  updatedAt: number;
};

type TradeListener = (t: Extract<ServerMessage, { type: "trade" }>) => void;

const WS_URL = process.env.NEXT_PUBLIC_QUOTE_WS_URL ?? "ws://localhost:8787";

/** 連線到行情閘道並訂閱指定代號；斷線時每 3 秒自動重連 */
export function useQuotes(symbols: string[], onTrade?: TradeListener) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [status, setStatus] = useState<"connecting" | "live" | "demo" | "offline">("connecting");
  const onTradeRef = useRef(onTrade);
  useEffect(() => {
    onTradeRef.current = onTrade;
  }, [onTrade]);

  const key = symbols.join(",");

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => ws?.send(JSON.stringify({ type: "subscribe", symbols: key.split(",") }));
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data) as ServerMessage;
        if (msg.type === "status") {
          setStatus(msg.connected ? (msg.source === "demo" ? "demo" : "live") : "offline");
          return;
        }
        setQuotes((prev) => {
          const old = prev[msg.symbol];
          if (msg.type === "snapshot") {
            return {
              ...prev,
              [msg.symbol]: {
                symbol: msg.symbol,
                price: msg.lastPrice ?? old?.price ?? null,
                referencePrice: msg.referencePrice,
                tick: null,
                updatedAt: Date.now(),
              },
            };
          }
          const tick = old?.price == null ? null : msg.price > old.price ? "up" : msg.price < old.price ? "down" : old.tick;
          return {
            ...prev,
            [msg.symbol]: {
              symbol: msg.symbol,
              price: msg.price,
              referencePrice: old?.referencePrice ?? null,
              tick,
              updatedAt: Date.now(),
            },
          };
        });
        if (msg.type === "trade") onTradeRef.current?.(msg);
      };
      ws.onclose = () => {
        setStatus("offline");
        if (!closed) retry = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      ws?.close();
    };
  }, [key]);

  return { quotes, status };
}
