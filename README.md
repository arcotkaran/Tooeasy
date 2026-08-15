# Too Easy

Car service pickup and return around **Parramatta, NSW**. A customer requests a
pickup, an admin books the slot with the workshop, a driver collects the car,
the mechanic rings the customer directly about the work, and the driver brings
it back.

Too Easy is the booking and transport channel. It does not quote prices and
does not sit between the customer and the mechanic.

---

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. That's all — the database creates and seeds itself
on first request.

### The offline database

SQLite through Node's built-in `node:sqlite` driver. No Docker, no service to
start, no native modules. The file lives at `.data/tooeasy.db` (gitignored).

Schema and table names deliberately mirror `supabase/schema.sql`, so moving to
Supabase later is a connection change and a data copy — not a rewrite.

To start completely fresh:

```bash
rm -rf .data
```

---

## Test accounts

Seeded automatically on an empty database. **These are development credentials
on a local file database — change them before anything goes near the internet.**

| Role     | Email                   | Password            | Lands on     |
| -------- | ----------------------- | ------------------- | ------------ |
| Admin    | `admin@tooeasy.test`    | `TooEasyAdmin!2026` | `/admin`     |
| Customer | `customer@tooeasy.test` | `TooEasyUser!2026`  | `/dashboard` |
| Driver   | `driver@tooeasy.test`   | `TooEasyDriver!2026`| `/driver`    |
| Mechanic | `mechanic@tooeasy.test` | `TooEasyMech!2026`  | `/garage`    |

Passwords are scrypt-hashed with a per-user salt. Sessions are httpOnly
cookies backed by a `sessions` table, valid 30 days.

---

## Roles and how accounts are made

| Role     | How the account is created                        |
| -------- | ------------------------------------------------- |
| Customer | Self sign-up at `/signup`                          |
| Driver   | Created by an admin in `/admin` — invite only      |
| Mechanic | Created by an admin in `/admin`                    |
| Admin    | Created by another admin, or seeded                |

`/signup` can only ever create a customer. Staff roles are not selectable
there — an admin creates them and hands over the credentials directly.

Each console is role-guarded server-side: a customer hitting `/admin` is
redirected, and a driver can only change a job assigned to them.

---

## The pages

```
/                 marketing site, suburb search, coverage map
/book             3-step booking (open to guests; prefilled when signed in)
/signup           customer creates their own profile
/login            everyone signs in here, then lands on their console
/dashboard        customer: bookings + live tracker + history + cancel
/driver           driver: assigned jobs, call/navigate, status buttons
/garage           mechanic: workshop queue, "ring the customer" prompt
/admin            ops: bookings, assign drivers, manage people, waitlist
```

## Booking lifecycle

`requested → confirmed → driver_assigned → en_route_pickup → picked_up →
at_workshop → in_service → ready → en_route_return → delivered`, plus
`cancelled`.

Every transition is checked against the actor's role in `src/lib/status.ts` and
appended to `booking_events`, which is what the customer's history shows.

---

## Layout

```
src/
  server/          database, auth, bookings — server-only
    db.ts          SQLite connection, schema, seed accounts
    auth.ts        sessions, users, role helpers
    password.ts    scrypt hash/verify
    bookings.ts    booking + event queries
  app/
    actions.ts     all server actions (sign in/up, staff, status, booking)
  lib/
    geo.ts         suburb list, coverage
    services.ts    service catalogue, pickup windows
    status.ts      lifecycle + who may set what
supabase/
  schema.sql       the Postgres target for when you move off SQLite
```

---

## Not built yet

- **Notifications.** Nothing texts or emails anyone. Every "we'll text you" on
  the site is currently a promise the system can't keep. This is the first gap
  to close.
- **Photo condition report** at handover.
- **Deployment.** The app needs a Node server now, so the previous static
  Netlify setup no longer applies.
- **Google sign-in.** Deliberately skipped; email + password instead.
