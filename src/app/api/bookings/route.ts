import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, newRef } from "@/lib/db";
import { checkCoverage } from "@/lib/geo";
import { getPrimaryGarage } from "@/lib/garage";
import { SERVICE_BY_ID, PICKUP_WINDOWS, KEY_HANDOFF } from "@/lib/services";

export const dynamic = "force-dynamic";

type Body = {
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleMileage?: string;
  services?: string[];
  concern?: string;
  pickupAddress?: string;
  pickupZip?: string;
  pickupDate?: string;
  pickupWindow?: string;
  keyHandoff?: string;
  contactName?: string;
  contactPhone?: string;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const b = (await req.json().catch(() => ({}))) as Body;

  const services = (b.services ?? []).filter((s) => SERVICE_BY_ID.has(s));
  if (services.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one service." },
      { status: 400 },
    );
  }

  const zip = (b.pickupZip ?? "").trim().slice(0, 5);
  const garage = await getPrimaryGarage();
  const coverage = checkCoverage(zip, garage);
  if (!coverage.covered) {
    return NextResponse.json(
      { error: "That ZIP is outside our pickup area right now." },
      { status: 400 },
    );
  }

  const required: [string, string | undefined][] = [
    ["a pickup address", b.pickupAddress?.trim()],
    ["a pickup date", b.pickupDate?.trim()],
    ["your name", b.contactName?.trim()],
    ["a phone number", b.contactPhone?.trim()],
    ["your car's make", b.vehicleMake?.trim()],
    ["your car's model", b.vehicleModel?.trim()],
  ];
  const missing = required.find(([, v]) => !v);
  if (missing) {
    return NextResponse.json(
      { error: `Please add ${missing[0]}.` },
      { status: 400 },
    );
  }

  // Reject dates in the past; the picker already sets a min, this is the backstop.
  const date = b.pickupDate!.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Pick a valid date." }, { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    return NextResponse.json(
      { error: "Pick a date from today onwards." },
      { status: 400 },
    );
  }

  const windowId = PICKUP_WINDOWS.some((w) => w.id === b.pickupWindow)
    ? b.pickupWindow!
    : PICKUP_WINDOWS[0].id;
  const handoff = KEY_HANDOFF.some((k) => k.id === b.keyHandoff)
    ? b.keyHandoff!
    : "in_person";

  const ref = newRef();

  try {
    const [booking] = await db().sql<{ id: string; ref: string }>`
      INSERT INTO bookings (
        ref, customer_id, garage_id,
        contact_name, contact_phone,
        vehicle_year, vehicle_make, vehicle_model, vehicle_plate, vehicle_mileage,
        services, concern,
        pickup_address, pickup_zip, pickup_date, pickup_window, key_handoff,
        status
      ) VALUES (
        ${ref}, ${session.user.id}, ${garage.id},
        ${b.contactName!.trim()}, ${b.contactPhone!.trim()},
        ${b.vehicleYear?.trim() || null}, ${b.vehicleMake!.trim()},
        ${b.vehicleModel!.trim()}, ${b.vehiclePlate?.trim() || null},
        ${b.vehicleMileage?.trim() || null},
        ${services}, ${b.concern?.trim() || null},
        ${b.pickupAddress!.trim()}, ${zip}, ${date}, ${windowId}, ${handoff},
        'requested'
      )
      RETURNING id, ref
    `;

    await db().sql`
      INSERT INTO booking_events (booking_id, status, note, actor_id, actor_role)
      VALUES (${booking.id}, 'requested', 'Booking submitted', ${session.user.id}, 'customer')
    `;

    return NextResponse.json({ id: booking.id, ref: booking.ref });
  } catch {
    return NextResponse.json(
      { error: "Couldn't save your booking. Please try again." },
      { status: 500 },
    );
  }
}
