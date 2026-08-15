import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { BookingForm } from "@/components/BookingForm";

export const metadata: Metadata = {
  title: "Book a pickup — Too Easy",
  description:
    "Book a car service pickup and return from your home or office around Wentworthville.",
};

export default function BookPage() {
  return (
    <div className="min-h-dvh bg-ink">
      <header className="sticky top-0 z-50 border-b border-line/60 bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Logo />
          <span className="text-[13px] text-muted">Two-minute booking</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <BookingForm />
      </main>
    </div>
  );
}
