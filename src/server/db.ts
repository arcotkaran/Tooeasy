import { Pool } from "pg";

/**
 * Supabase Postgres.
 *
 * Connects through Supabase's transaction pooler (port 6543) rather than the
 * direct host: the direct endpoint only publishes an AAAA record, so it is
 * unreachable from IPv4-only networks, and the pooler is the right choice for
 * serverless anyway.
 *
 * Pool is kept tiny because each serverless instance gets its own.
 */

declare global {
  // eslint-disable-next-line no-var
  var __tooeasyPool: Pool | undefined;
}

/**
 * Supabase's direct host (db.<ref>.supabase.co) only publishes an AAAA record,
 * so it is unreachable from IPv4-only networks — including Netlify's builders
 * and functions. Rewrite it to the transaction pooler, which is the supported
 * endpoint for serverless anyway. Accepts either form in DATABASE_URL.
 */
function toPooler(raw: string): string {
  const u = new URL(raw);
  const m = /^db\.([a-z0-9]+)\.supabase\.co$/.exec(u.hostname);
  if (!m) return raw;

  const ref = m[1];
  u.hostname = `aws-0-${process.env.SUPABASE_REGION ?? "ap-southeast-2"}.pooler.supabase.com`;
  u.port = "6543";
  // The pooler requires the tenant-qualified username.
  if (!u.username.includes(".")) u.username = `${u.username}.${ref}`;
  return u.toString();
}

function makePool(): Pool {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set.");
  }
  const connectionString = toPooler(raw);
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  });
}

/** Reused across hot reloads in dev so we don't leak connections. */
export function pool(): Pool {
  if (!global.__tooeasyPool) global.__tooeasyPool = makePool();
  return global.__tooeasyPool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool().query(text, params as never[]);
  return res.rows as T[];
}

export async function one<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export const nowIso = () => new Date().toISOString();
