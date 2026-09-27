/**
 * 台股交易成本計算。
 * 費率會變動、各券商折扣不同，所以全部集中在 FEE_CONFIG，不要散落在程式各處。
 * 所有金額以「元」為單位，計算結果無條件捨去到整數（券商與證交稅的一般做法；
 * 請以自己券商的對帳單驗證一次，不同時調整這裡）。
 */

export const FEE_CONFIG = {
  /** 法定手續費率上限 0.1425% */
  brokerageRate: 0.001425,
  /** 整股每筆最低手續費（元） */
  minFeeBoardLot: 20,
  /** 零股每筆最低手續費（元），各券商不同 */
  minFeeOddLot: 1,
  /** 證交稅：一般股票 0.3% */
  taxRateStock: 0.003,
  /** 證交稅：ETF 0.1% */
  taxRateEtf: 0.001,
  /** 證交稅：現股當沖 0.15%（適用期限依法規公告，到期請更新） */
  taxRateDayTrade: 0.0015,
  /** 一張 = 1000 股 */
  boardLotShares: 1000,
} as const;

export type Side = "buy" | "sell";

export interface TradeInput {
  side: Side;
  shares: number;
  price: number;
  /** 券商手續費折扣，0.28 代表 2.8 折；1 代表不打折 */
  discount?: number;
  isEtf?: boolean;
  isDayTrade?: boolean;
}

export interface TradeCost {
  /** 成交金額 */
  gross: number;
  fee: number;
  tax: number;
  /** 買進：實付金額（正數）；賣出：實收金額（正數） */
  net: number;
}

export function calcFee(gross: number, shares: number, discount = 1): number {
  if (gross <= 0) return 0;
  const isOddLot = shares % FEE_CONFIG.boardLotShares !== 0 && shares < FEE_CONFIG.boardLotShares;
  const minFee = isOddLot ? FEE_CONFIG.minFeeOddLot : FEE_CONFIG.minFeeBoardLot;
  const raw = Math.floor(gross * FEE_CONFIG.brokerageRate * discount);
  return Math.max(raw, minFee);
}

export function calcTax(gross: number, opts: { isEtf?: boolean; isDayTrade?: boolean }): number {
  const rate = opts.isEtf
    ? FEE_CONFIG.taxRateEtf
    : opts.isDayTrade
      ? FEE_CONFIG.taxRateDayTrade
      : FEE_CONFIG.taxRateStock;
  return Math.floor(gross * rate);
}

export function calcTradeCost(input: TradeInput): TradeCost {
  const { side, shares, price, discount = 1, isEtf = false, isDayTrade = false } = input;
  if (!Number.isInteger(shares) || shares <= 0) throw new Error("股數必須是正整數");
  if (!(price > 0)) throw new Error("價格必須大於 0");

  // 以「分」計算避免浮點誤差，再轉回元並捨去
  const gross = Math.floor(Math.round(price * 100) * shares / 100);
  const fee = calcFee(gross, shares, discount);
  const tax = side === "sell" ? calcTax(gross, { isEtf, isDayTrade }) : 0;
  const net = side === "buy" ? gross + fee : gross - fee - tax;
  return { gross, fee, tax, net };
}
