import { RestClient, WebSocketClient } from "@fugle/marketdata";
import type { ServerMessage } from "./protocol.js";

type Emit = (msg: ServerMessage) => void;

export interface QuoteSource {
  readonly name: "fugle" | "demo";
  start(emit: Emit): Promise<void>;
  subscribe(symbols: string[]): Promise<void>;
}

/** 富果即時行情：一條上游連線，依瀏覽器需要增加訂閱 */
export class FugleSource implements QuoteSource {
  readonly name = "fugle" as const;
  private rest: RestClient;
  private ws: WebSocketClient;
  private subscribed = new Set<string>();
  private emit: Emit = () => {};

  constructor(apiKey: string) {
    this.rest = new RestClient({ apiKey });
    this.ws = new WebSocketClient({ apiKey });
  }

  async start(emit: Emit) {
    this.emit = emit;
    const stock = this.ws.stock;
    stock.on("message", (raw: string) => {
      const msg = JSON.parse(raw);
      if (msg.event !== "data" || msg.channel !== "trades") return;
      const d = msg.data;
      if (typeof d?.price !== "number") return;
      // 富果 time 為微秒
      emit({ type: "trade", symbol: d.symbol, price: d.price, size: d.size ?? 0, time: Math.floor(d.time / 1000) });
    });
    // 未處理的 error 事件會讓 Node 程序直接結束，一定要接住
    stock.on("error", (err: unknown) => console.error("[fugle] 連線錯誤", err));
    stock.on("unauthenticated", () => console.error("[fugle] 金鑰驗證失敗，請檢查 FUGLE_API_KEY"));
    stock.on("disconnect", () => {
      emit({ type: "status", connected: false, source: "fugle" });
      setTimeout(() => void this.reconnect(), 5000);
    });
    await this.reconnect();
  }

  /** 連線並重新訂閱所有代號；失敗時 5 秒後重試 */
  private async reconnect() {
    try {
      await this.ws.stock.connect();
      for (const symbol of this.subscribed) this.ws.stock.subscribe({ channel: "trades", symbol });
      this.emit({ type: "status", connected: true, source: "fugle" });
    } catch (err) {
      console.error("[fugle] 連線失敗，5 秒後重試", err);
      setTimeout(() => void this.reconnect(), 5000);
    }
  }

  async subscribe(symbols: string[]) {
    for (const symbol of symbols) {
      if (this.subscribed.has(symbol)) {
        await this.sendSnapshot(symbol);
        continue;
      }
      this.subscribed.add(symbol);
      this.ws.stock.subscribe({ channel: "trades", symbol });
      await this.sendSnapshot(symbol);
    }
  }

  private async sendSnapshot(symbol: string) {
    try {
      const q = await this.rest.stock.intraday.quote({ symbol });
      const last = q.lastPrice ?? q.closePrice ?? null;
      // 參考價（昨收）＝ 最新價 − 漲跌
      const referencePrice = last != null ? +(last - (q.change ?? 0)).toFixed(2) : q.openPrice;
      this.emit({ type: "snapshot", symbol, referencePrice, lastPrice: last });
    } catch (err) {
      console.error(`[fugle] 取得 ${symbol} 快照失敗`, err);
    }
  }
}

/** 模擬行情：沒有金鑰或非交易時段時用來開發介面 */
export class DemoSource implements QuoteSource {
  readonly name = "demo" as const;
  private prices = new Map<string, { ref: number; last: number }>();
  private emit: Emit = () => {};

  async start(emit: Emit) {
    this.emit = emit;
    emit({ type: "status", connected: true, source: "demo" });
    setInterval(() => {
      for (const [symbol, p] of this.prices) {
        if (Math.random() < 0.5) continue;
        const step = Math.max(0.05, Math.round(p.ref * 0.001 * 20) / 20);
        const next = Math.max(0.01, +(p.last + (Math.random() - 0.5) * 2 * step).toFixed(2));
        p.last = next;
        emit({ type: "trade", symbol, price: next, size: Math.ceil(Math.random() * 20), time: Date.now() });
      }
    }, 1000);
  }

  async subscribe(symbols: string[]) {
    for (const symbol of symbols) {
      if (!this.prices.has(symbol)) {
        const ref = 50 + (parseInt(symbol, 36) % 900);
        this.prices.set(symbol, { ref, last: ref });
      }
      const p = this.prices.get(symbol)!;
      this.emit({ type: "snapshot", symbol, referencePrice: p.ref, lastPrice: p.last });
    }
  }
}
