import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/health：檢查網站與資料庫是否正常 */
export async function GET() {
  try {
    await query("SELECT 1");
    return Response.json({ ok: true, db: "up" });
  } catch {
    return Response.json({ ok: false, db: "down" }, { status: 503 });
  }
}
