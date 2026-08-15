"use client";

import { supabase, supabaseConfigured } from "@/lib/supabase";

/**
 * Every booking carries the service line it belongs to. Car service is the
 * only one live today; designated driver, delivery and the rest will share
 * this table rather than needing their own.
 */
export const SERVICE_CATEGORY = "mechanic" as const;

export type BookingInput = {
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleOdometer: string;
  services: string[];
  concern: string;
  pickupAddress: string;
  pickupPostcode: string;
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

type Result = { ref: string } | { error: string };

/**
 * Writes to Supabase when it's configured, otherwise falls back to the
 * Netlify Function that stores in Blobs. The fallback keeps the site taking
 * bookings before the Supabase project exists.
 */
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
      contact_name: input.contactName.trim(),
      contact_phone: input.contactPhone.trim(),
      contact_email: input.contactEmail.trim().toLowerCase(),
      vehicle_year: input.vehicleYear.trim() || null,
      vehicle_make: input.vehicleMake.trim(),
      vehicle_model: input.vehicleModel.trim(),
      vehicle_rego: input.vehiclePlate.trim() || null,
      vehicle_odometer: input.vehicleOdometer.trim() || null,
      services: input.services,
      concern: input.concern.trim() || null,
      pickup_address: input.pickupAddress.trim(),
      pickup_postcode: input.pickupPostcode.trim(),
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
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? "Something went wrong." };
  return { ref: data.ref };
}
