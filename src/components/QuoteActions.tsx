"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuoteActions({
  quoteId,
  total,
}: {
  quoteId: string;
  total: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function decide(decision: "approved" | "declined") {
    setBusy(decision);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save that.");
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Network problem. Try again.");
      setBusy(null);
    }
  }

  if (confirming) {
    return (
      <div className="mt-4">
        <p className="text-[14px] text-muted">
          Decline and we&rsquo;ll return your car without doing the work. Sure?
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setConfirming(false)}
            className="rounded-full border border-line py-3 text-sm text-muted"
          >
            Keep thinking
          </button>
          <button
            onClick={() => decide("declined")}
            disabled={busy !== null}
            className="rounded-full border border-red-500/40 bg-red-500/10 py-3 text-sm font-semibold text-red-300 disabled:opacity-60"
          >
            {busy === "declined" ? "…" : "Yes, decline"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setConfirming(true)}
          disabled={busy !== null}
          className="rounded-full border border-line py-3.5 text-sm text-muted transition hover:text-fg disabled:opacity-60"
        >
          Decline
        </button>
        <button
          onClick={() => decide("approved")}
          disabled={busy !== null}
          className="rounded-full bg-acid py-3.5 text-sm font-semibold text-black transition hover:bg-acid-dim disabled:opacity-60"
        >
          {busy === "approved" ? "…" : `Approve ${total}`}
        </button>
      </div>
      {error && <p className="mt-2.5 text-[13px] text-red-400">{error}</p>}
    </div>
  );
}
