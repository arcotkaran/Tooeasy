import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { StatusButtons, type Action } from "@/components/StatusButtons";
import { QuoteBuilder } from "@/components/QuoteBuilder";
import { db } from "@/lib/db";
import { serviceLabels } from "@/lib/services";
import { statusLabel } from "@/lib/status";

export const dynamic = "force-dynamic";

type Job = {
  id: string;
  ref: string;
  status: string;
  concern: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  vehicle_mileage: string | null;
  services: string[];
  pickup_date: string;
  pending_quotes: number;
};

function shopActions(status: string): Action[] {
  switch (status) {
    case "at_garage":
      return [{ status: "in_service", label: "Start work (no estimate needed)" }];
    case "quote_approved":
      return [{ status: "in_service", label: "Start approved work" }];
    case "in_service":
      return [{ status: "ready", label: "Work complete — ready for return" }];
    default:
      return [];
  }
}

export default async function GaragePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/garage");
  const role = session.user.role;
  if (role !== "mechanic" && role !== "admin") {
    return (
      <AppShell>
        <h1 className="display text-2xl">Shop console</h1>
        <p className="mt-3 text-[15px] text-muted">
          This account isn&rsquo;t set up as a shop user.
        </p>
      </AppShell>
    );
  }

  let jobs: Job[] = [];
  try {
    jobs = await db().sql<Job>`
      SELECT b.id, b.ref, b.status, b.concern,
             b.vehicle_year, b.vehicle_make, b.vehicle_model,
             b.vehicle_plate, b.vehicle_mileage, b.services, b.pickup_date,
             (SELECT COUNT(*) FROM quotes q
               WHERE q.booking_id = b.id AND q.status = 'pending') AS pending_quotes
      FROM bookings b
      WHERE b.status IN ('at_garage', 'quote_pending', 'quote_approved', 'in_service', 'ready')
      ORDER BY b.pickup_date ASC, b.created_at ASC
    `;
  } catch {
    jobs = [];
  }

  return (
    <AppShell>
      <h1 className="display text-[2.2rem] leading-tight">Shop queue</h1>
      <p className="mt-2 text-[15px] text-muted">
        {jobs.length === 0
          ? "No cars in the bay right now."
          : `${jobs.length} ${jobs.length === 1 ? "car" : "cars"} in the queue.`}
      </p>

      <div className="mt-8 space-y-4">
        {jobs.map((j) => {
          const actions = shopActions(j.status);
          const awaitingCustomer = Number(j.pending_quotes) > 0;

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
                    {j.vehicle_mileage ? ` · ${j.vehicle_mileage} mi` : ""}
                  </p>
                </div>
                <span className="eyebrow shrink-0 rounded-full bg-acid/15 px-2.5 py-1 text-acid">
                  {statusLabel(j.status)}
                </span>
              </div>

              <div className="mt-4 border-t border-line pt-4">
                <p className="eyebrow text-muted">Requested</p>
                <p className="mt-1.5 text-[14px]">
                  {serviceLabels(j.services).join(", ")}
                </p>
                {j.concern && (
                  <p className="mt-3 rounded-xl bg-ink p-3.5 text-[13px] leading-relaxed text-muted">
                    &ldquo;{j.concern}&rdquo; — customer
                  </p>
                )}
              </div>

              <Link
                href={`/booking/${j.id}`}
                className="mt-4 inline-block text-[13px] text-muted underline underline-offset-4"
              >
                Full record
              </Link>

              {awaitingCustomer ? (
                <p className="mt-4 rounded-xl border border-acid/25 bg-acid/[0.05] p-3.5 text-[13px] text-acid">
                  Estimate sent — waiting on the customer to approve.
                </p>
              ) : (
                <>
                  {actions.length > 0 && (
                    <StatusButtons
                      bookingId={j.id}
                      actions={actions}
                      className="mt-4 border-t border-line pt-4"
                    />
                  )}
                  {(j.status === "at_garage" || j.status === "in_service") && (
                    <QuoteBuilder bookingId={j.id} />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
