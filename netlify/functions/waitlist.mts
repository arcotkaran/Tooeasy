import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    postcode?: string;
    vehicle?: string;
  };

  const postcode = (body.postcode ?? "").trim().slice(0, 4);
  const email = (body.email ?? "").trim().toLowerCase();

  if (!/^\d{4}$/.test(postcode)) {
    return Response.json(
      { error: "A valid postcode is required." },
      { status: 400 },
    );
  }
  if (!email.includes("@")) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }

  const entry = {
    email,
    name: body.name?.trim() || null,
    postcode,
    vehicle: body.vehicle?.trim() || null,
    createdAt: new Date().toISOString(),
  };

  try {
    const store = getStore("waitlist");
    // Postcode first so the key sorts by suburb — that's the question this
    // data answers: where do we open next?
    await store.setJSON(
      `${postcode}/${Date.now()}-${crypto.randomUUID()}`,
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
