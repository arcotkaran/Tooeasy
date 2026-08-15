import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { BookingForm } from "@/components/BookingForm";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a pickup — Too Easy",
  description:
    "Book a car service pickup and return from your home or office around Parramatta.",
};

export default async function BookPage() {
  // Booking stays open to everyone. Signing in just prefills the details and
  // files the booking under your account.
  const user = await currentUser();

  return (
    <div className="min-h-dvh bg-page">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-page/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Logo />
          {user ? (
            <Link href="/dashboard" className="text-[13px] text-muted hover:text-ink">
              {user.name}
            </Link>
          ) : (
            <Link href="/login" className="text-[13px] text-muted hover:text-ink">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <BookingForm
          defaultName={user?.name ?? ""}
          defaultEmail={user?.email ?? ""}
          defaultPhone={user?.phone ?? ""}
        />
      </main>
    </div>
  );
}
