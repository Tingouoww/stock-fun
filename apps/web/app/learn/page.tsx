import type { Metadata } from "next";

export const metadata: Metadata = { title: "教學" };

const tracks = [
  { level: "初階", topics: "記帳與緊急預備金、股票與 ETF、手續費與證交稅、零股與定期定額、除權息" },
  { level: "中階", topics: "三大財報、EPS、ROE、毛利率、月營收、本益比、殖利率、K 線與均線" },
  { level: "進階", topics: "自由現金流、估值模型、資產配置與再平衡、最大回撤、法人籌碼、稅務" },
];

// 課程內容放在 content/lessons/，M7 會加上 Markdown 渲染、進度與測驗
export default function LearnPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">教學</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {tracks.map((t) => (
          <section key={t.level} className="rounded-lg border border-border bg-panel p-4">
            <h2 className="mb-2 font-medium">{t.level}</h2>
            <p className="text-sm text-muted">{t.topics}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
