import { getDatabase } from "@netlify/database";

type DB = ReturnType<typeof getDatabase>;

let cached: DB | null = null;

/**
 * Lazy so that importing this module during `next build` (where no database
 * is attached yet) never throws. Every caller is inside a request handler.
 */
export function db(): DB {
  if (!cached) cached = getDatabase();
  return cached;
}

/** Short human-quotable booking reference, e.g. "TE-4K9P2". */
export function newRef(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `TE-${out}`;
}
