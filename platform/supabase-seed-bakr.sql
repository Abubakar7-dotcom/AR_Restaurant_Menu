-- AR Restaurant Menu — seed demo dishes into bakr@gmail.com's restaurant
-- Run this in the Supabase SQL editor.
-- It points each dish at an already-rescaled .glb in platform/public/models/.
-- Safe to re-run: it deletes this restaurant's existing seeded dishes first.

with target as (
  select r.id as restaurant_id
  from public.restaurants r
  join auth.users u on u.id = r.owner_user_id
  where u.email = 'bakr@gmail.com'
  limit 1
)
-- Remove previously seeded dishes for a clean re-run
, cleared as (
  delete from public.dishes
  where restaurant_id = (select restaurant_id from target)
  returning 1
)
insert into public.dishes
  (restaurant_id, name, description, price, category, sort_order, status, glb_url)
select
  t.restaurant_id, d.name, d.description, d.price, d.category, d.sort_order, 'complete', d.glb_url
from target t
cross join (values
  ('Classic Burger',      'Juicy beef patty with lettuce, tomato, and special sauce', 850,  'Burgers',   1,  '/models/Burger.glb'),
  ('Cheeseburger',        'Classic burger topped with melted cheddar cheese',         950,  'Burgers',   2,  '/models/Cheeseburger.glb'),
  ('Double Cheeseburger', 'Two beef patties, double the cheese',                      1150, 'Burgers',   3,  '/models/Double Cheeseburger.glb'),
  ('Margherita Pizza',    'Stone-baked pizza with tomato sauce and fresh mozzarella', 1200, 'Pizza',     4,  '/models/Pizza.glb'),
  ('Crispy Fries',        'Golden crispy fries seasoned with sea salt',               350,  'Sides',     5,  '/models/Fries.glb'),
  ('Grilled Steak',       'Premium cut grilled to perfection',                        2500, 'Mains',     6,  '/models/Steak.glb'),
  ('Chicken Leg',         'Tender roasted chicken leg with herbs',                    700,  'Mains',     7,  '/models/Chicken Leg.glb'),
  ('Hotdog',              'Classic hotdog in a soft bun with mustard and ketchup',    450,  'Snacks',    8,  '/models/Hotdog.glb'),
  ('Sushi',               'Fresh sushi with premium ingredients',                     1500, 'Japanese',  9,  '/models/Sushi.glb'),
  ('Pancakes Stack',      'Fluffy pancakes stacked high with maple syrup',            600,  'Breakfast', 10, '/models/Pancakes Stack.glb'),
  ('Ice Cream',           'Creamy vanilla ice cream with chocolate drizzle',          400,  'Desserts',  11, '/models/Ice Cream.glb'),
  ('Donut',               'Glazed donut with rainbow sprinkles',                      250,  'Desserts',  12, '/models/Donut.glb')
) as d(name, description, price, category, sort_order, glb_url);

-- Optional: make this restaurant's menu publicly live (not 'lapsed')
update public.restaurants
set subscription_status = 'active'
where owner_user_id = (select id from auth.users where email = 'bakr@gmail.com');
