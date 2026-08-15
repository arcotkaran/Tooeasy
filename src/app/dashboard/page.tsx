import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { bookingsForCustomer, eventsFor } from "@/server/bookings";
import { Shell } from "@/components/Shell";
import { setStatusAction } from "@/app/actions";
import { serviceLabels, PICKUP_WINDOWS } from "@/lib/services";
import { customerStatus, isTerminal, STATUSES } from "@/lib/status";

export const dynamic = "force-dynamic";

/** The six milestones a customer actually cares about. */
const TRACK = [
  "requested",
  "driver_assigned",
  "picked_up",
  "at_workshop",
  "in_service",
  "delivered",
];
const TRACK_LABELS = [
  "Requested",
  "Driver assigned",
  "Car collected",
  "At the workshop",
  "Work underway",
  "Back with you",
];

function stepFor(status: string): number {
  const order = STATUSES.map((s) => s.id);
  const i = order.indexOf(status);
  const map: Record<string, number> = {
    requested: 0,
    confirmed: 0,
    driver_assigned: 1,
    en_route_pickup: 1,
    picked_up: 2,
    at_workshop: 3,
    in_service: 4,
    ready: 4,
    en_route_return: 5,
    delivered: 5,
  };
  return map[status] ?? (i >= 0 ? 0 : 0);
}

export default async function DashboardPage() {
  const me = await currentUser();
  if (!me) redirect("/login");

  const bookings = bookingsForCustomer(me.id);
  const active = bookings.filter((b) => !isTerminal(b.status));
  const past = bookings.filter((b) => isTerminal(b.status));

  return (
    <Shell user={me}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-[2.2rem] leading-tight">Your bookings</h1>
        <Link
          href="/book"
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          New pickup
        </Link>
      </div>

      {bookings.length === 0 && (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="display text-xl">Nothing booked yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
            When your car next needs something, book a pickup and we&rsquo;ll
            collect it from home or work.
          </p>
          <Link
            href="/book"
            className="mt-6 inline-block rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white"
          >
            Book a pickup
          </Link>
        </div>
      )}

      <div className="mt-8 space-y-5">
        {active.map((b) => {
          const win = PICKUP_WINDOWS.find((w) => w.id === b.pickup_window);
          const current = stepFor(b.status);
          const events = eventsFor(b.id);

          return (
            <div key={b.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="display text-[19px] leading-snug">{b.vehicle}</p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {b.ref} · {b.pickup_date} · {win?.detail}
                  </p>
                </div>
                <span className="eyebrow shrink-0 rounded-full bg-brand/15 px-2.5 py-1 text-brand">
                  {customerStatus(b.status)}
                </span>
              </div>

              <ol className="mt-5 border-t border-line pt-4">
                {TRACK_LABELS.map((label, i) => {
                  const done = i < current;
                  const now = i === current;
                  const last = i === TRACK_LABELS.length - 1;
                  return (
                    <li key={label} className="flex gap-3.5">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                            done
                              ? "border-brand bg-brand text-white"
                              : now
                                ? "border-brand text-brand"
                                : "border-line text-transparent"
                          }`}
                        >
                          {done ? "✓" : "·"}
                        </span>
                        {!last && (
                          <span
                            className={`w-px flex-1 ${done ? "bg-brand/50" : "bg-line"}`}
                            style={{ minHeight: "1.4rem" }}
                          />
                        )}
                      </div>
                      <p
                        className={`pb-4 text-[14px] leading-tight ${
                          now ? "font-semibold text-brand" : done ? "text-ink" : "text-muted"
                        }`}
                      >
                        {label}
                      </p>
                    </li>
                  );
                })}
              </ol>

              <dl className="space-y-2 border-t border-line pt-4 text-[14px]">
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Work</dt>
                  <dd className="text-right">{serviceLabels(b.services).join(", ")}</dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Pickup</dt>
                  <dd className="text-right">{b.pickup_address}, {b.suburb}</dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Driver</dt>
                  <dd className="text-right">{b.driver_name ?? "Not assigned yet"}</dd>
                </div>
              </dl>

              {events.length > 0 && (
                <details className="mt-4 border-t border-line pt-4">
                  <summary className="cursor-pointer text-[13px] text-muted">
                    History ({events.length})
                  </summary>
                  <ul className="mt-3 space-y-2">
                    {events.map((e, i) => (
                      <li key={i} className="text-[13px] text-muted">
                        {new Date(e.created_at).toLocaleString("en-AU", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        — {e.note ?? e.status}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {["requested", "confirmed", "driver_assigned"].includes(b.status) && (
                <form action={setStatusAction} className="mt-4 border-t border-line pt-4">
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <button className="rounded-full border border-line px-5 py-2.5 text-[14px] text-muted transition hover:text-ink">
                    Cancel this pickup
                  </button>
                </form>
              )}
            </div>
          );
        })}

        {past.length > 0 && (
          <div className="pt-4">
            <p className="eyebrow text-muted">Finished</p>
            <div className="mt-3 space-y-2.5">
              {past.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface/60 px-5 py-4"
                >
                  <div>
                    <p className="text-[15px]">{b.vehicle}</p>
                    <p className="text-[13px] text-muted">{b.ref} · {b.pickup_date}</p>
                  </div>
                  <span className="text-[13px] text-muted">{customerStatus(b.status)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
