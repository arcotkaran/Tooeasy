import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { serviceLabels, PICKUP_WINDOWS } from "../../src/lib/services";

/**
 * Interim ops view. Until Google sign-in is wired up there are no roles, so
 * this is gated on a shared secret in OPS_KEY rather than left public —
 * it exposes customer names, addresses and phone numbers.
 */

type Booking = {
  ref: string;
  status: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  vehicle: { year: string | null; make: string; model: string; plate: string | null; odometer: string | null };
  services: string[];
  concern: string | null;
  pickupAddress: string;
  pickupPostcode: string;
  pickupDate: string;
  pickupWindow: string;
  keyHandoff: string;
  createdAt: string;
};

type Waitlist = {
  email: string;
  name: string | null;
  postcode: string;
  vehicle: string | null;
  createdAt: string;
};

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

async function readAll<T>(name: string): Promise<T[]> {
  const store = getStore(name);
  const { blobs } = await store.list();
  const rows = await Promise.all(
    blobs.map((b) => store.get(b.key, { type: "json" }) as Promise<T>),
  );
  return rows.filter(Boolean);
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  const expected = process.env.OPS_KEY ?? "";

  if (!expected || key !== expected) {
    return new Response("Not found", { status: 404 });
  }

  const [bookings, waitlist] = await Promise.all([
    readAll<Booking>("bookings"),
    readAll<Waitlist>("waitlist"),
  ]);

  bookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  waitlist.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (url.searchParams.get("format") === "json") {
    return Response.json({ bookings, waitlist });
  }

  const postcodeCounts = new Map<string, number>();
  for (const w of waitlist) postcodeCounts.set(w.postcode, (postcodeCounts.get(w.postcode) ?? 0) + 1);
  const topPostcodes = [...postcodeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Too Easy — ops</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; padding:20px; background:#08090a; color:#f4f7f8;
         font:15px/1.5 ui-sans-serif,system-ui,sans-serif; }
  h1 { font-size:24px; margin:0 0 4px; letter-spacing:-.02em; }
  h2 { font-size:16px; margin:32px 0 10px; color:#c8ff47; letter-spacing:.06em;
       text-transform:uppercase; }
  .sub { color:#98a2a9; font-size:13px; margin:0 0 8px; }
  .stats { display:flex; flex-wrap:wrap; gap:10px; margin-top:16px; }
  .stat { border:1px solid #23282d; border-radius:14px; padding:12px 16px; min-width:110px; }
  .stat b { display:block; font-size:26px; color:#c8ff47; }
  .stat span { font-size:12px; color:#98a2a9; }
  .card { border:1px solid #23282d; border-radius:14px; padding:14px; margin-bottom:10px; }
  .row { display:flex; justify-content:space-between; gap:12px; align-items:baseline; }
  .ref { font-weight:600; color:#c8ff47; }
  .meta { color:#98a2a9; font-size:13px; }
  .note { background:#111417; border-radius:10px; padding:10px; margin-top:10px;
          font-size:13px; color:#98a2a9; }
  .pill { display:inline-block; border:1px solid #23282d; border-radius:999px;
          padding:4px 10px; font-size:13px; margin:0 6px 6px 0; }
  .empty { color:#98a2a9; border:1px dashed #23282d; border-radius:14px; padding:20px; }
  a { color:#c8ff47; }
</style></head><body>
<h1>Too Easy — ops</h1>
<p class="sub">Interim view. Replaced by the real consoles once Google sign-in is live.</p>

<div class="stats">
  <div class="stat"><b>${bookings.length}</b><span>Bookings</span></div>
  <div class="stat"><b>${waitlist.length}</b><span>Waitlist</span></div>
  <div class="stat"><b>${new Set(bookings.map((b) => b.pickupPostcode)).size}</b><span>Postcodes booked</span></div>
</div>

<h2>Bookings</h2>
${
  bookings.length === 0
    ? `<p class="empty">No bookings yet.</p>`
    : bookings
        .map((b) => {
          const win = PICKUP_WINDOWS.find((w) => w.id === b.pickupWindow);
          const car = [b.vehicle.year, b.vehicle.make, b.vehicle.model]
            .filter(Boolean)
            .join(" ");
          return `<div class="card">
  <div class="row"><strong>${esc(car)}</strong><span class="ref">${esc(b.ref)}</span></div>
  <div class="meta">${esc(b.contactName)} · <a href="tel:${esc(b.contactPhone)}">${esc(b.contactPhone)}</a> · <a href="mailto:${esc(b.contactEmail)}">${esc(b.contactEmail)}</a></div>
  <div class="meta">${esc(b.pickupAddress)}, ${esc(b.pickupPostcode)}</div>
  <div class="meta">${esc(b.pickupDate)} · ${esc(win?.detail ?? b.pickupWindow)}</div>
  <div class="meta">Work: ${esc(serviceLabels(b.services).join(", "))}</div>
  ${b.concern ? `<div class="note">&ldquo;${esc(b.concern)}&rdquo;</div>` : ""}
</div>`;
        })
        .join("")
}

<h2>Waitlist — where to open next</h2>
${
  topPostcodes.length === 0
    ? `<p class="empty">Nobody out of area yet.</p>`
    : `<div>${topPostcodes
        .map(([postcode, n]) => `<span class="pill">${esc(postcode)} — ${n}</span>`)
        .join("")}</div>
<div style="margin-top:12px">${waitlist
        .map(
          (w) =>
            `<div class="card"><div class="row"><span>${esc(w.email)}</span><span class="ref">${esc(w.postcode)}</span></div>${
              w.vehicle ? `<div class="meta">${esc(w.vehicle)}</div>` : ""
            }</div>`,
        )
        .join("")}</div>`
}
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};

export const config: Config = {
  path: "/api/ops",
  method: ["GET"],
};
