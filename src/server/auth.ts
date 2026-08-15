import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { query, one } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/password";

export type Role = "admin" | "customer" | "driver" | "mechanic";

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  active: boolean;
  created_at: string;
};

const SESSION_COOKIE = "te_session";
const SESSION_DAYS = 30;

export { hashPassword, verifyPassword };

/* ── sessions ──────────────────────────────────────────────── */

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await query(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)",
    [token, userId, expires.toISOString()],
  );

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
    await query("DELETE FROM sessions WHERE token = $1", [token]);
    jar.delete(SESSION_COOKIE);
  }
}

/** The signed-in user, or null. Expired sessions are cleaned up on read. */
export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await one<User & { expires_at: string }>(
    `SELECT u.id, u.email, u.name, u.phone, u.role, u.active, u.created_at, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = $1`,
    [token],
  );

  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    await query("DELETE FROM sessions WHERE token = $1", [token]);
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

export async function findUserByEmail(email: string) {
  return one<User & { password_hash: string }>(
    "SELECT * FROM users WHERE email = $1",
    [email.trim().toLowerCase()],
  );
}

export async function listUsers(): Promise<User[]> {
  return query<User>(
    "SELECT id, email, name, phone, role, active, created_at FROM users ORDER BY role, name",
  );
}

export async function listByRole(role: Role): Promise<User[]> {
  return query<User>(
    `SELECT id, email, name, phone, role, active, created_at
       FROM users WHERE role = $1 AND active ORDER BY name`,
    [role],
  );
}

export type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  role: Role;
  createdBy?: string | null;
};

export async function createUser(input: CreateUserInput): Promise<{ id: string }> {
  const row = await one<{ id: string }>(
    `INSERT INTO users (email, password_hash, name, phone, role, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      input.email.trim().toLowerCase(),
      hashPassword(input.password),
      input.name.trim(),
      input.phone?.trim() || null,
      input.role,
      input.createdBy ?? null,
    ],
  );
  return { id: row!.id };
}

export async function setUserActive(id: string, active: boolean) {
  await query("UPDATE users SET active = $1 WHERE id = $2", [active, id]);
}
