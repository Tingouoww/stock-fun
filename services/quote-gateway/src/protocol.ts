/**
 * 瀏覽器 ↔ 行情閘道 的訊息格式。
 * apps/web/lib/quotes.ts 有同一份定義，改動時兩邊要一起改。
 */
export type ClientMessage = { type: "subscribe"; symbols: string[] };

export type ServerMessage =
  | { type: "status"; connected: boolean; source: "fugle" | "demo" }
  | { type: "snapshot"; symbol: string; referencePrice: number; lastPrice: number | null }
  | { type: "trade"; symbol: string; price: number; size: number; time: number };

export function parseClientMessage(raw: string): ClientMessage | null {
  try {
    const msg = JSON.parse(raw);
    if (msg?.type === "subscribe" && Array.isArray(msg.symbols)) {
      // 台股代號：4–6 位英數字，擋掉奇怪輸入
      const symbols = msg.symbols.filter((s: unknown) => typeof s === "string" && /^[0-9A-Z]{4,6}$/.test(s));
      return { type: "subscribe", symbols: symbols.slice(0, 100) };
    }
  } catch {
    /* 忽略格式錯誤的訊息 */
  }
  return null;
}
