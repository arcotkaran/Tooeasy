import { redirect } from "next/navigation";
import { currentUser, listUsers, listByRole } from "@/server/auth";
import { allBookings, allWaitlist } from "@/server/bookings";
import { Shell } from "@/components/Shell";
import { StaffForm } from "@/components/StaffForm";
import { assignDriverAction, setStatusAction, toggleUserAction } from "@/app/actions";
import { serviceLabels, PICKUP_WINDOWS } from "@/lib/services";
import { statusLabel, nextActions, isTerminal } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");

  const users = listUsers();
  const drivers = listByRole("driver");
  const bookings = allBookings();
  const waitlist = allWaitlist();
  const active = bookings.filter((b) => !isTerminal(b.status));

  return (
    <Shell user={me} wide>
      <h1 className="display text-[2.2rem] leading-tight">Ops</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Requests", bookings.length],
          ["Active now", active.length],
          ["People", users.length],
          ["Waitlist", waitlist.length],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-2xl border border-line bg-surface p-4">
            <p className="display text-3xl text-brand">{v as number}</p>
            <p className="mt-1 text-[13px] text-muted">{l as string}</p>
          </div>
        ))}
      </div>

      {/* ── Bookings ─────────────────────────────────────────── */}
      <h2 className="display mt-10 text-xl">Pickup requests</h2>
      {active.length === 0 && (
        <p className="mt-4 rounded-2xl border border-line bg-surface p-6 text-[15px] text-muted">
          Nothing active. New requests land here as soon as a customer books.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {active.map((b) => {
          const win = PICKUP_WINDOWS.find((w) => w.id === b.pickup_window);
          return (
            <div key={b.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="display text-[18px] leading-snug">{b.vehicle}</p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {b.ref} · {b.contact_name} · {b.contact_phone}
                  </p>
                </div>
                <span className="eyebrow shrink-0 rounded-full bg-brand/15 px-2.5 py-1 text-brand">
                  {statusLabel(b.status)}
                </span>
              </div>

              <dl className="mt-4 grid gap-2 border-t border-line pt-4 text-[14px] sm:grid-cols-2">
                <div className="flex gap-2">
                  <dt className="text-muted">Pickup:</dt>
                  <dd>{b.pickup_address}, {b.suburb} {b.postcode}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted">When:</dt>
                  <dd>{b.pickup_date} · {win?.detail}</dd>
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <dt className="shrink-0 text-muted">Work:</dt>
                  <dd>{serviceLabels(b.services).join(", ")}</dd>
                </div>
              </dl>

              {b.concern && (
                <p className="mt-3 rounded-xl bg-surface-2 p-3.5 text-[13px] leading-relaxed">
                  &ldquo;{b.concern}&rdquo;
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-line pt-4">
                <form action={assignDriverAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={b.id} />
                  <select
                    name="driverId"
                    // Remount when the assignment changes, otherwise React keeps
                    // the old DOM node and defaultValue never re-applies.
                    key={b.driver_id ?? "unassigned"}
                    defaultValue={b.driver_id ?? ""}
                    className="rounded-xl border border-line bg-page px-3 py-2.5 text-[14px]"
                  >
                    <option value="">Unassigned</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <button className="rounded-full border border-line px-4 py-2.5 text-[14px] text-muted transition hover:text-ink">
                    Assign
                  </button>
                </form>

                {nextActions("admin", b.status).map((a) => (
                  <form key={a.status} action={setStatusAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="status" value={a.status} />
                    <button className="rounded-full bg-brand px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-brand-dark">
                      {a.label}
                    </button>
                  </form>
                ))}

                <form action={setStatusAction}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <button className="rounded-full border border-line px-4 py-2.5 text-[14px] text-muted transition hover:text-ink">
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── People ───────────────────────────────────────────── */}
      <h2 className="display mt-12 text-xl">People</h2>
      <div className="mt-4">
        <StaffForm />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-surface-2 text-[12px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line bg-surface">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  {u.active ? (
                    <span className="text-brand">Active</span>
                  ) : (
                    <span className="text-muted">Disabled</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== me.id && (
                    <form action={toggleUserAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                      <button className="text-[13px] text-muted underline underline-offset-4 hover:text-ink">
                        {u.active ? "Disable" : "Enable"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {waitlist.length > 0 && (
        <>
          <h2 className="display mt-12 text-xl">Waitlist</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {waitlist.map((w, i) => (
              <span key={i} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px]">
                {w.suburb ?? w.postcode} · {w.email}
              </span>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
