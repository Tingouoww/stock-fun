const twd = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 });
const price = new Intl.NumberFormat("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatTwd = (n: number | string | null | undefined) =>
  n == null ? "—" : twd.format(Number(n));

export const formatPrice = (n: number | string | null | undefined) =>
  n == null ? "—" : price.format(Number(n));

/** 台股慣例：紅漲綠跌。回傳對應的 CSS class */
export const changeClass = (change: number) =>
  change > 0 ? "text-up" : change < 0 ? "text-down" : "text-flat";
