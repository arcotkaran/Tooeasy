"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Action = {
  status: string;
  label: string;
  tone?: "primary" | "ghost" | "danger";
};

export function StatusButtons({
  bookingId,
  actions,
  className = "",
}: {
  bookingId: string;
  actions: Action[];
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(status: string) {
    setBusy(status);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't update.");
        setBusy(null);
        return;
      }
      router.refresh();
      setBusy(null);
    } catch {
      setError("Network problem.");
      setBusy(null);
    }
  }

  if (actions.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2.5">
        {actions.map((a) => {
          const tone = a.tone ?? "primary";
          const base =
            "rounded-full px-5 py-3 text-sm font-semibold transition disabled:opacity-60";
          const styles =
            tone === "primary"
              ? "bg-acid text-black hover:bg-acid-dim"
              : tone === "danger"
                ? "border border-red-500/40 bg-red-500/10 text-red-300"
                : "border border-line text-muted hover:text-fg";
          return (
            <button
              key={a.status}
              onClick={() => go(a.status)}
              disabled={busy !== null}
              className={`${base} ${styles}`}
            >
              {busy === a.status ? "…" : a.label}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2.5 text-[13px] text-red-400">{error}</p>}
    </div>
  );
}
