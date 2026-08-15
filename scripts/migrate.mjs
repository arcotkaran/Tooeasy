/**
 * Applies supabase/schema.sql and seeds the starting accounts.
 *
 *   node --env-file=.env.local scripts/migrate.mjs
 *
 * Safe to run repeatedly: the schema uses IF NOT EXISTS and the seed only
 * inserts an account when that email doesn't already exist.
 */
import { readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import pg from "pg";

const SEED = [
  { role: "admin", email: "admin@tooeasy.com.au", password: "TooEasyAdmin!2026", name: "Arcot (Admin)" },
  { role: "customer", email: "customer@tooeasy.test", password: "TooEasyUser!2026", name: "Alex Nguyen" },
  { role: "driver", email: "driver@tooeasy.com.au", password: "TooEasyDriver!2026", name: "Dave Papadopoulos" },
  { role: "mechanic", email: "mechanic@tooeasy.com.au", password: "TooEasyMech!2026", name: "Sam Rahman" },
];

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20_000,
});

await client.connect();
console.log("connected to", new URL(process.env.DATABASE_URL).host);

await client.query(readFileSync("supabase/schema.sql", "utf8"));
console.log("schema applied");

for (const a of SEED) {
  const { rowCount } = await client.query(
    `INSERT INTO public.users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    [a.email, hashPassword(a.password), a.name, a.role],
  );
  console.log(rowCount ? `seeded  ${a.role.padEnd(9)} ${a.email}` : `exists  ${a.role.padEnd(9)} ${a.email}`);
}

const { rows } = await client.query(
  "SELECT role, count(*)::int AS n FROM public.users GROUP BY role ORDER BY role",
);
console.log("users by role:", rows.map((r) => `${r.role}=${r.n}`).join(" "));

await client.end();
