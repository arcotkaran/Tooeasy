"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Coverage = {
  covered: boolean;
  postcode: string;
  suburb: string | null;
  distanceKm: number | null;
  reason?: string;
};

export function PostcodeCheck({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [postcode, setPostcode] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "done">("idle");
  const [result, setResult] = useState<Coverage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Waitlist sub-form, shown only when we can't reach the postcode yet.
  const [email, setEmail] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4}$/.test(postcode.trim())) {
      setError("Enter a 4-digit postcode.");
      return;
    }
    setState("checking");
    try {
      const res = await fetch("/api/coverage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode: postcode.trim() }),
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
        body: JSON.stringify({ email, postcode: postcode.trim(), vehicle }),
      });
      setJoined(true);
    } finally {
      setJoining(false);
    }
  }

  if (state === "done" && result?.covered) {
    return (
      <div className="rounded-xl2 border border-brand/35 bg-brand/[0.07] p-5 rise">
        <div className="flex items-start gap-3">
          <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
            ✓
          </span>
          <div>
            <p className="display text-lg text-ink">
              We pick up in {result.suburb}.
            </p>
            <p className="mt-1 text-sm text-muted">
              You&rsquo;re inside our pickup area. Most bookings get a slot
              within 48 hours.
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/book?postcode=${result.postcode}`)}
          className="mt-4 w-full rounded-full bg-brand px-6 py-4 text-center text-[15px] font-semibold text-white transition hover:bg-brand-dark active:scale-[0.99]"
        >
          Book my pickup →
        </button>
        <button
          onClick={() => {
            setState("idle");
            setResult(null);
          }}
          className="mt-2 w-full text-center text-xs text-muted underline underline-offset-4 hover:text-ink"
        >
          Check a different postcode
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
              We&rsquo;ll email you the moment we reach {result.postcode}.
              Requests like yours are exactly how we choose the next suburb.
            </p>
          </div>
        ) : (
          <>
            <p className="display text-lg">
              {result.suburb
                ? `Not in ${result.suburb} yet.`
                : "Not covering that postcode yet."}
            </p>
            <p className="mt-1.5 text-sm text-muted">
              We only open a suburb when we can promise a quick pickup. Leave
              your email and we&rsquo;ll tell you the day we get to you.
            </p>
            <form onSubmit={join} className="mt-4 space-y-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-xl border border-line bg-page px-4 py-3.5 text-ink placeholder:text-muted/60 outline-none focus:border-brand/60"
              />
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="Your car (e.g. 2019 Mazda CX-5)"
                className="w-full rounded-xl border border-line bg-page px-4 py-3.5 text-ink placeholder:text-muted/60 outline-none focus:border-brand/60"
              />
              <button
                type="submit"
                disabled={joining}
                className="w-full rounded-full bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
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
          className="mt-3 w-full text-center text-xs text-muted underline underline-offset-4 hover:text-ink"
        >
          Check a different postcode
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={check} className={compact ? "" : "rise"}>
      <div className="flex gap-2 rounded-full border border-line bg-surface p-1.5 focus-within:border-brand/50">
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={postcode}
          onChange={(e) => setPostcode(e.target.value.replace(/\D/g, ""))}
          placeholder="Your postcode"
          aria-label="Postcode"
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-ink placeholder:text-muted/70 outline-none"
        />
        <button
          type="submit"
          disabled={state === "checking"}
          className="shrink-0 rounded-full bg-brand px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {state === "checking" ? "…" : "Check"}
        </button>
      </div>
      {error && <p className="mt-2 px-2 text-sm text-red-700">{error}</p>}
      {!compact && !error && (
        <p className="mt-2.5 px-2 text-[13px] text-muted">
          Two-minute booking · Cancel any time
        </p>
      )}
    </form>
  );
}
