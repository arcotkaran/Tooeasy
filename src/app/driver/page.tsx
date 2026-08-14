import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { StatusButtons, type Action } from "@/components/StatusButtons";
import { db } from "@/lib/db";
import { serviceLabels, PICKUP_WINDOWS } from "@/lib/services";
import { statusLabel } from "@/lib/status";

export const dynamic = "force-dynamic";

type Job = {
  id: string;
  ref: string;
  status: string;
  contact_name: string;
  contact_phone: string;
  pickup_address: string;
  pickup_zip: string;
  pickup_date: string;
  pickup_window: string;
  key_handoff: string;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  services: string[];
};

/** What this driver can do next, given where the job is. */
function nextActions(status: string): Action[] {
  switch (status) {
    case "driver_assigned":
      return [{ status: "en_route_pickup", label: "Start drive to customer" }];
    case "en_route_pickup":
      return [{ status: "picked_up", label: "Car collected" }];
    case "picked_up":
      return [{ status: "at_garage", label: "Dropped at shop" }];
    case "ready":
      return [{ status: "en_route_return", label: "Driving car back" }];
    case "en_route_return":
      return [{ status: "delivered", label: "Delivered to customer" }];
    default:
      return [];
  }
}

export default async function DriverPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/driver");
  const role = session.user.role;
  if (role !== "driver" && role !== "admin") {
    return (
      <AppShell>
        <h1 className="display text-2xl">Driver console</h1>
        <p className="mt-3 text-[15px] text-muted">
          This account isn&rsquo;t set up as a driver.
        </p>
      </AppShell>
    );
  }

  let jobs: Job[] = [];
  try {
    jobs = await db().sql<Job>`
      SELECT id, ref, status, contact_name, contact_phone,
             pickup_address, pickup_zip, pickup_date, pickup_window, key_handoff,
             vehicle_year, vehicle_make, vehicle_model, vehicle_plate, services
      FROM bookings
      WHERE driver_id = ${session.user.id}
        AND status NOT IN ('delivered', 'cancelled')
      ORDER BY pickup_date ASC, created_at ASC
    `;
  } catch {
    jobs = [];
  }

  return (
    <AppShell>
      <h1 className="display text-[2.2rem] leading-tight">Your jobs</h1>
      <p className="mt-2 text-[15px] text-muted">
        {jobs.length === 0
          ? "Nothing assigned right now."
          : `${jobs.length} active ${jobs.length === 1 ? "job" : "jobs"}.`}
      </p>

      <div className="mt-8 space-y-4">
        {jobs.map((j) => {
          const win = PICKUP_WINDOWS.find((w) => w.id === j.pickup_window);
          const actions = nextActions(j.status);
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${j.pickup_address} ${j.pickup_zip}`,
          )}`;

          return (
            <div
              key={j.id}
              className="rounded-2xl border border-line bg-surface/40 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="display text-[19px] leading-snug">
                    {[j.vehicle_year, j.vehicle_make, j.vehicle_model]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {j.ref}
                    {j.vehicle_plate ? ` · ${j.vehicle_plate}` : ""}
                  </p>
                </div>
                <span className="eyebrow shrink-0 rounded-full bg-acid/15 px-2.5 py-1 text-acid">
                  {statusLabel(j.status)}
                </span>
              </div>

              <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-[14px]">
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Pickup</dt>
                  <dd className="text-right">
                    {j.pickup_address}, {j.pickup_zip}
                  </dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Window</dt>
                  <dd className="text-right">
                    {j.pickup_date} · {win?.detail}
                  </dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Work</dt>
                  <dd className="text-right">
                    {serviceLabels(j.services).join(", ")}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <a
                  href={`tel:${j.contact_phone.replace(/\s/g, "")}`}
                  className="rounded-full border border-line px-4 py-2.5 text-sm text-fg"
                >
                  Call {j.contact_name.split(" ")[0]}
                </a>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-line px-4 py-2.5 text-sm text-fg"
                >
                  Navigate
                </a>
                <Link
                  href={`/booking/${j.id}`}
                  className="rounded-full border border-line px-4 py-2.5 text-sm text-muted"
                >
                  Details
                </Link>
              </div>

              {actions.length > 0 ? (
                <StatusButtons
                  bookingId={j.id}
                  actions={actions}
                  className="mt-4 border-t border-line pt-4"
                />
              ) : (
                <p className="mt-4 border-t border-line pt-4 text-[13px] text-muted">
                  Waiting on the shop — nothing for you to do yet.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
