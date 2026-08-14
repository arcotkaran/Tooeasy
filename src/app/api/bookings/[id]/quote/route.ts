import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getBooking, logEvent } from "@/lib/bookings";

export const dynamic = "force-dynamic";

type Item = { label: string; cents: number };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "mechanic" && role !== "admin") {
    return NextResponse.json({ error: "Shop only." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    items?: Item[];
    etaNote?: string;
  };

  const items = (body.items ?? [])
    .map((i) => ({
      label: String(i.label ?? "").trim(),
      cents: Math.max(0, Math.round(Number(i.cents) || 0)),
    }))
    .filter((i) => i.label);

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Add at least one line item." },
      { status: 400 },
    );
  }

  const booking = await getBooking(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const total = items.reduce((sum, i) => sum + i.cents, 0);

  await db().sql`
    INSERT INTO quotes (booking_id, items, total_cents, eta_note, status, created_by)
    VALUES (
      ${id},
      ${JSON.stringify(items)}::jsonb,
      ${total},
      ${body.etaNote?.trim() || null},
      'pending',
      ${session!.user.id}
    )
  `;

  await db().sql`
    UPDATE bookings SET status = 'quote_pending', updated_at = NOW() WHERE id = ${id}
  `;

  await logEvent(
    id,
    "quote_pending",
    `Estimate sent — $${(total / 100).toFixed(2)}`,
    session!.user.id,
    role,
  );

  return NextResponse.json({ ok: true, total });
}
