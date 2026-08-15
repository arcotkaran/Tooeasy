import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SignupForm } from "@/components/AuthForms";
import { currentUser, homeForRole } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await currentUser();
  if (user) redirect(homeForRole(user.role));

  return (
    <main className="glow relative flex min-h-dvh flex-col overflow-hidden bg-page px-5">
      <header className="relative z-10 flex h-16 items-center">
        <Logo />
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center pb-24">
        <div className="w-full max-w-sm">
          <h1 className="display text-[2.5rem] leading-[1.02]">
            Create your
            <br />
            profile.
          </h1>
          <p className="mt-3 mb-8 text-[15px] leading-relaxed text-muted">
            It keeps your bookings in one place and means you can check where
            your car is without ringing anyone.
          </p>

          <SignupForm />

          <Link
            href="/"
            className="mt-8 inline-block text-[13px] text-muted underline underline-offset-4 transition hover:text-ink"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
