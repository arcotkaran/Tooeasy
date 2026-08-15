"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createSession,
  createUser,
  currentUser,
  destroySession,
  findUserByEmail,
  homeForRole,
  setUserActive,
  verifyPassword,
  type Role,
} from "@/server/auth";
import { assignDriver, getBooking, setStatus } from "@/server/bookings";
import { canSet, statusLabel } from "@/lib/status";

export type FormState = {
  error?: string;
  ok?: string;
  /** Echoed back so a validation error never empties the form. */
  values?: Record<string, string>;
};

/* ── sign in / out ─────────────────────────────────────────── */

export async function signInAction(
  _prev: FormState,
  data: FormData,
): Promise<FormState> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const password = String(data.get("password") ?? "");

  const values = { email };
  if (!email || !password)
    return { error: "Enter your email and password.", values };

  const user = findUserByEmail(email);
  // Same message either way, so the form can't be used to discover accounts.
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "Email or password is incorrect.", values };
  }
  if (!user.active)
    return { error: "That account has been deactivated.", values };

  await createSession(user.id);
  redirect(homeForRole(user.role));
}

export async function signOutAction() {
  await destroySession();
  redirect("/login");
}

/* ── customer self sign-up ─────────────────────────────────── */

export async function signUpAction(
  _prev: FormState,
  data: FormData,
): Promise<FormState> {
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const phone = String(data.get("phone") ?? "").trim();
  const password = String(data.get("password") ?? "");
  const values = { name, email, phone };

  if (!name) return { error: "Tell us your name.", values };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email))
    return { error: "That email doesn't look right.", values };
  if (password.length < 8)
    return { error: "Use at least 8 characters for your password.", values };
  if (findUserByEmail(email))
    return { error: "An account with that email already exists.", values };

  // Sign-up always creates a customer. Staff roles are created by an admin.
  const { id } = createUser({ email, password, name, phone, role: "customer" });
  await createSession(id);
  redirect("/dashboard");
}

/* ── admin: create staff ───────────────────────────────────── */

export async function createStaffAction(
  _prev: FormState,
  data: FormData,
): Promise<FormState> {
  const me = await currentUser();
  if (me?.role !== "admin") return { error: "Only an admin can add people." };

  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const phone = String(data.get("phone") ?? "").trim();
  const password = String(data.get("password") ?? "");
  const role = String(data.get("role") ?? "") as Role;
  const values = { name, email, phone, role };

  if (!["driver", "mechanic", "admin"].includes(role))
    return { error: "Pick driver, mechanic or admin.", values };
  if (!name) return { error: "Give them a name.", values };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email))
    return { error: "That email doesn't look right.", values };
  if (password.length < 8)
    return { error: "Use at least 8 characters for their password.", values };
  if (findUserByEmail(email))
    return { error: "That email is already registered.", values };

  createUser({ email, password, name, phone, role, createdBy: me.id });
  revalidatePath("/admin");
  return { ok: `${name} can now sign in as a ${role}.` };
}

export async function toggleUserAction(data: FormData) {
  const me = await currentUser();
  if (me?.role !== "admin") return;

  const id = String(data.get("id") ?? "");
  const active = String(data.get("active") ?? "") === "1";
  if (id && id !== me.id) setUserActive(id, active);
  revalidatePath("/admin");
}

/* ── booking workflow ──────────────────────────────────────── */

export async function setStatusAction(data: FormData) {
  const me = await currentUser();
  if (!me) return;

  const id = String(data.get("id") ?? "");
  const status = String(data.get("status") ?? "");
  if (!id || !canSet(me.role, status)) return;

  const booking = getBooking(id);
  if (!booking) return;
  // A driver may only move a job that is actually theirs.
  if (me.role === "driver" && booking.driver_id !== me.id) return;
  if (me.role === "customer" && booking.user_id !== me.id) return;

  // Label the event so the customer's history reads as sentences, not codes.
  setStatus(id, status, me.id, me.role, statusLabel(status));
  revalidatePath("/admin");
  revalidatePath("/driver");
  revalidatePath("/garage");
  revalidatePath("/dashboard");
}

export async function assignDriverAction(data: FormData) {
  const me = await currentUser();
  if (me?.role !== "admin") return;

  const id = String(data.get("id") ?? "");
  const driverId = String(data.get("driverId") ?? "") || null;
  if (id) assignDriver(id, driverId, me.id);
  revalidatePath("/admin");
  revalidatePath("/driver");
}

/* ── public booking ────────────────────────────────────────── */

import { createBooking } from "@/server/bookings";
import { checkCoverage } from "@/lib/geo";
import { SERVICE_BY_ID, PICKUP_WINDOWS, KEY_HANDOFF } from "@/lib/services";

const clip = (v: FormDataEntryValue | null, n: number) =>
  String(v ?? "").trim().slice(0, n);

/** Australian mobile or landline, forgiving about spacing and +61. */
function normalisePhone(raw: string): string | null {
  const only = raw.replace(/[^\d+]/g, "").replace(/^\+?61/, "0").replace(/\D/g, "");
  if (only.length !== 10) return null;
  if (!/^0[234578]/.test(only)) return null;
  return only;
}

export type BookingState = { error?: string; ref?: string };

export async function createBookingAction(
  _prev: BookingState,
  data: FormData,
): Promise<BookingState> {
  const me = await currentUser();

  const services = String(data.get("services") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => SERVICE_BY_ID.has(s));
  if (services.length === 0) return { error: "Pick at least one service." };

  const suburb = clip(data.get("suburb"), 80);
  const postcode = clip(data.get("postcode"), 4);
  const coverage = checkCoverage(suburb, postcode);
  if (!coverage.covered) return { error: "We don't collect from that suburb yet." };

  const vehicle = clip(data.get("vehicle"), 120);
  const pickupAddress = clip(data.get("pickupAddress"), 200);
  const contactName = clip(data.get("contactName"), 120);
  const rawPhone = clip(data.get("contactPhone"), 30);

  const missing = ([
    ["which car we're collecting", vehicle],
    ["a pickup address", pickupAddress],
    ["your name", contactName],
    ["a mobile number", rawPhone],
  ] as [string, string][]).find(([, v]) => !v);
  if (missing) return { error: `Please add ${missing[0]}.` };

  const contactPhone = normalisePhone(rawPhone);
  if (!contactPhone)
    return { error: "That doesn't look like an Australian phone number." };

  const email = clip(data.get("contactEmail"), 200).toLowerCase();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email))
    return { error: "That email doesn't look right." };

  const date = clip(data.get("pickupDate"), 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Pick a valid day." };

  // "Today" means today in Sydney, whatever the server's clock is set to.
  const sydneyToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  if (date < sydneyToday) return { error: "Pick a day from today onwards." };

  const windowId = PICKUP_WINDOWS.some((w) => w.id === data.get("pickupWindow"))
    ? String(data.get("pickupWindow"))
    : PICKUP_WINDOWS[0].id;
  const handoff = KEY_HANDOFF.some((k) => k.id === data.get("keyHandoff"))
    ? String(data.get("keyHandoff"))
    : "in_person";

  const { ref } = createBooking({
    userId: me?.id ?? null,
    contactName,
    contactPhone,
    contactEmail: email || me?.email || null,
    vehicle,
    services,
    concern: clip(data.get("concern"), 2000) || null,
    pickupAddress,
    suburb: coverage.suburb,
    postcode,
    pickupDate: date,
    pickupWindow: windowId,
    keyHandoff: handoff,
    requestId: clip(data.get("requestId"), 64) || null,
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ref };
}
