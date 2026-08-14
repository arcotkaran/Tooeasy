import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getBooking, canView, logEvent } from "@/lib/bookings";
import { canSetStatus, statusLabel, type Role } from "@/lib/status";

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
  const role = session.user.role as Role;

  const { status, note } = (await req.json().catch(() => ({}))) as {
    status?: string;
    note?: string;
  };
  if (!status) {
    return NextResponse.json({ error: "Missing status." }, { status: 400 });
  }

  const booking = await getBooking(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (!canView(booking, session.user.id, role)) {
    return NextResponse.json({ error: "Not your booking." }, { status: 403 });
  }
  if (!canSetStatus(role, status)) {
    return NextResponse.json(
      { error: "You can't set that status." },
      { status: 403 },
    );
  }
  // A driver may only move the booking they're actually assigned to.
  if (role === "driver" && booking.driver_id !== session.user.id) {
    return NextResponse.json(
      { error: "That job isn't assigned to you." },
      { status: 403 },
    );
  }

  await db().sql`
    UPDATE bookings SET status = ${status}, updated_at = NOW() WHERE id = ${id}
  `;
  await logEvent(
    id,
    status,
    note?.trim() || statusLabel(status),
    session.user.id,
    role,
  );

  return NextResponse.json({ ok: true, status });
}
