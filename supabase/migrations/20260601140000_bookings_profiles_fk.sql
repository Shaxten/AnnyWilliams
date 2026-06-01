-- ============================================================
-- Migration: Add foreign key from bookings to profiles
-- Purpose: Allow Supabase to resolve the join between
--          bookings and profiles in the schema cache
-- ============================================================

-- bookings.user_id already references auth.users(id)
-- profiles.id also references auth.users(id)
-- We add a direct FK from bookings.user_id to profiles.id
-- so PostgREST can resolve the relationship automatically

alter table public.bookings
  add constraint bookings_user_id_profiles_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;
