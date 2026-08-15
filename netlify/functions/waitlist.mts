import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

export default async (req: Request) => {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const postcode = clip(b.postcode, 4);
  const suburb = clip(b.suburb, 80);
  const email = clip(b.email, 200).toLowerCase();

  if (!/^\d{4}$/.test(postcode)) {
    return Response.json(
      { error: "A valid postcode is required." },
      { status: 400 },
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
    return Response.json(
      { error: "A valid email address is required." },
      { status: 400 },
    );
  }

  const entry = {
    email,
    name: clip(b.name, 120) || null,
    suburb: suburb || null,
    postcode,
    vehicle: clip(b.vehicle, 120) || null,
    category: "mechanic",
    createdAt: new Date().toISOString(),
  };

  try {
    const store = getStore("waitlist");
    // Suburb-first key: "where do we open next" is the question this answers.
    await store.setJSON(
      `${suburb || postcode}/${Date.now()}-${crypto.randomUUID()}`,
      entry,
    );
  } catch {
    return Response.json(
      { error: "Could not save that right now. Please try again." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
};

export const config: Config = {
  path: "/api/waitlist",
  method: ["POST"],
};
