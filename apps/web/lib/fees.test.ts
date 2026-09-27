import { describe, expect, it } from "vitest";
import { calcTradeCost } from "./fees";

describe("calcTradeCost", () => {
  it("買進一張：手續費 0.1425%，不收證交稅", () => {
    // 1000 股 × 600 元 = 600,000；手續費 855
    expect(calcTradeCost({ side: "buy", shares: 1000, price: 600 })).toEqual({
      gross: 600000,
      fee: 855,
      tax: 0,
      net: 600855,
    });
  });

  it("賣出一張股票：扣手續費與 0.3% 證交稅", () => {
    expect(calcTradeCost({ side: "sell", shares: 1000, price: 600 })).toEqual({
      gross: 600000,
      fee: 855,
      tax: 1800,
      net: 597345,
    });
  });

  it("券商折扣後仍不低於整股低消 20 元", () => {
    // 1000 × 10 = 10,000；10,000 × 0.1425% × 0.28 = 3.99 → 低消 20
    expect(calcTradeCost({ side: "buy", shares: 1000, price: 10, discount: 0.28 }).fee).toBe(20);
  });

  it("零股適用零股低消", () => {
    // 5 股 × 100 = 500；0.71 → 捨去為 0 → 零股低消 1
    expect(calcTradeCost({ side: "buy", shares: 5, price: 100 }).fee).toBe(1);
  });

  it("ETF 賣出證交稅 0.1%", () => {
    expect(calcTradeCost({ side: "sell", shares: 1000, price: 150, isEtf: true }).tax).toBe(150);
  });

  it("當沖賣出證交稅 0.15%", () => {
    expect(calcTradeCost({ side: "sell", shares: 1000, price: 100, isDayTrade: true }).tax).toBe(150);
  });

  it("小數價格不產生浮點誤差", () => {
    // 1000 × 33.35 = 33,350
    expect(calcTradeCost({ side: "buy", shares: 1000, price: 33.35 }).gross).toBe(33350);
  });

  it("拒絕不合理的輸入", () => {
    expect(() => calcTradeCost({ side: "buy", shares: 0, price: 10 })).toThrow();
    expect(() => calcTradeCost({ side: "buy", shares: 1.5, price: 10 })).toThrow();
    expect(() => calcTradeCost({ side: "buy", shares: 1, price: 0 })).toThrow();
  });
});
