import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { checkCoverage } from "../../src/lib/geo";
import { SERVICE_BY_ID, PICKUP_WINDOWS, KEY_HANDOFF } from "../../src/lib/services";

/** Short human-quotable booking reference, e.g. "TE-4K9P2". */
function newRef(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `TE-${out}`;
}

/** Field caps, so a malformed or hostile payload can't fill the store. */
const MAX = {
  vehicle: 120,
  concern: 2000,
  address: 200,
  name: 120,
  phone: 30,
  email: 200,
  suburb: 80,
};

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

/** Australian mobile or landline, forgiving about spacing and +61. */
function normalisePhone(raw: string): string | null {
  const only = raw
    .replace(/[^\d+]/g, "")
    .replace(/^\+?61/, "0")
    .replace(/\D/g, "");
  if (only.length !== 10) return null;
  if (!/^0[234578]/.test(only)) return null;
  return only;
}

type Body = Record<string, unknown>;

export default async (req: Request) => {
  const b = (await req.json().catch(() => ({}))) as Body;

  const services = (Array.isArray(b.services) ? b.services : [])
    .map((s) => String(s))
    .filter((s) => SERVICE_BY_ID.has(s));
  if (services.length === 0) {
    return Response.json({ error: "Pick at least one service." }, { status: 400 });
  }

  const suburb = clip(b.suburb, MAX.suburb);
  const postcode = clip(b.postcode, 4);
  const coverage = checkCoverage(suburb, postcode);
  if (!coverage.covered) {
    return Response.json(
      { error: "We don't collect from that suburb yet." },
      { status: 400 },
    );
  }

  const vehicle = clip(b.vehicle, MAX.vehicle);
  const pickupAddress = clip(b.pickupAddress, MAX.address);
  const contactName = clip(b.contactName, MAX.name);
  const rawPhone = clip(b.contactPhone, MAX.phone);

  const required: [string, string][] = [
    ["which car we're collecting", vehicle],
    ["a pickup address", pickupAddress],
    ["your name", contactName],
    ["a mobile number", rawPhone],
  ];
  const missing = required.find(([, v]) => !v);
  if (missing) {
    return Response.json({ error: `Please add ${missing[0]}.` }, { status: 400 });
  }

  const contactPhone = normalisePhone(rawPhone);
  if (!contactPhone) {
    return Response.json(
      { error: "That doesn't look like an Australian phone number." },
      { status: 400 },
    );
  }

  const email = clip(b.contactEmail, MAX.email).toLowerCase();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
    return Response.json({ error: "That email doesn't look right." }, { status: 400 });
  }

  const date = clip(b.pickupDate, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Pick a valid day." }, { status: 400 });
  }

  // Compare against today in Sydney, not UTC. This function runs 10-11 hours
  // behind Australian local time, so a UTC comparison would reject perfectly
  // valid same-day bookings for most of the Sydney working day.
  const sydneyToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (date < sydneyToday) {
    return Response.json(
      { error: "Pick a day from today onwards." },
      { status: 400 },
    );
  }

  const windowId = PICKUP_WINDOWS.some((w) => w.id === b.pickupWindow)
    ? String(b.pickupWindow)
    : PICKUP_WINDOWS[0].id;
  const handoff = KEY_HANDOFF.some((k) => k.id === b.keyHandoff)
    ? String(b.keyHandoff)
    : "in_person";

  const store = getStore("bookings");

  // Idempotency: a double-tap, or a retry on a flaky mobile connection, reuses
  // the first booking rather than creating a second job for the same customer.
  const requestId = clip(b.requestId, 64);
  if (requestId) {
    const existing = (await store
      .get(`idem/${requestId}`, { type: "json" })
      .catch(() => null)) as { ref: string } | null;
    if (existing?.ref) return Response.json({ ref: existing.ref });
  }

  const ref = newRef();
  const booking = {
    ref,
    status: "requested",
    category: "mechanic",
    contactName,
    contactPhone,
    contactEmail: email || null,
    vehicle,
    services,
    concern: clip(b.concern, MAX.concern) || null,
    pickupAddress,
    suburb: coverage.suburb,
    postcode,
    pickupDate: date,
    pickupWindow: windowId,
    keyHandoff: handoff,
    createdAt: new Date().toISOString(),
  };

  try {
    await store.setJSON(`${date}/${ref}`, booking);
    if (requestId) await store.setJSON(`idem/${requestId}`, { ref });
  } catch {
    return Response.json(
      { error: "Couldn't save your booking. Please try again." },
      { status: 500 },
    );
  }

  return Response.json({ ref });
};

export const config: Config = {
  path: "/api/bookings",
  method: ["POST"],
};
