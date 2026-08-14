import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import type { Role } from "@/lib/status";

/** Comma-separated allowlists let us stand up staff accounts without an admin UI. */
function emailList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function roleForEmail(email: string): Role {
  const e = email.toLowerCase();
  if (emailList(process.env.ADMIN_EMAILS).includes(e)) return "admin";
  if (emailList(process.env.DRIVER_EMAILS).includes(e)) return "driver";
  if (emailList(process.env.MECHANIC_EMAILS).includes(e)) return "mechanic";
  return "customer";
}

export const googleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: googleConfigured
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          authorization: { params: { prompt: "select_account" } },
        }),
      ]
    : [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      // Only on the sign-in pass: mint or refresh our own user row.
      if (user?.email) {
        const email = user.email.toLowerCase();
        const seededRole = roleForEmail(email);
        try {
          const [row] = await db().sql<{ id: string; role: string }>`
            INSERT INTO users (email, name, image, role)
            VALUES (${email}, ${user.name ?? null}, ${user.image ?? null}, ${seededRole})
            ON CONFLICT (email) DO UPDATE
              SET name  = COALESCE(EXCLUDED.name, users.name),
                  image = COALESCE(EXCLUDED.image, users.image),
                  -- allowlist can promote, but never demotes someone already promoted
                  role  = CASE WHEN ${seededRole} = 'customer' THEN users.role ELSE ${seededRole} END
            RETURNING id, role
          `;
          token.uid = row.id;
          token.role = row.role;
        } catch {
          // Database not reachable — sign the user in as a plain customer
          // rather than hard-failing the whole login.
          token.role = seededRole;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
        session.user.role = (token.role as Role) ?? "customer";
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
