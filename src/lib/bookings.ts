import { db } from "@/lib/db";
import type { Role } from "@/lib/status";

export type BookingRow = {
  id: string;
  ref: string;
  customer_id: string;
  driver_id: string | null;
  garage_id: string | null;
  contact_name: string;
  contact_phone: string;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  vehicle_mileage: string | null;
  services: string[];
  concern: string | null;
  pickup_address: string;
  pickup_zip: string;
  pickup_date: string;
  pickup_window: string;
  key_handoff: string;
  status: string;
  created_at: string;
  customer_name?: string | null;
  customer_email?: string | null;
  driver_name?: string | null;
};

export type EventRow = {
  id: string;
  status: string;
  note: string | null;
  actor_role: string | null;
  created_at: string;
};

export type QuoteRow = {
  id: string;
  booking_id: string;
  items: { label: string; cents: number }[];
  total_cents: number;
  eta_note: string | null;
  status: string;
  created_at: string;
  decided_at: string | null;
};

export async function getBooking(id: string): Promise<BookingRow | null> {
  const [row] = await db().sql<BookingRow>`
    SELECT b.*,
           c.name  AS customer_name,
           c.email AS customer_email,
           d.name  AS driver_name
    FROM bookings b
    LEFT JOIN users c ON c.id = b.customer_id
    LEFT JOIN users d ON d.id = b.driver_id
    WHERE b.id = ${id}
  `;
  return row ?? null;
}

export async function getEvents(bookingId: string): Promise<EventRow[]> {
  return db().sql<EventRow>`
    SELECT id, status, note, actor_role, created_at
    FROM booking_events
    WHERE booking_id = ${bookingId}
    ORDER BY created_at ASC
  `;
}

export async function getQuotes(bookingId: string): Promise<QuoteRow[]> {
  return db().sql<QuoteRow>`
    SELECT id, booking_id, items, total_cents, eta_note, status, created_at, decided_at
    FROM quotes
    WHERE booking_id = ${bookingId}
    ORDER BY created_at DESC
  `;
}

/**
 * Who may look at a booking: the customer who owns it, the assigned driver,
 * any mechanic (they work the shop queue), and ops.
 */
export function canView(
  booking: BookingRow,
  userId: string,
  role: Role,
): boolean {
  if (role === "admin" || role === "mechanic") return true;
  if (booking.customer_id === userId) return true;
  if (role === "driver" && booking.driver_id === userId) return true;
  return false;
}

export async function logEvent(
  bookingId: string,
  status: string,
  note: string | null,
  actorId: string | null,
  actorRole: Role,
) {
  await db().sql`
    INSERT INTO booking_events (booking_id, status, note, actor_id, actor_role)
    VALUES (${bookingId}, ${status}, ${note}, ${actorId}, ${actorRole})
  `;
}

export function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
