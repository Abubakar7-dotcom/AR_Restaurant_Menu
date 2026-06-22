import { createClient } from './supabase/server'
import { demoRestaurant, demoDishes } from './demo-data'
import { Restaurant, Dish } from '@/types'

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  if (!isSupabaseConfigured) {
    return slug === demoRestaurant.slug ? demoRestaurant : null
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single()

  return data ?? null
}

export async function getDishesByRestaurant(restaurantId: string): Promise<Dish[]> {
  if (!isSupabaseConfigured) {
    return demoDishes.filter(d => d.status === 'complete')
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('dishes')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('status', 'complete')
    .order('sort_order')

  return data ?? []
}

export async function getAllDishesForReview(): Promise<Dish[]> {
  if (!isSupabaseConfigured) return demoDishes

  const supabase = await createClient()
  const { data } = await supabase
    .from('dishes')
    .select('*, restaurants(name, slug)')
    .eq('status', 'under_review')
    .order('created_at')

  return data ?? []
}
