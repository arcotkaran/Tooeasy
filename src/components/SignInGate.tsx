"use client";

import { useAuth } from "@/components/AuthProvider";
import { signInWithGoogle } from "@/lib/supabase";
import { BookingForm } from "@/components/BookingForm";

export function SignInGate() {
  const { user, loading, configured } = useAuth();

  // No Supabase project yet — keep taking bookings rather than blocking on it.
  if (!configured) {
    return <BookingForm />;
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-[15px] text-muted">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
        <p className="mt-4">Checking your sign-in…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rise py-8">
        <h1 className="display text-[2.3rem] leading-[1.05]">
          Sign in to book
          <br />
          your pickup.
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">
          One tap with Google. It keeps your bookings and car details in one
          place, and means only you can make changes to them.
        </p>

        <button
          onClick={() => signInWithGoogle(window.location.href)}
          className="mt-8 flex w-full max-w-sm items-center justify-center gap-3 rounded-full border border-line bg-surface px-6 py-4 font-semibold text-ink transition hover:border-brand/50 active:scale-[0.99] card-shadow"
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

        <p className="mt-6 max-w-md text-[13px] leading-relaxed text-muted">
          By continuing you agree that a Too Easy driver may drive your vehicle
          to and from the workshop.
        </p>
      </div>
    );
  }

  const meta = user.user_metadata ?? {};
  return (
    <BookingForm
      defaultName={(meta.full_name as string) ?? (meta.name as string) ?? ""}
      defaultEmail={user.email ?? ""}
    />
  );
}
