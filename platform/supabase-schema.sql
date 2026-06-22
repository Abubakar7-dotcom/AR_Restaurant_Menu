-- AR Restaurant Menu — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL editor → New query)

-- Restaurants table
create table public.restaurants (
  id                  uuid primary key default gen_random_uuid(),
  owner_user_id       uuid references auth.users(id) on delete set null,
  name                text not null,
  slug                text not null unique,
  subscription_status text not null default 'inactive'
                        check (subscription_status in ('inactive', 'active', 'lapsed')),
  created_at          timestamptz not null default now()
);

-- Dishes table
create table public.dishes (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name          text not null,
  description   text,
  price         numeric(10, 2),
  category      text,
  sort_order    int not null default 0,
  status        text not null default 'uploaded'
                  check (status in ('uploaded','under_review','approved','rejected','processing','complete','failed')),
  video_url     text,
  glb_url       text,
  rejection_note text,
  created_at    timestamptz not null default now()
);

-- Indexes
create index dishes_restaurant_id_idx on public.dishes(restaurant_id);
create index dishes_status_idx on public.dishes(status);

-- Row Level Security
alter table public.restaurants enable row level security;
alter table public.dishes enable row level security;

-- Restaurants: owner can read/update their own restaurant
create policy "Owner can read own restaurant"
  on public.restaurants for select
  using (owner_user_id = auth.uid());

create policy "Owner can update own restaurant"
  on public.restaurants for update
  using (owner_user_id = auth.uid());

-- Restaurants: anyone can read a restaurant by slug (needed for /menu/[slug])
create policy "Public can read restaurants"
  on public.restaurants for select
  using (true);

-- Dishes: anyone can read complete dishes (needed for the public menu page)
create policy "Public can read complete dishes"
  on public.dishes for select
  using (status = 'complete');

-- Dishes: owner can read all their restaurant's dishes (dashboard)
create policy "Owner can read own dishes"
  on public.dishes for select
  using (
    restaurant_id in (
      select id from public.restaurants where owner_user_id = auth.uid()
    )
  );

-- Dishes: owner can insert new dishes
create policy "Owner can insert dishes"
  on public.dishes for insert
  with check (
    restaurant_id in (
      select id from public.restaurants where owner_user_id = auth.uid()
    )
  );

-- Dishes: owner can update their own dishes (e.g. re-upload)
create policy "Owner can update own dishes"
  on public.dishes for update
  using (
    restaurant_id in (
      select id from public.restaurants where owner_user_id = auth.uid()
    )
  );

-- Storage bucket for dish videos (run separately in Storage settings or via this SQL)
-- Note: create the 'dish-videos' bucket in Supabase Dashboard → Storage → New bucket
-- Set it to PUBLIC so the video_url can be embedded in the review page
