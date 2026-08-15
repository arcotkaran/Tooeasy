import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { bookingsForDriver } from "@/server/bookings";
import { Shell } from "@/components/Shell";
import { setStatusAction } from "@/app/actions";
import { serviceLabels, PICKUP_WINDOWS } from "@/lib/services";
import { statusLabel, nextActions } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function DriverPage() {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.role !== "driver" && me.role !== "admin") redirect("/");

  const jobs = await bookingsForDriver(me.id);

  return (
    <Shell user={me}>
      <h1 className="display text-[2.2rem] leading-tight">Your jobs</h1>
      <p className="mt-2 text-[15px] text-muted">
        {jobs.length === 0
          ? "Nothing assigned to you right now."
          : `${jobs.length} active ${jobs.length === 1 ? "job" : "jobs"}.`}
      </p>

      <div className="mt-8 space-y-4">
        {jobs.map((j) => {
          const win = PICKUP_WINDOWS.find((w) => w.id === j.pickup_window);
          const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${j.pickup_address} ${j.suburb} NSW ${j.postcode}`,
          )}`;
          const actions = nextActions("driver", j.status);

          return (
            <div key={j.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="display text-[19px] leading-snug">{j.vehicle}</p>
                  <p className="mt-0.5 text-[13px] text-muted">{j.ref}</p>
                </div>
                <span className="eyebrow shrink-0 rounded-full bg-brand/15 px-2.5 py-1 text-brand">
                  {statusLabel(j.status)}
                </span>
              </div>

              <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-[14px]">
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Pickup</dt>
                  <dd className="text-right">{j.pickup_address}, {j.suburb} {j.postcode}</dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Window</dt>
                  <dd className="text-right">{j.pickup_date} · {win?.detail}</dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Work</dt>
                  <dd className="text-right">{serviceLabels(j.services).join(", ")}</dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Keys</dt>
                  <dd className="text-right">{j.key_handoff.replace("_", " ")}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <a
                  href={`tel:${j.contact_phone.replace(/\s/g, "")}`}
                  className="rounded-full border border-line px-4 py-2.5 text-sm"
                >
                  Call {j.contact_name.split(" ")[0]}
                </a>
                <a
                  href={maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-line px-4 py-2.5 text-sm"
                >
                  Navigate
                </a>
              </div>

              {actions.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2.5 border-t border-line pt-4">
                  {actions.map((a) => (
                    <form key={a.status} action={setStatusAction}>
                      <input type="hidden" name="id" value={j.id} />
                      <input type="hidden" name="status" value={a.status} />
                      <button className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark">
                        {a.label}
                      </button>
                    </form>
                  ))}
                </div>
              ) : (
                <p className="mt-4 border-t border-line pt-4 text-[13px] text-muted">
                  Waiting on the workshop — nothing for you to do yet.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
