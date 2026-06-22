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
  video_url: string | null
  rejection_note: string | null
  created_at: string
}

export interface Restaurant {
  id: string
  owner_user_id: string | null
  slug: string
  name: string
  subscription_status: 'inactive' | 'active' | 'lapsed'
}
