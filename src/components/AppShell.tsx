import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Logo } from "@/components/Logo";
import type { Role } from "@/lib/status";

const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: "/dashboard", label: "My bookings", roles: ["customer", "driver", "mechanic", "admin"] },
  { href: "/driver", label: "Driver", roles: ["driver", "admin"] },
  { href: "/garage", label: "Shop", roles: ["mechanic", "admin"] },
  { href: "/admin", label: "Ops", roles: ["admin"] },
];

export async function AppShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  const session = await auth();
  const role = (session?.user?.role ?? "customer") as Role;
  const links = NAV.filter((n) => n.roles.includes(role));

  return (
    <div className="min-h-dvh bg-ink">
      <header className="sticky top-0 z-50 border-b border-line/60 bg-ink/85 backdrop-blur-xl">
        <div
          className={`mx-auto flex h-16 items-center justify-between gap-4 px-5 ${
            wide ? "max-w-7xl" : "max-w-3xl"
          }`}
        >
          <div className="flex items-center gap-6">
            <Logo />
            {links.length > 1 && (
              <nav className="hidden items-center gap-1 sm:flex">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-full px-3 py-1.5 text-sm text-muted transition hover:bg-surface hover:text-fg"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2">
            {session?.user ? (
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition hover:text-fg">
                  Sign out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-acid px-4 py-2 text-sm font-semibold text-black"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {links.length > 1 && (
          <nav className="flex gap-1 overflow-x-auto border-t border-line/60 px-5 py-2 sm:hidden">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="shrink-0 rounded-full bg-surface px-3.5 py-1.5 text-sm text-muted"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className={`mx-auto px-5 py-8 ${wide ? "max-w-7xl" : "max-w-3xl"}`}>
        {children}
      </main>
    </div>
  );
}
