-- Too Easy — Postgres schema (Supabase)
-- Safe to run more than once.

create extension if not exists "pgcrypto";

-- ── people ───────────────────────────────────────────────────
-- Auth is handled by the app (scrypt + session cookies) rather than
-- Supabase Auth, so the password hash lives here.
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  name          text not null,
  phone         text,
  role          text not null default 'customer'
                check (role in ('admin','customer','driver','mechanic')),
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  created_by    uuid references public.users(id) on delete set null
);

create table if not exists public.sessions (
  token      text primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_idx on public.sessions (user_id);

-- ── bookings ─────────────────────────────────────────────────
create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  ref            text not null unique,
  user_id        uuid references public.users(id) on delete set null,
  driver_id      uuid references public.users(id) on delete set null,

  -- Which service line. 'mechanic' is the only one live; designated driver,
  -- delivery and the rest will share this table.
  category       text not null default 'mechanic',
  status         text not null default 'requested',

  contact_name   text not null,
  contact_phone  text not null,
  contact_email  text,

  vehicle        text not null,
  services       text[] not null default '{}',
  concern        text,

  pickup_address text not null,
  suburb         text not null,
  postcode       text not null,
  pickup_date    date not null,
  pickup_window  text not null,
  key_handoff    text not null default 'in_person',

  -- Stops a double-tap or a retry creating two jobs.
  request_id     text unique,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists bookings_user_idx   on public.bookings (user_id, created_at desc);
create index if not exists bookings_status_idx on public.bookings (category, status, pickup_date);
create index if not exists bookings_driver_idx on public.bookings (driver_id, pickup_date);

create table if not exists public.booking_events (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  status     text not null,
  note       text,
  actor_id   uuid references public.users(id) on delete set null,
  actor_role text,
  created_at timestamptz not null default now()
);

create index if not exists booking_events_idx on public.booking_events (booking_id, created_at);

-- ── out-of-area demand ───────────────────────────────────────
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  name       text,
  suburb     text,
  postcode   text not null,
  vehicle    text,
  category   text not null default 'mechanic',
  created_at timestamptz not null default now()
);

create index if not exists waitlist_suburb_idx on public.waitlist (suburb, postcode);

-- ── access ───────────────────────────────────────────────────
-- Every query runs server-side over a privileged connection; the browser is
-- never given a database credential. RLS is enabled with no permissive
-- policies so that the public anon key cannot read these tables through
-- PostgREST even if it leaks.
alter table public.users          enable row level security;
alter table public.sessions       enable row level security;
alter table public.bookings       enable row level security;
alter table public.booking_events enable row level security;
alter table public.waitlist       enable row level security;
