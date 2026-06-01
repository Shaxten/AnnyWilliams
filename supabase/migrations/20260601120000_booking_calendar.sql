-- ============================================================
-- Migration: Booking Calendar System
-- Purpose: Tables for availability slots, bookings, and user profiles
-- Tables: profiles, availability_slots, bookings
-- ============================================================

-- ── PROFILES ─────────────────────────────────────────────────
-- Stores public user info linked to auth.users
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  created_at  timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = id );

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ( (select auth.uid()) = id );

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- ── AVAILABILITY SLOTS ────────────────────────────────────────
-- Plages horaires définies par l'admin (Anny)
-- is_available = true → slot libre, false → bloqué par l'admin
create table if not exists public.availability_slots (
  id            bigint generated always as identity primary key,
  slot_date     date not null,
  start_time    time not null,
  end_time      time not null,
  service_type  text,                    -- null = tous les services
  is_available  boolean default true not null,
  created_at    timestamptz default now() not null,
  -- Contrainte: pas deux slots identiques le même jour/heure
  unique (slot_date, start_time)
);

alter table public.availability_slots enable row level security;

-- Tout le monde peut voir les slots disponibles (pour afficher le calendrier)
create policy "Anyone can view available slots"
  on public.availability_slots for select
  to anon, authenticated
  using ( true );

-- Seul l'admin peut insérer/modifier les slots (via service_role ou dashboard)
-- Les utilisateurs normaux ne peuvent pas modifier les slots directement

-- Index pour les requêtes par date
create index if not exists idx_availability_slots_date
  on public.availability_slots (slot_date, is_available);

-- ── BOOKINGS ──────────────────────────────────────────────────
-- Réservations faites par les utilisateurs connectés
create table if not exists public.bookings (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  slot_id         bigint not null references public.availability_slots(id) on delete restrict,
  service_name    text not null,
  message         text,
  status          text default 'pending' not null
                  check (status in ('pending', 'confirmed', 'cancelled')),
  created_at      timestamptz default now() not null,
  -- Contrainte: un seul booking par slot (empêche les doubles réservations)
  unique (slot_id)
);

alter table public.bookings enable row level security;

-- Les utilisateurs authentifiés peuvent voir leurs propres réservations
create policy "Users can view own bookings"
  on public.bookings for select
  to authenticated
  using ( (select auth.uid()) = user_id );

-- Les utilisateurs authentifiés peuvent créer une réservation
create policy "Authenticated users can create bookings"
  on public.bookings for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

-- Les utilisateurs peuvent annuler leurs propres réservations (update status)
create policy "Users can update own bookings"
  on public.bookings for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

-- Index pour les requêtes par user et par slot
create index if not exists idx_bookings_user_id
  on public.bookings (user_id);

create index if not exists idx_bookings_slot_id
  on public.bookings (slot_id);

-- ── FUNCTION: auto-create profile on signup ───────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  );
  return new;
end;
$$;

-- Trigger: crée le profil automatiquement à l'inscription
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── SEED: quelques slots de démonstration ─────────────────────
-- Slots pour les 2 prochaines semaines (lundi-vendredi, 9h-17h)
insert into public.availability_slots (slot_date, start_time, end_time, service_type)
select
  d::date,
  t::time,
  (t::time + interval '1 hour')::time,
  null
from
  generate_series(
    current_date + interval '1 day',
    current_date + interval '14 days',
    interval '1 day'
  ) as d,
  unnest(array['09:00','10:00','11:00','13:00','14:00','15:00','16:00']) as t
where
  extract(dow from d) between 1 and 5  -- lundi à vendredi seulement
on conflict (slot_date, start_time) do nothing;
