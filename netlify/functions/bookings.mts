import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { checkCoverage, GARAGE } from "../../src/lib/geo";
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
  contactEmail?: string;
};

export default async (req: Request) => {
  const b = (await req.json().catch(() => ({}))) as Body;

  const services = (b.services ?? []).filter((s) => SERVICE_BY_ID.has(s));
  if (services.length === 0) {
    return Response.json({ error: "Pick at least one service." }, { status: 400 });
  }

  const zip = (b.pickupZip ?? "").trim().slice(0, 5);
  if (!checkCoverage(zip, GARAGE).covered) {
    return Response.json(
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
    return Response.json({ error: `Please add ${missing[0]}.` }, { status: 400 });
  }

  const date = b.pickupDate!.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Pick a valid date." }, { status: 400 });
  }
  if (date < new Date().toISOString().slice(0, 10)) {
    return Response.json(
      { error: "Pick a date from today onwards." },
      { status: 400 },
    );
  }

  const email = (b.contactEmail ?? "").trim().toLowerCase();
  if (!email.includes("@")) {
    return Response.json({ error: "Please add an email address." }, { status: 400 });
  }

  const windowId = PICKUP_WINDOWS.some((w) => w.id === b.pickupWindow)
    ? b.pickupWindow!
    : PICKUP_WINDOWS[0].id;
  const handoff = KEY_HANDOFF.some((k) => k.id === b.keyHandoff)
    ? b.keyHandoff!
    : "in_person";

  const ref = newRef();
  const booking = {
    ref,
    status: "requested",
    contactName: b.contactName!.trim(),
    contactPhone: b.contactPhone!.trim(),
    contactEmail: email,
    vehicle: {
      year: b.vehicleYear?.trim() || null,
      make: b.vehicleMake!.trim(),
      model: b.vehicleModel!.trim(),
      plate: b.vehiclePlate?.trim() || null,
      mileage: b.vehicleMileage?.trim() || null,
    },
    services,
    concern: b.concern?.trim() || null,
    pickupAddress: b.pickupAddress!.trim(),
    pickupZip: zip,
    pickupDate: date,
    pickupWindow: windowId,
    keyHandoff: handoff,
    createdAt: new Date().toISOString(),
  };

  try {
    const store = getStore("bookings");
    // Date-prefixed so the ops list reads chronologically.
    await store.setJSON(`${date}/${ref}`, booking);
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
