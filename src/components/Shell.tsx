import Link from "next/link";
import { Logo } from "@/components/Logo";
import { signOutAction } from "@/app/actions";
import type { User } from "@/server/auth";

const NAV: Record<string, { href: string; label: string }[]> = {
  admin: [
    { href: "/admin", label: "Ops" },
    { href: "/driver", label: "Driver" },
    { href: "/garage", label: "Workshop" },
    { href: "/dashboard", label: "My bookings" },
  ],
  driver: [{ href: "/driver", label: "My jobs" }],
  mechanic: [{ href: "/garage", label: "Workshop" }],
  customer: [{ href: "/dashboard", label: "My bookings" }],
};

export function Shell({
  user,
  children,
  wide = false,
}: {
  user: User;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const links = NAV[user.role] ?? [];
  const width = wide ? "max-w-6xl" : "max-w-3xl";

  return (
    <div className="min-h-dvh bg-page">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-page/85 backdrop-blur-xl">
        <div className={`mx-auto flex h-16 ${width} items-center justify-between gap-4 px-5`}>
          <div className="flex items-center gap-5">
            <Logo />
            {links.length > 1 && (
              <nav className="hidden items-center gap-1 sm:flex">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-full px-3 py-1.5 text-sm text-muted transition hover:bg-surface hover:text-ink"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] text-muted sm:inline">
              {user.name}
              <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] capitalize">
                {user.role}
              </span>
            </span>
            <form action={signOutAction}>
              <button className="rounded-full border border-line px-3.5 py-1.5 text-[13px] text-muted transition hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {links.length > 1 && (
          <nav className="flex gap-1 overflow-x-auto border-t border-line/70 px-5 py-2 sm:hidden">
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

      <main className={`mx-auto ${width} px-5 py-8`}>{children}</main>
    </div>
  );
}
