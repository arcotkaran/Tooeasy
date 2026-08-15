"use client";

import { supabase, supabaseConfigured } from "@/lib/supabase";

/**
 * Every booking carries the service line it belongs to. Car service is the
 * only one live today; designated driver, delivery and the rest will share
 * this table rather than needing their own.
 */
export const SERVICE_CATEGORY = "mechanic" as const;

export type BookingInput = {
  vehicle: string;
  services: string[];
  concern: string;
  pickupAddress: string;
  suburb: string;
  postcode: string;
  pickupDate: string;
  pickupWindow: string;
  keyHandoff: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

/** Short human-quotable reference, e.g. "TE-4K9P2". */
function newRef(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `TE-${out}`;
}

/**
 * One id per page load. Sent with the booking so a double-tap or a retry on a
 * flaky connection can't create two jobs for the same customer.
 */
let requestId: string | null = null;
function getRequestId(): string {
  if (!requestId) {
    requestId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return requestId;
}

type Result = { ref: string } | { error: string };

export async function submitBooking(input: BookingInput): Promise<Result> {
  if (supabaseConfigured) {
    const client = supabase();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) return { error: "Please sign in again to confirm your booking." };

    const ref = newRef();
    const { error } = await client.from("bookings").insert({
      ref,
      user_id: user.id,
      category: SERVICE_CATEGORY,
      status: "requested",
      request_id: getRequestId(),
      contact_name: input.contactName.trim(),
      contact_phone: input.contactPhone.trim(),
      contact_email: input.contactEmail.trim().toLowerCase() || null,
      vehicle: input.vehicle.trim(),
      services: input.services,
      concern: input.concern.trim() || null,
      pickup_address: input.pickupAddress.trim(),
      suburb: input.suburb.trim(),
      postcode: input.postcode.trim(),
      pickup_date: input.pickupDate,
      pickup_window: input.pickupWindow,
      key_handoff: input.keyHandoff,
    });

    if (error) {
      return { error: "Couldn't save your booking. Please try again." };
    }
    return { ref };
  }

  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, requestId: getRequestId() }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? "Something went wrong." };
  return { ref: data.ref };
}
