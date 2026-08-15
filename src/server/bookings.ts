import { query, one } from "@/server/db";
import type { Role } from "@/server/auth";

export type Booking = {
  id: string;
  ref: string;
  user_id: string | null;
  driver_id: string | null;
  status: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  vehicle: string;
  services: string[];
  concern: string | null;
  pickup_address: string;
  suburb: string;
  postcode: string;
  pickup_date: string;
  pickup_window: string;
  key_handoff: string;
  created_at: string;
  driver_name?: string | null;
  customer_name?: string | null;
};

/** Short human-quotable reference, e.g. "TE-4K9P2". */
export function newRef(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `TE-${out}`;
}

const SELECT = `
  SELECT b.id, b.ref, b.user_id, b.driver_id, b.status,
         b.contact_name, b.contact_phone, b.contact_email,
         b.vehicle, b.services, b.concern,
         b.pickup_address, b.suburb, b.postcode,
         to_char(b.pickup_date, 'YYYY-MM-DD') AS pickup_date,
         b.pickup_window, b.key_handoff, b.created_at,
         d.name AS driver_name, c.name AS customer_name
    FROM bookings b
    LEFT JOIN users d ON d.id = b.driver_id
    LEFT JOIN users c ON c.id = b.user_id
`;

export type NewBooking = {
  userId: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  vehicle: string;
  services: string[];
  concern: string | null;
  pickupAddress: string;
  suburb: string;
  postcode: string;
  pickupDate: string;
  pickupWindow: string;
  keyHandoff: string;
  requestId: string | null;
};

export async function createBooking(
  b: NewBooking,
): Promise<{ ref: string; id: string }> {
  // Idempotency: a double-tap or retry returns the original booking.
  if (b.requestId) {
    const existing = await one<{ id: string; ref: string }>(
      "SELECT id, ref FROM bookings WHERE request_id = $1",
      [b.requestId],
    );
    if (existing) return existing;
  }

  const row = await one<{ id: string; ref: string }>(
    `INSERT INTO bookings (
       ref, user_id, status, contact_name, contact_phone, contact_email,
       vehicle, services, concern, pickup_address, suburb, postcode,
       pickup_date, pickup_window, key_handoff, request_id
     ) VALUES ($1,$2,'requested',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING id, ref`,
    [
      newRef(),
      b.userId,
      b.contactName,
      b.contactPhone,
      b.contactEmail,
      b.vehicle,
      b.services,
      b.concern,
      b.pickupAddress,
      b.suburb,
      b.postcode,
      b.pickupDate,
      b.pickupWindow,
      b.keyHandoff,
      b.requestId,
    ],
  );

  await addEvent(row!.id, "requested", "Pickup requested", b.userId, "customer");
  return row!;
}

export async function addEvent(
  bookingId: string,
  status: string,
  note: string | null,
  actorId: string | null,
  actorRole: Role | "customer",
) {
  await query(
    `INSERT INTO booking_events (booking_id, status, note, actor_id, actor_role)
     VALUES ($1, $2, $3, $4, $5)`,
    [bookingId, status, note, actorId, actorRole],
  );
}

export async function allBookings(): Promise<Booking[]> {
  return query<Booking>(`${SELECT} ORDER BY b.created_at DESC`);
}

export async function bookingsForCustomer(userId: string): Promise<Booking[]> {
  return query<Booking>(`${SELECT} WHERE b.user_id = $1 ORDER BY b.created_at DESC`, [
    userId,
  ]);
}

export async function bookingsForDriver(driverId: string): Promise<Booking[]> {
  return query<Booking>(
    `${SELECT} WHERE b.driver_id = $1 AND b.status NOT IN ('delivered','cancelled')
     ORDER BY b.pickup_date, b.created_at`,
    [driverId],
  );
}

/** The workshop queue — anything at the shop and not finished. */
export async function bookingsForWorkshop(): Promise<Booking[]> {
  return query<Booking>(
    `${SELECT} WHERE b.status IN ('at_workshop','in_service','ready')
     ORDER BY b.pickup_date, b.created_at`,
  );
}

export async function getBooking(id: string): Promise<Booking | null> {
  return one<Booking>(`${SELECT} WHERE b.id = $1`, [id]);
}

export async function setStatus(
  id: string,
  status: string,
  actorId: string | null,
  actorRole: Role,
  note?: string,
) {
  await query("UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2", [
    status,
    id,
  ]);
  await addEvent(id, status, note ?? null, actorId, actorRole);
}

export async function assignDriver(
  id: string,
  driverId: string | null,
  actorId: string,
) {
  await query("UPDATE bookings SET driver_id = $1, updated_at = now() WHERE id = $2", [
    driverId,
    id,
  ]);

  if (driverId) {
    const d = await one<{ name: string }>("SELECT name FROM users WHERE id = $1", [
      driverId,
    ]);
    await query(
      `UPDATE bookings SET status = 'driver_assigned', updated_at = now()
        WHERE id = $1 AND status IN ('requested','confirmed')`,
      [id],
    );
    await addEvent(
      id,
      "driver_assigned",
      `Assigned to ${d?.name ?? "driver"}`,
      actorId,
      "admin",
    );
  }
}

export async function eventsFor(bookingId: string) {
  return query<{
    status: string;
    note: string | null;
    actor_role: string | null;
    created_at: string;
  }>(
    `SELECT status, note, actor_role, created_at
       FROM booking_events WHERE booking_id = $1 ORDER BY created_at`,
    [bookingId],
  );
}

export async function addWaitlist(e: {
  email: string;
  name?: string | null;
  suburb?: string | null;
  postcode: string;
  vehicle?: string | null;
}) {
  await query(
    `INSERT INTO waitlist (email, name, suburb, postcode, vehicle)
     VALUES ($1, $2, $3, $4, $5)`,
    [e.email, e.name ?? null, e.suburb ?? null, e.postcode, e.vehicle ?? null],
  );
}

export async function allWaitlist() {
  return query<{
    email: string;
    suburb: string | null;
    postcode: string;
    vehicle: string | null;
    created_at: string;
  }>("SELECT * FROM waitlist ORDER BY created_at DESC");
}
