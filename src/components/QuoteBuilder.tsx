"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Line = { label: string; price: string };

const field =
  "w-full rounded-xl border border-line bg-ink px-3.5 py-3 text-fg placeholder:text-muted/60 outline-none focus:border-acid/60";

export function QuoteBuilder({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([{ label: "", price: "" }]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = lines.reduce((sum, l) => sum + (parseFloat(l.price) || 0), 0);

  function update(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }

  async function send() {
    const items = lines
      .filter((l) => l.label.trim())
      .map((l) => ({
        label: l.label.trim(),
        cents: Math.round((parseFloat(l.price) || 0) * 100),
      }));

    if (items.length === 0) {
      setError("Add at least one line item.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, etaNote: note }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't send that.");
        setBusy(false);
        return;
      }
      setOpen(false);
      setLines([{ label: "", price: "" }]);
      setNote("");
      router.refresh();
    } catch {
      setError("Network problem.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-full bg-acid px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-acid-dim"
      >
        Build estimate
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-acid/30 bg-acid/[0.04] p-4">
      <p className="eyebrow text-acid">New estimate</p>

      <div className="mt-4 space-y-2.5">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={l.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Front brake pads (set)"
              className={`${field} flex-1`}
            />
            <input
              inputMode="decimal"
              value={l.price}
              onChange={(e) =>
                update(i, { price: e.target.value.replace(/[^\d.]/g, "") })
              }
              placeholder="0.00"
              className={`${field} w-24 text-right`}
            />
            {lines.length > 1 && (
              <button
                onClick={() =>
                  setLines((prev) => prev.filter((_, j) => j !== i))
                }
                aria-label="Remove line"
                className="shrink-0 rounded-xl border border-line px-3 text-muted"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => setLines((prev) => [...prev, { label: "", price: "" }])}
        className="mt-2.5 text-[13px] text-acid underline underline-offset-4"
      >
        + Add line
      </button>

      <textarea
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note for the customer — what you found, how urgent, when it'll be ready."
        className={`${field} mt-4 resize-none`}
      />

      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3.5">
        <span className="display text-[15px]">Total</span>
        <span className="display text-2xl text-acid">${total.toFixed(2)}</span>
      </div>

      {error && <p className="mt-2.5 text-[13px] text-red-400">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setOpen(false)}
          className="rounded-full border border-line py-3 text-sm text-muted"
        >
          Cancel
        </button>
        <button
          onClick={send}
          disabled={busy}
          className="rounded-full bg-acid py-3 text-sm font-semibold text-black disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send to customer"}
        </button>
      </div>
    </div>
  );
}
