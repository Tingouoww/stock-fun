/**
 * 瀏覽器 ↔ 行情閘道（services/quote-gateway）之間的訊息格式。
 * 閘道端有同一份定義，改動時兩邊要一起改。
 */
export type ClientMessage = { type: "subscribe"; symbols: string[] };

export type ServerMessage =
  | { type: "status"; connected: boolean; source: "fugle" | "demo" }
  | { type: "snapshot"; symbol: string; referencePrice: number; lastPrice: number | null }
  | { type: "trade"; symbol: string; price: number; size: number; time: number };
