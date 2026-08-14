import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    zip?: string;
    vehicle?: string;
  };

  const zip = (body.zip ?? "").trim().slice(0, 5);
  const email = (body.email ?? "").trim().toLowerCase();

  if (!/^\d{5}$/.test(zip)) {
    return Response.json({ error: "A valid ZIP is required." }, { status: 400 });
  }
  if (!email.includes("@")) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }

  const entry = {
    email,
    name: body.name?.trim() || null,
    zip,
    vehicle: body.vehicle?.trim() || null,
    createdAt: new Date().toISOString(),
  };

  try {
    const store = getStore("waitlist");
    // ZIP first so the key sorts by area — that's the question this data answers.
    await store.setJSON(`${zip}/${Date.now()}-${crypto.randomUUID()}`, entry);
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
