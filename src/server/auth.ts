import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getDb, nowIso, uid } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/password";

export type Role = "admin" | "customer" | "driver" | "mechanic";

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  active: number;
  created_at: string;
};

const SESSION_COOKIE = "te_session";
const SESSION_DAYS = 30;

export { hashPassword, verifyPassword };

/* ── sessions ──────────────────────────────────────────────── */

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  getDb()
    .prepare(
      "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    )
    .run(token, userId, expires.toISOString(), nowIso());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
    jar.delete(SESSION_COOKIE);
  }
}

/** The signed-in user, or null. Expired sessions are cleaned up on read. */
export async function currentUser(): Promise<User | null> {
  // Touch the database on every request path so the schema and the seed
  // accounts exist even for a visitor who never signs in.
  getDb();

  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.phone, u.role, u.active, u.created_at, s.expires_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token = ?`,
    )
    .get(token) as (User & { expires_at: string }) | undefined;

  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  if (!row.active) return null;

  const { expires_at: _drop, ...user } = row;
  return user;
}

/** Where each role lands after signing in. */
export function homeForRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "driver":
      return "/driver";
    case "mechanic":
      return "/garage";
    default:
      return "/dashboard";
  }
}

/* ── users ─────────────────────────────────────────────────── */

export function findUserByEmail(email: string) {
  return getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as
    | (User & { password_hash: string })
    | undefined;
}

export function listUsers(): User[] {
  return getDb()
    .prepare(
      "SELECT id, email, name, phone, role, active, created_at FROM users ORDER BY role, name",
    )
    .all() as User[];
}

export function listByRole(role: Role): User[] {
  return getDb()
    .prepare(
      "SELECT id, email, name, phone, role, active, created_at FROM users WHERE role = ? AND active = 1 ORDER BY name",
    )
    .all(role) as User[];
}

export type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  role: Role;
  createdBy?: string | null;
};

export function createUser(input: CreateUserInput): { id: string } {
  const id = uid();
  getDb()
    .prepare(
      `INSERT INTO users (id, email, password_hash, name, phone, role, active, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    )
    .run(
      id,
      input.email.trim().toLowerCase(),
      hashPassword(input.password),
      input.name.trim(),
      input.phone?.trim() || null,
      input.role,
      nowIso(),
      input.createdBy ?? null,
    );
  return { id };
}

export function setUserActive(id: string, active: boolean) {
  getDb().prepare("UPDATE users SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
}
