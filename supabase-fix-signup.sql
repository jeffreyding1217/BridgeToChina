-- Bridge to China — FIX for: 'new row violates row-level security policy for table "profiles"'
-- Run this ONCE in Supabase → SQL Editor → New query → paste → Run.
-- (It is safe to run again; it only replaces itself.)
--
-- Why: with "Confirm email" on, a new person isn't logged in yet, so the website
-- isn't allowed to create their profile. This makes the DATABASE create the
-- profile (and the empty application) automatically when an account is created.
-- Only 'volunteer' or 'student' can ever be assigned here — never admin.

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r text;
  n text;
  first_n text;
  last_n text;
begin
  r := coalesce(new.raw_user_meta_data->>'role', 'volunteer');
  if r not in ('volunteer', 'student') then r := 'volunteer'; end if;

  n := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1));
  first_n := split_part(n, ' ', 1);
  last_n := nullif(trim(substr(n, length(first_n) + 1)), '');

  insert into public.profiles (id, full_name, role)
  values (new.id, n, r)
  on conflict (id) do nothing;

  if r = 'student' then
    insert into public.student_applications (id, first_name, last_name)
    values (new.id, first_n, last_n)
    on conflict (id) do nothing;
  else
    insert into public.applications (id, first_name, last_name)
    values (new.id, first_n, last_n)
    on conflict (id) do nothing;
  end if;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
