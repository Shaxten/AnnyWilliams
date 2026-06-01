-- ============================================================
-- Migration: Admin role policies
-- Purpose: Allow admin users to view and manage all bookings
--          and manage availability slots
-- ============================================================

-- Helper function: check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ── BOOKINGS: admin can see all bookings ──────────────────────
create policy "Admins can view all bookings"
  on public.bookings for select
  to authenticated
  using ( public.is_admin() );

-- Admin can update any booking (confirm / cancel)
create policy "Admins can update any booking"
  on public.bookings for update
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ── AVAILABILITY SLOTS: admin can manage slots ────────────────
create policy "Admins can insert slots"
  on public.availability_slots for insert
  to authenticated
  with check ( public.is_admin() );

create policy "Admins can update slots"
  on public.availability_slots for update
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

create policy "Admins can delete slots"
  on public.availability_slots for delete
  to authenticated
  using ( public.is_admin() );

-- ── PROFILES: admin can view all profiles ─────────────────────
create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using ( public.is_admin() );

-- Index on bookings status for admin queries
create index if not exists idx_bookings_status
  on public.bookings (status, created_at desc);
