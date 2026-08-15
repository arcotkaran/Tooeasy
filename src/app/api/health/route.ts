import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Deployment diagnostic. Reports whether the server can see its database
 * configuration and reach Postgres. Never returns the connection string or
 * any credential — only booleans and the driver's error message.
 */
export async function GET() {
  const raw = process.env.DATABASE_URL;
  const out: Record<string, unknown> = {
    hasDatabaseUrl: Boolean(raw),
    host: null as string | null,
    pgModule: "unknown",
    dbOk: false,
    error: null as string | null,
  };

  if (raw) {
    try {
      out.host = new URL(raw).host;
    } catch {
      out.host = "unparseable";
    }
  }

  try {
    await import("pg");
    out.pgModule = "loaded";
  } catch (e) {
    out.pgModule = "MISSING: " + (e as Error).message;
    return NextResponse.json(out, { status: 500 });
  }

  if (!raw) return NextResponse.json(out, { status: 500 });

  try {
    const { query } = await import("@/server/db");
    const rows = await query<{ n: number }>("SELECT count(*)::int AS n FROM users");
    out.dbOk = true;
    out.userCount = rows[0]?.n ?? 0;
  } catch (e) {
    out.error = (e as Error).message;
    return NextResponse.json(out, { status: 500 });
  }

  return NextResponse.json(out);
}
