"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Coverage = {
  covered: boolean;
  zip: string;
  area: string | null;
  distanceKm: number | null;
  reason?: string;
};

export function ZipCheck({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "done">("idle");
  const [result, setResult] = useState<Coverage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Waitlist sub-form, shown only when we can't serve the ZIP.
  const [email, setEmail] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{5}$/.test(zip.trim())) {
      setError("Enter a 5-digit ZIP code.");
      return;
    }
    setState("checking");
    try {
      const res = await fetch("/api/coverage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip: zip.trim() }),
      });
      const data = (await res.json()) as Coverage;
      setResult(data);
      setState("done");
    } catch {
      setError("Something went wrong. Try again.");
      setState("idle");
    }
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, zip: zip.trim(), vehicle }),
      });
      setJoined(true);
    } finally {
      setJoining(false);
    }
  }

  if (state === "done" && result?.covered) {
    return (
      <div className="rounded-xl2 border border-acid/35 bg-acid/[0.07] p-5 rise">
        <div className="flex items-start gap-3">
          <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-acid text-[11px] font-bold text-black">
            ✓
          </span>
          <div>
            <p className="display text-lg text-fg">
              We pick up in {result.area}.
            </p>
            <p className="mt-1 text-sm text-muted">
              You&rsquo;re inside our service area. Next slot is usually within 48 hours.
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/book?zip=${result.zip}`)}
          className="mt-4 w-full rounded-full bg-acid px-6 py-4 text-center text-[15px] font-semibold text-black transition hover:bg-acid-dim active:scale-[0.99]"
        >
          Book my pickup →
        </button>
        <button
          onClick={() => {
            setState("idle");
            setResult(null);
          }}
          className="mt-2 w-full text-center text-xs text-muted underline underline-offset-4 hover:text-fg"
        >
          Check a different ZIP
        </button>
      </div>
    );
  }

  if (state === "done" && result && !result.covered) {
    return (
      <div className="rounded-xl2 border border-line bg-surface p-5 rise">
        {joined ? (
          <div className="py-2 text-center">
            <p className="display text-lg">You&rsquo;re on the list.</p>
            <p className="mt-1.5 text-sm text-muted">
              We&rsquo;ll email you the moment we cover {result.zip}. Requests like
              yours are exactly how we choose the next area.
            </p>
          </div>
        ) : (
          <>
            <p className="display text-lg">
              {result.area
                ? `Not in ${result.area} yet.`
                : "Not covering that ZIP yet."}
            </p>
            <p className="mt-1.5 text-sm text-muted">
              We only launch a ZIP when we can promise a fast pickup. Leave your
              email and we&rsquo;ll tell you the day we reach you.
            </p>
            <form onSubmit={join} className="mt-4 space-y-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-xl border border-line bg-ink px-4 py-3.5 text-fg placeholder:text-muted/60 outline-none focus:border-acid/60"
              />
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="Your car (e.g. 2019 Honda CR-V)"
                className="w-full rounded-xl border border-line bg-ink px-4 py-3.5 text-fg placeholder:text-muted/60 outline-none focus:border-acid/60"
              />
              <button
                type="submit"
                disabled={joining}
                className="w-full rounded-full bg-acid px-6 py-3.5 font-semibold text-black transition hover:bg-acid-dim disabled:opacity-60"
              >
                {joining ? "Adding you…" : "Tell me when you're here"}
              </button>
            </form>
          </>
        )}
        <button
          onClick={() => {
            setState("idle");
            setResult(null);
            setJoined(false);
          }}
          className="mt-3 w-full text-center text-xs text-muted underline underline-offset-4 hover:text-fg"
        >
          Check a different ZIP
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={check} className={compact ? "" : "rise"}>
      <div className="flex gap-2 rounded-full border border-line bg-surface p-1.5 focus-within:border-acid/50">
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={5}
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
          placeholder="Your ZIP code"
          aria-label="ZIP code"
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-fg placeholder:text-muted/70 outline-none"
        />
        <button
          type="submit"
          disabled={state === "checking"}
          className="shrink-0 rounded-full bg-acid px-5 py-3 text-[15px] font-semibold text-black transition hover:bg-acid-dim disabled:opacity-60"
        >
          {state === "checking" ? "…" : "Check"}
        </button>
      </div>
      {error && <p className="mt-2 px-2 text-sm text-red-400">{error}</p>}
      {!compact && !error && (
        <p className="mt-2.5 px-2 text-[13px] text-muted">
          Free pickup and return · No card needed to book
        </p>
      )}
    </form>
  );
}
