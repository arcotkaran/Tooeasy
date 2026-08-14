import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { Tracker } from "@/components/Tracker";
import { QuoteActions } from "@/components/QuoteActions";
import { StatusButtons } from "@/components/StatusButtons";
import { getBooking, getEvents, getQuotes, canView, money } from "@/lib/bookings";
import { serviceLabels, PICKUP_WINDOWS, KEY_HANDOFF } from "@/lib/services";
import { statusLabel, isTerminal, type Role } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: isNew } = await searchParams;

  const session = await auth();
  if (!session?.user) redirect(`/login?next=/booking/${id}`);

  const booking = await getBooking(id).catch(() => null);
  if (!booking) notFound();

  const role = session.user.role as Role;
  if (!canView(booking, session.user.id, role)) notFound();

  const [events, quotes] = await Promise.all([getEvents(id), getQuotes(id)]);
  const pendingQuote = quotes.find((q) => q.status === "pending");
  const isOwner = booking.customer_id === session.user.id;

  const windowLabel =
    PICKUP_WINDOWS.find((w) => w.id === booking.pickup_window)?.detail ?? "";
  const keyLabel =
    KEY_HANDOFF.find((k) => k.id === booking.key_handoff)?.label ?? "";

  return (
    <AppShell>
      {isNew && (
        <div className="mb-6 rounded-2xl border border-acid/35 bg-acid/[0.07] p-5 rise">
          <p className="display text-xl">You&rsquo;re booked.</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
            We&rsquo;re confirming the slot with the shop now. You&rsquo;ll get a
            text at {booking.contact_phone} with your driver&rsquo;s name before
            pickup.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="eyebrow text-muted">Booking {booking.ref}</span>
          <h1 className="display mt-1.5 text-[2rem] leading-tight">
            {[booking.vehicle_year, booking.vehicle_make, booking.vehicle_model]
              .filter(Boolean)
              .join(" ")}
          </h1>
        </div>
        <span className="eyebrow rounded-full border border-line bg-surface px-3 py-1.5 text-acid">
          {statusLabel(booking.status)}
        </span>
      </div>

      <div className="mt-7">
        <Tracker status={booking.status} />
      </div>

      {/* ── Estimate awaiting the owner ─────────────────────── */}
      {pendingQuote && (
        <div className="mt-6 rounded-2xl border border-acid/40 bg-acid/[0.05] p-5">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-acid">Estimate from the shop</span>
            <span className="eyebrow rounded-full bg-acid/15 px-2.5 py-1 text-acid">
              Needs you
            </span>
          </div>

          <div className="mt-4 space-y-3 border-t border-line pt-4">
            {pendingQuote.items.map((item, i) => (
              <div
                key={`${item.label}-${i}`}
                className="flex items-baseline justify-between gap-4 text-[14px]"
              >
                <span className="text-muted">{item.label}</span>
                <span className="shrink-0 font-medium">
                  {money(item.cents)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="display text-[15px]">Total</span>
            <span className="display text-2xl text-acid">
              {money(pendingQuote.total_cents)}
            </span>
          </div>

          {pendingQuote.eta_note && (
            <p className="mt-3 rounded-xl bg-surface p-3.5 text-[13px] leading-relaxed text-muted">
              &ldquo;{pendingQuote.eta_note}&rdquo; — shop note
            </p>
          )}

          {isOwner ? (
            <QuoteActions
              quoteId={pendingQuote.id}
              total={money(pendingQuote.total_cents)}
            />
          ) : (
            <p className="mt-4 text-[13px] text-muted">
              Waiting on the customer to approve.
            </p>
          )}
        </div>
      )}

      {/* ── Decided estimates ───────────────────────────────── */}
      {quotes
        .filter((q) => q.status !== "pending")
        .map((q) => (
          <div
            key={q.id}
            className="mt-4 rounded-2xl border border-line bg-surface/40 p-5"
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow text-muted">Estimate</span>
              <span
                className={`eyebrow rounded-full px-2.5 py-1 ${
                  q.status === "approved"
                    ? "bg-acid/15 text-acid"
                    : "bg-red-500/10 text-red-300"
                }`}
              >
                {q.status === "approved" ? "Approved" : "Declined"}
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-[14px] text-muted">
                {q.items.length} line{q.items.length === 1 ? "" : "s"}
              </span>
              <span className="display text-lg">{money(q.total_cents)}</span>
            </div>
          </div>
        ))}

      {/* ── Details ─────────────────────────────────────────── */}
      <div className="mt-6 rounded-2xl border border-line bg-surface/40 p-5">
        <span className="eyebrow text-muted">Details</span>
        <dl className="mt-4 space-y-3.5 text-[14px]">
          {[
            ["Work requested", serviceLabels(booking.services).join(", ")],
            ["Pickup", `${booking.pickup_address}, ${booking.pickup_zip}`],
            ["When", `${booking.pickup_date} · ${windowLabel}`],
            ["Keys", keyLabel],
            ["Contact", `${booking.contact_name} · ${booking.contact_phone}`],
            ["Driver", booking.driver_name ?? "Not assigned yet"],
            ["Plate", booking.vehicle_plate ?? "—"],
            ["Mileage", booking.vehicle_mileage ?? "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6">
              <dt className="shrink-0 text-muted">{k}</dt>
              <dd className="text-right">{v}</dd>
            </div>
          ))}
        </dl>

        {booking.concern && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="eyebrow text-muted">What you told us</p>
            <p className="mt-2 text-[14px] leading-relaxed">{booking.concern}</p>
          </div>
        )}
      </div>

      {/* ── Timeline ────────────────────────────────────────── */}
      <div className="mt-6 rounded-2xl border border-line bg-surface/40 p-5">
        <span className="eyebrow text-muted">History</span>
        <ol className="mt-4 space-y-3.5">
          {events.map((e) => (
            <li key={e.id} className="flex gap-3 text-[14px]">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-acid/70" />
              <div>
                <p>{e.note ?? statusLabel(e.status)}</p>
                <p className="text-[12px] text-muted">
                  {new Date(e.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {e.actor_role ? ` · ${e.actor_role}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Cancel ──────────────────────────────────────────── */}
      {isOwner &&
        !isTerminal(booking.status) &&
        ["requested", "confirmed", "driver_assigned"].includes(
          booking.status,
        ) && (
          <div className="mt-6">
            <StatusButtons
              bookingId={booking.id}
              actions={[
                { status: "cancelled", label: "Cancel this pickup", tone: "ghost" },
              ]}
            />
            <p className="mt-2 text-[13px] text-muted">
              Free to cancel — nothing has been charged.
            </p>
          </div>
        )}

      <Link
        href="/dashboard"
        className="mt-8 inline-block text-[14px] text-muted underline underline-offset-4 hover:text-fg"
      >
        ← All bookings
      </Link>
    </AppShell>
  );
}
