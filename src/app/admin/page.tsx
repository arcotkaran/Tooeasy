import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { AssignDriver } from "@/components/AssignDriver";
import { StatusButtons } from "@/components/StatusButtons";
import { db } from "@/lib/db";
import { serviceLabels, PICKUP_WINDOWS } from "@/lib/services";
import { statusLabel } from "@/lib/status";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  ref: string;
  status: string;
  driver_id: string | null;
  contact_name: string;
  contact_phone: string;
  pickup_address: string;
  pickup_zip: string;
  pickup_date: string;
  pickup_window: string;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  services: string[];
  customer_email: string | null;
};

type Driver = { id: string; name: string | null; email: string };
type ZipCount = { zip: string; n: number };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin");
  if (session.user.role !== "admin") {
    return (
      <AppShell wide>
        <h1 className="display text-2xl">Ops</h1>
        <p className="mt-3 text-[15px] text-muted">
          This account doesn&rsquo;t have ops access.
        </p>
      </AppShell>
    );
  }

  let rows: Row[] = [];
  let drivers: Driver[] = [];
  let stats = { total: 0, week: 0, waitlist: 0 };
  let topZips: ZipCount[] = [];

  try {
    [rows, drivers] = await Promise.all([
      db().sql<Row>`
        SELECT b.id, b.ref, b.status, b.driver_id, b.contact_name, b.contact_phone,
               b.pickup_address, b.pickup_zip, b.pickup_date, b.pickup_window,
               b.vehicle_year, b.vehicle_make, b.vehicle_model, b.services,
               u.email AS customer_email
        FROM bookings b
        LEFT JOIN users u ON u.id = b.customer_id
        WHERE b.status NOT IN ('delivered', 'cancelled')
        ORDER BY b.pickup_date ASC, b.created_at ASC
      `,
      db().sql<Driver>`
        SELECT id, name, email FROM users
        WHERE role IN ('driver', 'admin')
        ORDER BY name NULLS LAST, email
      `,
    ]);

    const [s] = await db().sql<{ total: string; week: string }>`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS week
      FROM bookings
    `;
    const [w] = await db().sql<{ n: string }>`SELECT COUNT(*) AS n FROM waitlist`;
    topZips = await db().sql<ZipCount>`
      SELECT zip, COUNT(*)::int AS n FROM waitlist
      GROUP BY zip ORDER BY n DESC LIMIT 6
    `;

    stats = {
      total: Number(s?.total ?? 0),
      week: Number(s?.week ?? 0),
      waitlist: Number(w?.n ?? 0),
    };
  } catch {
    // Database not reachable — render the shell rather than a crash page.
  }

  return (
    <AppShell wide>
      <h1 className="display text-[2.2rem] leading-tight">Ops</h1>

      {/* Demand signal — the whole point of the pilot */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Bookings", stats.total],
          ["Last 7 days", stats.week],
          ["Active now", rows.length],
          ["Waitlist", stats.waitlist],
        ].map(([label, value]) => (
          <div
            key={label as string}
            className="rounded-2xl border border-line bg-surface/40 p-4"
          >
            <p className="display text-3xl text-acid">{value as number}</p>
            <p className="mt-1 text-[13px] text-muted">{label as string}</p>
          </div>
        ))}
      </div>

      {topZips.length > 0 && (
        <div className="mt-4 rounded-2xl border border-line bg-surface/40 p-5">
          <span className="eyebrow text-muted">
            Most-requested ZIPs outside the area
          </span>
          <div className="mt-3 flex flex-wrap gap-2">
            {topZips.map((z) => (
              <span
                key={z.zip}
                className="rounded-full border border-line bg-ink px-3 py-1.5 text-[13px]"
              >
                {z.zip} <span className="text-acid">×{z.n}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <h2 className="display mt-10 text-xl">Active bookings</h2>

      {rows.length === 0 && (
        <p className="mt-4 rounded-2xl border border-line bg-surface/40 p-6 text-[15px] text-muted">
          Nothing active. New requests land here the moment a customer books.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {rows.map((r) => {
          const win = PICKUP_WINDOWS.find((w) => w.id === r.pickup_window);
          return (
            <div
              key={r.id}
              className="rounded-2xl border border-line bg-surface/40 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="display text-[18px] leading-snug">
                    {[r.vehicle_year, r.vehicle_make, r.vehicle_model]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {r.ref} · {r.contact_name} · {r.contact_phone}
                  </p>
                  <p className="text-[13px] text-muted">{r.customer_email}</p>
                </div>
                <span className="eyebrow shrink-0 rounded-full bg-acid/15 px-2.5 py-1 text-acid">
                  {statusLabel(r.status)}
                </span>
              </div>

              <dl className="mt-4 grid gap-2.5 border-t border-line pt-4 text-[14px] sm:grid-cols-2">
                <div className="flex gap-2">
                  <dt className="text-muted">Pickup:</dt>
                  <dd>
                    {r.pickup_address}, {r.pickup_zip}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted">When:</dt>
                  <dd>
                    {r.pickup_date} · {win?.label}
                  </dd>
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <dt className="shrink-0 text-muted">Work:</dt>
                  <dd>{serviceLabels(r.services).join(", ")}</dd>
                </div>
              </dl>

              <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[minmax(0,18rem)_1fr] sm:items-start">
                <div>
                  <p className="eyebrow mb-2 text-muted">Driver</p>
                  <AssignDriver
                    bookingId={r.id}
                    drivers={drivers}
                    current={r.driver_id}
                  />
                </div>
                <div className="sm:pt-6">
                  <StatusButtons
                    bookingId={r.id}
                    actions={[
                      ...(r.status === "requested"
                        ? [{ status: "confirmed", label: "Confirm with shop" }]
                        : []),
                      { status: "cancelled", label: "Cancel", tone: "ghost" as const },
                    ]}
                  />
                </div>
              </div>

              <Link
                href={`/booking/${r.id}`}
                className="mt-4 inline-block text-[13px] text-muted underline underline-offset-4"
              >
                Full record
              </Link>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
