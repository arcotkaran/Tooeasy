import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    zip?: string;
    vehicle?: string;
    services?: string[];
  };

  const zip = (body.zip ?? "").trim().slice(0, 5);
  const email = (body.email ?? "").trim().toLowerCase();

  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "A valid ZIP is required." }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  try {
    await db().sql`
      INSERT INTO waitlist (email, name, zip, vehicle, services)
      VALUES (
        ${email},
        ${body.name?.trim() || null},
        ${zip},
        ${body.vehicle?.trim() || null},
        ${body.services ?? []}
      )
    `;
  } catch {
    return NextResponse.json(
      { error: "Could not save that right now. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
