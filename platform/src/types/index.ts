export type DishStatus =
  | 'uploaded'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'complete'
  | 'failed'

export interface Dish {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  price: number | null
  category: string | null
  sort_order: number
  status: DishStatus
  glb_url: string | null
  created_at: string
}

export interface Restaurant {
  id: string
  slug: string
  name: string
  subscription_status: 'inactive' | 'active' | 'lapsed'
}
