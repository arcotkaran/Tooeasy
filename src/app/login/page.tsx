import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn, googleConfigured } from "@/auth";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const session = await auth();
  const target = next && next.startsWith("/") ? next : "/book";

  if (session?.user) redirect(target);

  return (
    <main className="glow relative flex min-h-dvh flex-col overflow-hidden bg-ink px-5">
      <header className="relative z-10 flex h-16 items-center">
        <Logo />
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center pb-24">
        <div className="w-full max-w-sm">
          <h1 className="display text-[2.5rem] leading-[1.02]">
            Sign in to
            <br />
            book a pickup.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            One tap with Google. We use it to keep your bookings, your car
            details and your estimates in one place — and so only you can
            approve work on your car.
          </p>

          {googleConfigured ? (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: target });
              }}
              className="mt-8"
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-full bg-fg px-6 py-4 font-semibold text-black transition hover:bg-white active:scale-[0.99]"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.5 7l6.9 5.4c4.1-3.8 6.6-9.4 6.6-15.7z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.4c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M11.5 28.4c-.5-1.4-.7-2.8-.7-4.4s.3-3 .7-4.4l-7.1-5.5C2.9 17 2 20.4 2 24s.9 7 2.4 9.9l7.1-5.5z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 10.3c4.1 0 6.9 1.8 8.5 3.3l6.1-6C34.9 4.1 29.9 2 24 2 15.4 2 8.1 6.9 4.4 14.1l7.1 5.5c1.8-5.3 6.7-9.3 12.5-9.3z"
                  />
                </svg>
                Continue with Google
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
              <p className="display text-[15px] text-acid">
                Google sign-in isn&rsquo;t configured yet
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                Add <code className="text-fg">AUTH_GOOGLE_ID</code>,{" "}
                <code className="text-fg">AUTH_GOOGLE_SECRET</code> and{" "}
                <code className="text-fg">AUTH_SECRET</code> to the site&rsquo;s
                environment variables, then redeploy.
              </p>
            </div>
          )}

          <p className="mt-6 text-[13px] leading-relaxed text-muted">
            By continuing you agree that a Too Easy driver may operate your
            vehicle for the purpose of transport to and from the repair shop.
          </p>

          <Link
            href="/"
            className="mt-8 inline-block text-[13px] text-muted underline underline-offset-4 transition hover:text-fg"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
