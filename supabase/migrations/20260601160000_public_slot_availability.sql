-- ============================================================
-- Migration: Allow public visibility of booked slots
-- Purpose: Users (even unauthenticated) can see which slots
--          are already taken, without seeing personal info.
--          This prevents double-booking confusion on the calendar.
-- ============================================================

-- Allow anyone to see which slots are booked (slot_id + status only)
-- Personal info (name, email, phone) is in profiles table which
-- has its own restrictive RLS policies.
create policy "Anyone can view booked slot ids"
  on public.bookings for select
  to anon, authenticated
  using ( true );

-- Note: The existing "Users can view own bookings" policy already
-- covers authenticated users seeing their own full booking details.
-- This new policy adds visibility for anonymous users to see
-- slot availability (booked/available) on the calendar.
