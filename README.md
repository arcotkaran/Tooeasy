# Too Easy

Car service pickup and return. A customer books, a driver collects the car from
their driveway, a partner shop does the work, the customer approves the estimate
from their phone, and the same driver brings the car home.

Stack: Next.js 15 (App Router) · Auth.js v5 with Google · Netlify DB (Postgres)
· Tailwind v4 · deployed on Netlify.

---

## Running locally

```bash
npm install
```

Create `.env.local`:

```bash
AUTH_SECRET=            # npx auth secret
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
ADMIN_EMAILS=you@gmail.com
DRIVER_EMAILS=
MECHANIC_EMAILS=
```

Then:

```bash
npm run dev
```

The marketing site, ZIP coverage check and waitlist work without a database.
Booking and the three consoles need one (see below).

---

## Google sign-in setup

Auth.js is wired up but needs credentials you have to create yourself:

1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID**
2. Application type: **Web application**
3. Authorised JavaScript origins:
   - `http://localhost:3000`
   - `https://YOUR-SITE.netlify.app`
4. Authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-SITE.netlify.app/api/auth/callback/google`
5. Put the client ID and secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`,
   locally and in Netlify's environment variables.

Until those exist the login page explains that sign-in isn't configured rather
than erroring.

## Staff roles

There's no user-admin screen yet — roles come from comma-separated email
allowlists in the environment:

| Variable          | Grants access to           |
| ----------------- | -------------------------- |
| `ADMIN_EMAILS`    | `/admin` (ops), everything |
| `DRIVER_EMAILS`   | `/driver`                  |
| `MECHANIC_EMAILS` | `/garage`                  |

The role is applied the first time that Google account signs in. The allowlist
can promote someone but never demotes an account that was promoted before.

---

## Database

`@netlify/database` provisions Postgres automatically — there is no connection
string to manage. Schema lives in `netlify/database/migrations/`, applied by
Netlify on deploy.

Every database call is wrapped so that if the database isn't reachable the
marketing site still renders. Provisioning happens on the first successful
build or `netlify dev` run.

The seeded `garages` row sets the pickup radius. `radius_km` defaults to 10 and
is read at request time, so widening coverage is a database update, not a
deploy.

---

## Deploying

Netlify's **zip/API deploy path does not build Next.js apps** on this account —
the Next.js runtime isn't injected, and declaring `@netlify/plugin-nextjs`
explicitly fails the build with exit code 2. This reproduces with a four-file
hello-world Next app, so it isn't specific to this project.

Use a **git-connected deploy** instead, which is the supported path:

1. Push this repo to GitHub.
2. Netlify → **Add new site → Import an existing project** → pick the repo.
3. Leave the build settings alone — Netlify detects Next.js and configures
   itself. `netlify.toml` only pins the Node version.
4. Add `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` and the role
   allowlists under **Site configuration → Environment variables**.

---

## Layout

```
src/
  app/
    page.tsx                     marketing site
    login/                       Google sign-in
    book/                        4-step booking flow (auth required)
    booking/[id]/                tracking, estimate approval, timeline
    dashboard/                   customer's bookings
    driver/                      driver job queue
    garage/                      shop queue + estimate builder
    admin/                       ops: assign drivers, demand stats
    api/
      coverage/                  ZIP service-area check
      waitlist/                  out-of-area capture
      bookings/                  create; status, assign, quote per booking
      quotes/[id]/decision/      customer approve / decline
  lib/
    geo.ts                       ZIP centroids + haversine radius check
    services.ts                  service catalogue, windows, key handoff
    status.ts                    booking lifecycle + who may set what
    bookings.ts                  queries, access control, event log
netlify/database/migrations/     SQL schema
```

## Booking lifecycle

`requested → confirmed → driver_assigned → en_route_pickup → picked_up →
at_garage → quote_pending → quote_approved → in_service → ready →
en_route_return → delivered`, plus `cancelled`.

Each transition is checked against the actor's role in `lib/status.ts` and
appended to `booking_events`, which is what the customer's tracker renders.
Only the vehicle's owner can approve an estimate — not ops, not the shop.
