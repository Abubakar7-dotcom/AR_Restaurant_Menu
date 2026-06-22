import { Dish, Restaurant } from '@/types'

export const demoRestaurant: Restaurant = {
  id: 'demo-001',
  owner_user_id: null,
  slug: 'demo-restaurant',
  name: "Abubakar's Kitchen",
  subscription_status: 'active',
}

const base = { video_url: null, rejection_note: null, restaurant_id: 'demo-001', status: 'complete' as const, created_at: new Date().toISOString() }

export const demoDishes: Dish[] = [
  { ...base, id: '1', name: 'Classic Burger', description: 'Juicy beef patty with lettuce, tomato, and special sauce', price: 850, category: 'Burgers', sort_order: 1, glb_url: '/models/Burger.glb' },
  { ...base, id: '2', name: 'Cheeseburger', description: 'Classic burger topped with melted cheddar cheese', price: 950, category: 'Burgers', sort_order: 2, glb_url: '/models/Cheeseburger.glb' },
  { ...base, id: '3', name: 'Double Cheeseburger', description: 'Two beef patties, double the cheese', price: 1150, category: 'Burgers', sort_order: 3, glb_url: '/models/Double Cheeseburger.glb' },
  { ...base, id: '4', name: 'Margherita Pizza', description: 'Stone-baked pizza with tomato sauce and fresh mozzarella', price: 1200, category: 'Pizza', sort_order: 4, glb_url: '/models/Pizza.glb' },
  { ...base, id: '5', name: 'Crispy Fries', description: 'Golden crispy fries seasoned with sea salt', price: 350, category: 'Sides', sort_order: 5, glb_url: '/models/Fries.glb' },
  { ...base, id: '6', name: 'Grilled Steak', description: 'Premium cut grilled to perfection', price: 2500, category: 'Mains', sort_order: 6, glb_url: '/models/Steak.glb' },
  { ...base, id: '7', name: 'Chicken Leg', description: 'Tender roasted chicken leg with herbs', price: 700, category: 'Mains', sort_order: 7, glb_url: '/models/Chicken Leg.glb' },
  { ...base, id: '8', name: 'Hotdog', description: 'Classic hotdog in a soft bun with mustard and ketchup', price: 450, category: 'Snacks', sort_order: 8, glb_url: '/models/Hotdog.glb' },
  { ...base, id: '9', name: 'Sushi', description: 'Fresh sushi with premium ingredients', price: 1500, category: 'Japanese', sort_order: 9, glb_url: '/models/Sushi.glb' },
  { ...base, id: '10', name: 'Pancakes Stack', description: 'Fluffy pancakes stacked high with maple syrup', price: 600, category: 'Breakfast', sort_order: 10, glb_url: '/models/Pancakes Stack.glb' },
  { ...base, id: '11', name: 'Ice Cream', description: 'Creamy vanilla ice cream with chocolate drizzle', price: 400, category: 'Desserts', sort_order: 11, glb_url: '/models/Ice Cream.glb' },
  { ...base, id: '12', name: 'Donut', description: 'Glazed donut with rainbow sprinkles', price: 250, category: 'Desserts', sort_order: 12, glb_url: '/models/Donut.glb' },
]
