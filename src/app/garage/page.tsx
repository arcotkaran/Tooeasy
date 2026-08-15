import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { bookingsForWorkshop } from "@/server/bookings";
import { Shell } from "@/components/Shell";
import { setStatusAction } from "@/app/actions";
import { serviceLabels } from "@/lib/services";
import { statusLabel, nextActions } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function GaragePage() {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.role !== "mechanic" && me.role !== "admin") redirect("/");

  const jobs = bookingsForWorkshop();

  return (
    <Shell user={me}>
      <h1 className="display text-[2.2rem] leading-tight">Workshop queue</h1>
      <p className="mt-2 text-[15px] text-muted">
        {jobs.length === 0
          ? "No cars in the bay right now."
          : `${jobs.length} ${jobs.length === 1 ? "car" : "cars"} in the queue.`}
      </p>

      <div className="mt-8 space-y-4">
        {jobs.map((j) => (
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

            <div className="mt-4 border-t border-line pt-4">
              <p className="eyebrow text-muted">Booked in for</p>
              <p className="mt-1.5 text-[14px]">{serviceLabels(j.services).join(", ")}</p>
              {j.concern && (
                <p className="mt-3 rounded-xl bg-surface-2 p-3.5 text-[13px] leading-relaxed">
                  &ldquo;{j.concern}&rdquo; — customer
                </p>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-brand/25 bg-brand/[0.06] p-3.5">
              <p className="text-[13px] leading-relaxed">
                Ring <strong>{j.contact_name}</strong> on{" "}
                <a href={`tel:${j.contact_phone.replace(/\s/g, "")}`} className="text-brand underline underline-offset-4">
                  {j.contact_phone}
                </a>{" "}
                before you start, and again if you find anything else.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5 border-t border-line pt-4">
              {nextActions("mechanic", j.status).map((a) => (
                <form key={a.status} action={setStatusAction}>
                  <input type="hidden" name="id" value={j.id} />
                  <input type="hidden" name="status" value={a.status} />
                  <button className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark">
                    {a.label}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
