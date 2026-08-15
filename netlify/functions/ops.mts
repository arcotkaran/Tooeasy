import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { serviceLabels, PICKUP_WINDOWS } from "../../src/lib/services";

/**
 * Interim ops view. Until roles are live there is no sign-in, so this is
 * gated on a shared secret in OPS_KEY rather than left public — it exposes
 * customer names, addresses and phone numbers.
 */

type Booking = {
  ref: string;
  status: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  vehicle: string;
  services: string[];
  concern: string | null;
  pickupAddress: string;
  suburb: string;
  postcode: string;
  pickupDate: string;
  pickupWindow: string;
  keyHandoff: string;
  createdAt: string;
};

type Waitlist = {
  email: string;
  suburb: string | null;
  postcode: string;
  vehicle: string | null;
  createdAt: string;
};

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

async function readAll<T>(name: string, skipPrefix?: string): Promise<T[]> {
  const store = getStore(name);
  const { blobs } = await store.list();
  const keys = blobs
    .map((b) => b.key)
    .filter((k) => !skipPrefix || !k.startsWith(skipPrefix));
  const rows = await Promise.all(
    keys.map((k) => store.get(k, { type: "json" }) as Promise<T>),
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
    // "idem/" keys are idempotency pointers, not bookings.
    readAll<Booking>("bookings", "idem/"),
    readAll<Waitlist>("waitlist"),
  ]);

  bookings.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  waitlist.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  if (url.searchParams.get("format") === "json") {
    return Response.json({ bookings, waitlist });
  }

  const demand = new Map<string, number>();
  for (const w of waitlist) {
    const k = w.suburb ? `${w.suburb} ${w.postcode}` : w.postcode;
    demand.set(k, (demand.get(k) ?? 0) + 1);
  }
  const topDemand = [...demand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Too Easy — ops</title>
<style>
  :root { color-scheme: light; }
  body { margin:0; padding:20px; background:#fbf6ee; color:#241c15;
         font:15px/1.55 ui-sans-serif,system-ui,-apple-system,sans-serif; }
  h1 { font-size:24px; margin:0 0 4px; letter-spacing:-.02em; }
  h2 { font-size:13px; margin:32px 0 10px; color:#c4522f; letter-spacing:.1em;
       text-transform:uppercase; }
  .sub { color:#6e6157; font-size:13px; margin:0 0 8px; }
  .stats { display:flex; flex-wrap:wrap; gap:10px; margin-top:16px; }
  .stat { border:1px solid #e6dac7; background:#fff; border-radius:14px;
          padding:12px 16px; min-width:120px; }
  .stat b { display:block; font-size:26px; color:#c4522f; }
  .stat span { font-size:12px; color:#6e6157; }
  .card { border:1px solid #e6dac7; background:#fff; border-radius:14px;
          padding:14px; margin-bottom:10px; }
  .row { display:flex; justify-content:space-between; gap:12px; align-items:baseline; }
  .ref { font-weight:600; color:#c4522f; }
  .meta { color:#6e6157; font-size:13px; }
  .note { background:#f4ebdd; border-radius:10px; padding:10px; margin-top:10px;
          font-size:13px; }
  .pill { display:inline-block; border:1px solid #e6dac7; background:#fff;
          border-radius:999px; padding:4px 10px; font-size:13px; margin:0 6px 6px 0; }
  .empty { color:#6e6157; border:1px dashed #e6dac7; border-radius:14px; padding:20px; }
  a { color:#c4522f; }
</style></head><body>
<h1>Too Easy — ops</h1>
<p class="sub">Interim view. Replaced by the real consoles once roles are live.</p>

<div class="stats">
  <div class="stat"><b>${bookings.length}</b><span>Requests</span></div>
  <div class="stat"><b>${waitlist.length}</b><span>Waitlist</span></div>
  <div class="stat"><b>${new Set(bookings.map((b) => b.suburb)).size}</b><span>Suburbs booked</span></div>
</div>

<h2>Pickup requests</h2>
${
  bookings.length === 0
    ? `<p class="empty">No requests yet.</p>`
    : bookings
        .map((b) => {
          const win = PICKUP_WINDOWS.find((w) => w.id === b.pickupWindow);
          return `<div class="card">
  <div class="row"><strong>${esc(b.vehicle)}</strong><span class="ref">${esc(b.ref)}</span></div>
  <div class="meta">${esc(b.contactName)} · <a href="tel:${esc(b.contactPhone)}">${esc(b.contactPhone)}</a>${
    b.contactEmail ? ` · <a href="mailto:${esc(b.contactEmail)}">${esc(b.contactEmail)}</a>` : ""
  }</div>
  <div class="meta">${esc(b.pickupAddress)}, ${esc(b.suburb)} ${esc(b.postcode)}</div>
  <div class="meta"><strong>${esc(b.pickupDate)}</strong> · ${esc(win?.detail ?? b.pickupWindow)}</div>
  <div class="meta">Work: ${esc(serviceLabels(b.services ?? []).join(", "))}</div>
  ${b.concern ? `<div class="note">&ldquo;${esc(b.concern)}&rdquo;</div>` : ""}
</div>`;
        })
        .join("")
}

<h2>Waitlist — where to open next</h2>
${
  topDemand.length === 0
    ? `<p class="empty">Nobody out of area yet.</p>`
    : `<div>${topDemand
        .map(([k, n]) => `<span class="pill">${esc(k)} — ${n}</span>`)
        .join("")}</div>
<div style="margin-top:12px">${waitlist
        .map(
          (w) =>
            `<div class="card"><div class="row"><span>${esc(w.email)}</span><span class="ref">${esc(
              w.suburb ?? w.postcode,
            )}</span></div>${w.vehicle ? `<div class="meta">${esc(w.vehicle)}</div>` : ""}</div>`,
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
