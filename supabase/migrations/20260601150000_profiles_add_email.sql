-- ============================================================
-- Migration: Add email column to profiles
-- Purpose: Store email in profiles so admin can see it
--          without needing access to auth.users
-- ============================================================

-- Add email column
alter table public.profiles
  add column if not exists email text;

-- Backfill existing profiles from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

-- Update the trigger to also store email on new signups
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
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;
