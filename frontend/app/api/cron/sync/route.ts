import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/server/http";
import { getRuntime } from "@/lib/server/runtime";

export const maxDuration = 60;

/**
 * Forces a catalog sync. Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`.
 * Without CRON_SECRET the route refuses to run in production. The catalog also refreshes lazily on /api/match.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const bearer = req.headers.get("authorization");
  const allowed = secret ? bearer === `Bearer ${secret}` : process.env.NODE_ENV !== "production";
  if (!allowed) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not allowed." } }, { status: 401 });

  try {
    const stats = await getRuntime().runtime.service.ensureCatalog(true);
    return NextResponse.json({ ok: true, stats });
  } catch (e) {
    return errorResponse(e);
  }
}
