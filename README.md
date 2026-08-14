# Too Easy

Car service pickup and return. A customer books, a driver collects the car from
their driveway, a partner shop does the work, and the driver brings it back.

**Live:** https://tooeasy-pickup.netlify.app

---

## Two versions of this app

| Branch     | What it is                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| `master`   | **Deployed.** Static export + Netlify Functions. No login. Marketing site, booking capture, waitlist, interim ops view. |
| `ssr-full` | Full SSR app: Google sign-in, Postgres, customer tracking, driver / shop / ops consoles, estimate approval. Not deployed yet. |

`master` exists because Netlify's zip/API deploy path can't run the Next.js SSR
runtime on this account — it isn't injected automatically, and declaring
`@netlify/plugin-nextjs` fails the build with exit code 2. That reproduces with
a four-file hello-world Next app, so it isn't specific to this project.

To ship `ssr-full`, push it to GitHub and connect the repo in Netlify
(**Add new site → Import an existing project**). Git-connected deploys get the
Next runtime automatically. Everything in it is written and builds clean; it
needs Google OAuth credentials and a git-connected deploy, nothing more.

---

## Running locally

```bash
npm install
npm run dev
```

The API runs as Netlify Functions, so `npm run dev` alone won't serve
`/api/*`. For the full stack locally use `netlify dev` (requires
`netlify login`).

---

## Architecture (master)

```
src/
  app/
    page.tsx                 marketing site (static)
    book/page.tsx            4-step booking flow (static shell, client form)
  components/                Logo, ZipCheck, Faq, BookingForm
  lib/
    geo.ts                   ZIP centroids, haversine, GARAGE constant
    services.ts              service catalogue, pickup windows, key handoff
netlify/functions/
  coverage.mts               POST /api/coverage   — is this ZIP in range?
  bookings.mts               POST /api/bookings   — create a booking
  waitlist.mts               POST /api/waitlist   — out-of-area capture
  ops.mts                    GET  /api/ops        — interim ops view
```

Bookings and waitlist entries are stored in **Netlify Blobs** — no database to
provision. Booking keys are `YYYY-MM-DD/TE-XXXXX` so they sort chronologically;
waitlist keys are ZIP-prefixed so they group by area.

### Service area

`GARAGE` in [`src/lib/geo.ts`](src/lib/geo.ts) holds the launch shop's
coordinates and a `radius_km` of 10. Coverage is a haversine check against ZIP
centroids. In range today:

`60061` Vernon Hills · `60048` Libertyville · `60060` Mundelein ·
`60069` Lincolnshire · `60089` Buffalo Grove · `60047` Hawthorn Woods ·
`60045` Lake Forest

Everything else is offered the waitlist, which is how you learn where to open
next. Widening the radius is a one-line change in `geo.ts`.

---

## Seeing your bookings

`/api/ops` is gated on a shared secret and returns 404 without it. **You need to
set this once** — the Netlify MCP could not write environment variables
reliably, so it has to be done in the UI:

1. Netlify → **tooeasy-pickup → Site configuration → Environment variables**
2. Add `OPS_KEY` with any long random value
3. **Deploys → Trigger deploy** so the function picks it up

Then visit `https://tooeasy-pickup.netlify.app/api/ops?key=YOUR_KEY`
(add `&format=json` for raw data).

It shows every booking with name, phone, email, address, requested work and the
customer's own description, plus the waitlist grouped by ZIP.

> There are two test bookings and one test waitlist entry in the store from
> deployment checks — "Test Booking" and "Live Check". Ignore or delete them.

---

## Not built yet

- **Google sign-in** — written on `ssr-full`, needs OAuth credentials.
- **Notifications** — nothing emails or texts you when a booking lands. Until
  that exists, check `/api/ops`. This is the first thing to add.
- **Driver / shop consoles and estimate approval** — on `ssr-full`.
- **Photo condition report at handover** — schema exists on `ssr-full`, capture
  UI does not. Build before the first real pickup.

## Netlify sites

- `tooeasy-pickup` — live, working.
- `tooeasy-pickup-legacy` — the original site. Its build settings are stuck in a
  state that fails every deploy; kept only so the name isn't recycled. Safe to
  delete.
