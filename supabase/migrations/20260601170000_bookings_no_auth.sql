-- ============================================================
-- Migration: Bookings without authentication
-- Purpose: Replace user_id-based bookings with anonymous bookings
--          containing name, email, phone directly on the record.
--          Email confirmations sent via Supabase or external service.
-- ============================================================

-- 1. Add guest fields to bookings table
alter table public.bookings
  add column if not exists guest_name  text,
  add column if not exists guest_email text,
  add column if not exists guest_phone text;

-- 2. Make user_id nullable (was required before)
alter table public.bookings
  alter column user_id drop not null;

-- 3. Allow anonymous inserts (no auth required)
create policy "Anyone can create a booking"
  on public.bookings for insert
  to anon, authenticated
  with check ( true );

-- 4. Update booked_slots view (already exists, no change needed)
-- View already filters cancelled bookings correctly

-- 5. Index on guest_email for admin lookups
create index if not exists idx_bookings_guest_email
  on public.bookings (guest_email);
