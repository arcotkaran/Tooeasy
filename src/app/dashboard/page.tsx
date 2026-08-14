import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { serviceLabels } from "@/lib/services";
import { statusLabel, isTerminal } from "@/lib/status";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  ref: string;
  status: string;
  pickup_date: string;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  services: string[];
};

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/dashboard");

  let rows: Row[] = [];
  try {
    rows = await db().sql<Row>`
      SELECT id, ref, status, pickup_date, vehicle_year, vehicle_make, vehicle_model, services
      FROM bookings
      WHERE customer_id = ${session.user.id}
      ORDER BY created_at DESC
    `;
  } catch {
    rows = [];
  }

  const active = rows.filter((r) => !isTerminal(r.status));
  const past = rows.filter((r) => isTerminal(r.status));

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-[2.2rem] leading-tight">Your bookings</h1>
        <Link
          href="/book"
          className="rounded-full bg-acid px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-acid-dim"
        >
          New pickup
        </Link>
      </div>

      {rows.length === 0 && (
        <div className="mt-10 rounded-2xl border border-line bg-surface/40 p-8 text-center">
          <p className="display text-xl">Nothing booked yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
            When your car next needs something, book a pickup and we&rsquo;ll
            take it from your driveway.
          </p>
          <Link
            href="/book"
            className="mt-6 inline-block rounded-full bg-acid px-6 py-3.5 text-sm font-semibold text-black"
          >
            Book a pickup
          </Link>
        </div>
      )}

      {active.length > 0 && (
        <section className="mt-8">
          <span className="eyebrow text-acid">In progress</span>
          <div className="mt-4 space-y-3">
            {active.map((r) => (
              <BookingCard key={r.id} row={r} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-10">
          <span className="eyebrow text-muted">Finished</span>
          <div className="mt-4 space-y-3">
            {past.map((r) => (
              <BookingCard key={r.id} row={r} muted />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function BookingCard({ row, muted = false }: { row: Row; muted?: boolean }) {
  return (
    <Link
      href={`/booking/${row.id}`}
      className={`block rounded-2xl border border-line p-5 transition hover:border-acid/40 ${
        muted ? "bg-surface/20 opacity-70" : "bg-surface/40"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="display text-[18px] leading-snug">
            {[row.vehicle_year, row.vehicle_make, row.vehicle_model]
              .filter(Boolean)
              .join(" ") || "Vehicle"}
          </p>
          <p className="mt-1 truncate text-[14px] text-muted">
            {serviceLabels(row.services).join(", ")}
          </p>
          <p className="mt-2 text-[13px] text-muted">
            {row.ref} · pickup {row.pickup_date}
          </p>
        </div>
        <span
          className={`eyebrow shrink-0 rounded-full px-2.5 py-1 ${
            muted ? "bg-surface text-muted" : "bg-acid/15 text-acid"
          }`}
        >
          {statusLabel(row.status)}
        </span>
      </div>
    </Link>
  );
}
