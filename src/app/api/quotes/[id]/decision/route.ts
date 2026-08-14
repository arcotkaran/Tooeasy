import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logEvent, money } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { decision } = (await req.json().catch(() => ({}))) as {
    decision?: string;
  };
  if (decision !== "approved" && decision !== "declined") {
    return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  }

  const [quote] = await db().sql<{
    id: string;
    booking_id: string;
    customer_id: string;
    total_cents: number;
    status: string;
  }>`
    SELECT q.id, q.booking_id, q.total_cents, q.status, b.customer_id
    FROM quotes q
    JOIN bookings b ON b.id = q.booking_id
    WHERE q.id = ${id}
  `;

  if (!quote) {
    return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  }
  // Only the car's owner approves spending on it. Not ops, not the shop.
  if (quote.customer_id !== session.user.id) {
    return NextResponse.json(
      { error: "Only the vehicle owner can decide on an estimate." },
      { status: 403 },
    );
  }
  if (quote.status !== "pending") {
    return NextResponse.json(
      { error: "That estimate has already been answered." },
      { status: 409 },
    );
  }

  await db().sql`
    UPDATE quotes SET status = ${decision}, decided_at = NOW() WHERE id = ${id}
  `;

  const nextStatus = decision === "approved" ? "quote_approved" : "ready";
  await db().sql`
    UPDATE bookings SET status = ${nextStatus}, updated_at = NOW()
    WHERE id = ${quote.booking_id}
  `;

  await logEvent(
    quote.booking_id,
    nextStatus,
    decision === "approved"
      ? `Customer approved ${money(quote.total_cents)}`
      : "Customer declined the estimate — car to be returned",
    session.user.id,
    "customer",
  );

  return NextResponse.json({ ok: true });
}
