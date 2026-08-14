-- Too Easy — initial schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  image       TEXT,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS garages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT,
  city        TEXT,
  state       TEXT,
  zip         TEXT,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  radius_km   DOUBLE PRECISION NOT NULL DEFAULT 10,
  daily_slots INT NOT NULL DEFAULT 6,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref             TEXT UNIQUE NOT NULL,
  customer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  garage_id       UUID REFERENCES garages(id) ON DELETE SET NULL,
  driver_id       UUID REFERENCES users(id) ON DELETE SET NULL,

  -- contact
  contact_name    TEXT NOT NULL,
  contact_phone   TEXT NOT NULL,

  -- vehicle (denormalised: one car per booking)
  vehicle_year    TEXT,
  vehicle_make    TEXT,
  vehicle_model   TEXT,
  vehicle_plate   TEXT,
  vehicle_mileage TEXT,

  -- what they want done
  services        TEXT[] NOT NULL DEFAULT '{}',
  concern         TEXT,

  -- where + when
  pickup_address  TEXT NOT NULL,
  pickup_zip      TEXT NOT NULL,
  pickup_date     DATE NOT NULL,
  pickup_window   TEXT NOT NULL,
  key_handoff     TEXT NOT NULL DEFAULT 'in_person',

  status          TEXT NOT NULL DEFAULT 'requested',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bookings_customer_idx ON bookings (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_status_idx   ON bookings (status, pickup_date);
CREATE INDEX IF NOT EXISTS bookings_driver_idx   ON bookings (driver_id, pickup_date);

-- Append-only timeline. Powers the customer tracking page.
CREATE TABLE IF NOT EXISTS booking_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  note        TEXT,
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS booking_events_idx ON booking_events (booking_id, created_at);

-- Mechanic finds extra work -> customer approves from their phone.
CREATE TABLE IF NOT EXISTS quotes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  items         JSONB NOT NULL DEFAULT '[]',
  total_cents   INT NOT NULL DEFAULT 0,
  eta_note      TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS quotes_booking_idx ON quotes (booking_id, created_at DESC);

-- Condition report at handoff. This is the dispute shield.
CREATE TABLE IF NOT EXISTS inspections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  phase       TEXT NOT NULL,
  photo_url   TEXT NOT NULL,
  label       TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inspections_booking_idx ON inspections (booking_id, phase);

-- Out-of-area requests. Tells us where to open next.
CREATE TABLE IF NOT EXISTS waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT,
  name        TEXT,
  zip         TEXT NOT NULL,
  vehicle     TEXT,
  services    TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS waitlist_zip_idx ON waitlist (zip);

-- Launch partner garage. Coordinates are the service-radius centre.
INSERT INTO garages (name, address, city, state, zip, lat, lng, radius_km, daily_slots)
SELECT 'Partner Garage 01', '', 'Vernon Hills', 'IL', '60061', 42.2306, -87.9640, 10, 6
WHERE NOT EXISTS (SELECT 1 FROM garages);
