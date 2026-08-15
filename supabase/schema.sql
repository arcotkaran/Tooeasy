-- Too Easy — Supabase schema
-- Run once in the Supabase SQL editor.

create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  ref              text unique not null,
  user_id          uuid not null references auth.users (id) on delete cascade,

  -- Which service line this booking belongs to. 'mechanic' is the only one
  -- live today; designated driver, delivery and the rest share this table.
  category         text not null default 'mechanic',
  status           text not null default 'requested',

  contact_name     text not null,
  contact_phone    text not null,
  contact_email    text not null,

  vehicle_year     text,
  vehicle_make     text not null,
  vehicle_model    text not null,
  vehicle_rego     text,
  vehicle_odometer text,

  services         text[] not null default '{}',
  concern          text,

  pickup_address   text not null,
  pickup_postcode  text not null,
  pickup_date      date not null,
  pickup_window    text not null,
  key_handoff      text not null default 'in_person',

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists bookings_user_idx
  on public.bookings (user_id, created_at desc);
create index if not exists bookings_status_idx
  on public.bookings (category, status, pickup_date);

alter table public.bookings enable row level security;

-- A signed-in customer can create and read their own bookings, and cancel one
-- that hasn't been collected yet. Staff access comes later, via a role claim.
create policy "own bookings readable"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "own bookings insertable"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "own bookings updatable"
  on public.bookings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Out-of-area demand. Anyone may add a row; nobody may read it back from the
-- browser, so the list can't be scraped.
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  name       text,
  postcode   text not null,
  vehicle    text,
  category   text not null default 'mechanic',
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

create policy "anyone can join the waitlist"
  on public.waitlist for insert
  with check (true);
