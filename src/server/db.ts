import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { hashPassword } from "@/server/password";

/**
 * Offline database.
 *
 * SQLite via Node's built-in driver — no Docker, no service to run, no native
 * modules to compile. The schema deliberately mirrors `supabase/schema.sql`
 * (same table and column names) so moving to Supabase is a connection change
 * plus a data copy, not a rewrite.
 */

const DB_PATH = process.env.TOOEASY_DB ?? join(process.cwd(), ".data", "tooeasy.db");

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;

  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  migrate(db);
  seedIfEmpty(db);
  return db;
}

/**
 * Test accounts, created once on an empty database. Real accounts are made
 * through sign-up (customers) or by an admin (drivers and mechanics), so this
 * only ever runs against a fresh local database.
 */
export const SEED_ACCOUNTS = [
  { role: "admin", email: "admin@tooeasy.test", password: "TooEasyAdmin!2026", name: "Arcot (Admin)" },
  { role: "customer", email: "customer@tooeasy.test", password: "TooEasyUser!2026", name: "Alex Nguyen" },
  { role: "driver", email: "driver@tooeasy.test", password: "TooEasyDriver!2026", name: "Dave Papadopoulos" },
  { role: "mechanic", email: "mechanic@tooeasy.test", password: "TooEasyMech!2026", name: "Sam Rahman" },
] as const;

function seedIfEmpty(d: DatabaseSync) {
  const { n } = d.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (n > 0) return;

  const insert = d.prepare(
    `INSERT INTO users (id, email, password_hash, name, phone, role, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
  );
  for (const a of SEED_ACCOUNTS) {
    insert.run(
      crypto.randomUUID(),
      a.email,
      hashPassword(a.password),
      a.name,
      null,
      a.role,
      new Date().toISOString(),
    );
  }
  console.log(`[tooeasy] seeded ${SEED_ACCOUNTS.length} test accounts`);
}

function migrate(d: DatabaseSync) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      phone         TEXT,
      role          TEXT NOT NULL DEFAULT 'customer',
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL,
      created_by    TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id             TEXT PRIMARY KEY,
      ref            TEXT NOT NULL UNIQUE,
      user_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
      driver_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
      category       TEXT NOT NULL DEFAULT 'mechanic',
      status         TEXT NOT NULL DEFAULT 'requested',

      contact_name   TEXT NOT NULL,
      contact_phone  TEXT NOT NULL,
      contact_email  TEXT,

      vehicle        TEXT NOT NULL,
      services       TEXT NOT NULL DEFAULT '[]',
      concern        TEXT,

      pickup_address TEXT NOT NULL,
      suburb         TEXT NOT NULL,
      postcode       TEXT NOT NULL,
      pickup_date    TEXT NOT NULL,
      pickup_window  TEXT NOT NULL,
      key_handoff    TEXT NOT NULL DEFAULT 'in_person',

      request_id     TEXT UNIQUE,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS bookings_user_idx   ON bookings (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status, pickup_date);
    CREATE INDEX IF NOT EXISTS bookings_driver_idx ON bookings (driver_id, pickup_date);

    CREATE TABLE IF NOT EXISTS booking_events (
      id         TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      status     TEXT NOT NULL,
      note       TEXT,
      actor_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
      actor_role TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS booking_events_idx ON booking_events (booking_id, created_at);

    CREATE TABLE IF NOT EXISTS waitlist (
      id         TEXT PRIMARY KEY,
      email      TEXT NOT NULL,
      name       TEXT,
      suburb     TEXT,
      postcode   TEXT NOT NULL,
      vehicle    TEXT,
      category   TEXT NOT NULL DEFAULT 'mechanic',
      created_at TEXT NOT NULL
    );
  `);
}

export const nowIso = () => new Date().toISOString();

export function uid(): string {
  return crypto.randomUUID();
}
