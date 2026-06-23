-- AR Restaurant Menu — auto-create restaurant on signup
-- Run this in the Supabase SQL editor AFTER supabase-schema.sql
--
-- This makes a restaurant row appear automatically the instant a user signs up,
-- using the restaurant_name passed in the signup metadata. Runs with
-- SECURITY DEFINER so it bypasses RLS (the row is created server-side, atomically).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug  text;
  final_slug text;
  suffix     int := 0;
  display_name text;
begin
  display_name := coalesce(nullif(trim(new.raw_user_meta_data->>'restaurant_name'), ''), 'My Restaurant');

  -- Build a URL-safe slug from the restaurant name
  base_slug := regexp_replace(lower(display_name), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then
    base_slug := 'restaurant';
  end if;

  -- Ensure the slug is unique (append -1, -2, … on collision)
  final_slug := base_slug;
  while exists (select 1 from public.restaurants where slug = final_slug) loop
    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix;
  end loop;

  insert into public.restaurants (owner_user_id, name, slug, subscription_status)
  values (new.id, display_name, final_slug, 'inactive');

  return new;
end;
$$;

-- Fire the function after every new auth user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
