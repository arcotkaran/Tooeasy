"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AssignDriver({
  bookingId,
  drivers,
  current,
}: {
  bookingId: string;
  drivers: { id: string; name: string | null; email: string }[];
  current: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function assign(driverId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: driverId || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't assign.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network problem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <select
        value={current ?? ""}
        disabled={busy || drivers.length === 0}
        onChange={(e) => assign(e.target.value)}
        className="w-full rounded-xl border border-line bg-ink px-3.5 py-3 text-fg outline-none focus:border-acid/60 disabled:opacity-60"
      >
        <option value="">
          {drivers.length === 0 ? "No drivers set up yet" : "Unassigned"}
        </option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name ?? d.email}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-[13px] text-red-400">{error}</p>}
    </div>
  );
}
