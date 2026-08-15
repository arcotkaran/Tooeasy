import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { SignInGate } from "@/components/SignInGate";
import { AccountChip } from "@/components/AccountChip";

export const metadata: Metadata = {
  title: "Book a pickup — Too Easy",
  description:
    "Book a car service pickup and return from your home or office around Parramatta.",
};

export default function BookPage() {
  return (
    <div className="min-h-dvh bg-page">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-page/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Logo />
          <AccountChip />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <SignInGate />
      </main>
    </div>
  );
}
