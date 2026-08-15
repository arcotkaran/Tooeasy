import { getDb, nowIso, uid } from "@/server/db";
import type { Role } from "@/server/auth";

export type BookingRow = {
  id: string;
  ref: string;
  user_id: string | null;
  driver_id: string | null;
  status: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  vehicle: string;
  services: string;
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

export type Booking = Omit<BookingRow, "services"> & { services: string[] };

const parse = (r: BookingRow): Booking => ({
  ...r,
  services: JSON.parse(r.services || "[]") as string[],
});

/** Short human-quotable reference, e.g. "TE-4K9P2". */
export function newRef(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `TE-${out}`;
}

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

export function createBooking(b: NewBooking): { ref: string; id: string } {
  const db = getDb();

  // Idempotency: a double-tap or retry returns the original booking.
  if (b.requestId) {
    const existing = db
      .prepare("SELECT id, ref FROM bookings WHERE request_id = ?")
      .get(b.requestId) as { id: string; ref: string } | undefined;
    if (existing) return existing;
  }

  const id = uid();
  const ref = newRef();
  const ts = nowIso();

  db.prepare(
    `INSERT INTO bookings (
       id, ref, user_id, status, contact_name, contact_phone, contact_email,
       vehicle, services, concern, pickup_address, suburb, postcode,
       pickup_date, pickup_window, key_handoff, request_id, created_at, updated_at
     ) VALUES (?, ?, ?, 'requested', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    ref,
    b.userId,
    b.contactName,
    b.contactPhone,
    b.contactEmail,
    b.vehicle,
    JSON.stringify(b.services),
    b.concern,
    b.pickupAddress,
    b.suburb,
    b.postcode,
    b.pickupDate,
    b.pickupWindow,
    b.keyHandoff,
    b.requestId,
    ts,
    ts,
  );

  addEvent(id, "requested", "Pickup requested", b.userId, "customer");
  return { id, ref };
}

export function addEvent(
  bookingId: string,
  status: string,
  note: string | null,
  actorId: string | null,
  actorRole: Role | "customer",
) {
  getDb()
    .prepare(
      `INSERT INTO booking_events (id, booking_id, status, note, actor_id, actor_role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(uid(), bookingId, status, note, actorId, actorRole, nowIso());
}

const SELECT = `
  SELECT b.*, d.name AS driver_name, c.name AS customer_name
    FROM bookings b
    LEFT JOIN users d ON d.id = b.driver_id
    LEFT JOIN users c ON c.id = b.user_id
`;

export function allBookings(): Booking[] {
  return (getDb().prepare(`${SELECT} ORDER BY b.created_at DESC`).all() as BookingRow[]).map(parse);
}

export function bookingsForCustomer(userId: string): Booking[] {
  return (
    getDb()
      .prepare(`${SELECT} WHERE b.user_id = ? ORDER BY b.created_at DESC`)
      .all(userId) as BookingRow[]
  ).map(parse);
}

export function bookingsForDriver(driverId: string): Booking[] {
  return (
    getDb()
      .prepare(
        `${SELECT} WHERE b.driver_id = ? AND b.status NOT IN ('delivered','cancelled')
         ORDER BY b.pickup_date, b.created_at`,
      )
      .all(driverId) as BookingRow[]
  ).map(parse);
}

/** The workshop queue — anything that has reached the shop and isn't finished. */
export function bookingsForWorkshop(): Booking[] {
  return (
    getDb()
      .prepare(
        `${SELECT} WHERE b.status IN ('at_workshop','in_service','ready')
         ORDER BY b.pickup_date, b.created_at`,
      )
      .all() as BookingRow[]
  ).map(parse);
}

export function getBooking(id: string): Booking | null {
  const row = getDb().prepare(`${SELECT} WHERE b.id = ?`).get(id) as BookingRow | undefined;
  return row ? parse(row) : null;
}

export function setStatus(
  id: string,
  status: string,
  actorId: string | null,
  actorRole: Role,
  note?: string,
) {
  getDb()
    .prepare("UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?")
    .run(status, nowIso(), id);
  addEvent(id, status, note ?? null, actorId, actorRole);
}

export function assignDriver(id: string, driverId: string | null, actorId: string) {
  const db = getDb();
  db.prepare("UPDATE bookings SET driver_id = ?, updated_at = ? WHERE id = ?").run(
    driverId,
    nowIso(),
    id,
  );
  if (driverId) {
    const d = db.prepare("SELECT name FROM users WHERE id = ?").get(driverId) as
      | { name: string }
      | undefined;
    db.prepare(
      "UPDATE bookings SET status = 'driver_assigned', updated_at = ? WHERE id = ? AND status IN ('requested','confirmed')",
    ).run(nowIso(), id);
    addEvent(id, "driver_assigned", `Assigned to ${d?.name ?? "driver"}`, actorId, "admin");
  }
}

export function eventsFor(bookingId: string) {
  return getDb()
    .prepare(
      "SELECT status, note, actor_role, created_at FROM booking_events WHERE booking_id = ? ORDER BY created_at",
    )
    .all(bookingId) as {
    status: string;
    note: string | null;
    actor_role: string | null;
    created_at: string;
  }[];
}

export function addWaitlist(e: {
  email: string;
  name?: string | null;
  suburb?: string | null;
  postcode: string;
  vehicle?: string | null;
}) {
  getDb()
    .prepare(
      `INSERT INTO waitlist (id, email, name, suburb, postcode, vehicle, category, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'mechanic', ?)`,
    )
    .run(uid(), e.email, e.name ?? null, e.suburb ?? null, e.postcode, e.vehicle ?? null, nowIso());
}

export function allWaitlist() {
  return getDb()
    .prepare("SELECT * FROM waitlist ORDER BY created_at DESC")
    .all() as {
    email: string;
    suburb: string | null;
    postcode: string;
    vehicle: string | null;
    created_at: string;
  }[];
}
