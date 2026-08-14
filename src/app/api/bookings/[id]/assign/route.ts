import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Ops only." }, { status: 403 });
  }

  const { driverId } = (await req.json().catch(() => ({}))) as {
    driverId?: string;
  };

  if (!driverId) {
    await db().sql`
      UPDATE bookings SET driver_id = NULL, updated_at = NOW() WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  }

  const [driver] = await db().sql<{ id: string; name: string | null }>`
    SELECT id, name FROM users WHERE id = ${driverId} AND role IN ('driver', 'admin')
  `;
  if (!driver) {
    return NextResponse.json({ error: "Unknown driver." }, { status: 400 });
  }

  await db().sql`
    UPDATE bookings
    SET driver_id = ${driverId},
        status = CASE WHEN status IN ('requested', 'confirmed') THEN 'driver_assigned' ELSE status END,
        updated_at = NOW()
    WHERE id = ${id}
  `;

  await logEvent(
    id,
    "driver_assigned",
    `Assigned to ${driver.name ?? "driver"}`,
    session.user.id,
    "admin",
  );

  return NextResponse.json({ ok: true });
}
