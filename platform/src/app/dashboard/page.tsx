import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_user_id', user.id)
    .single()

  if (!restaurant) redirect('/login')

  const { data: dishes } = await supabase
    .from('dishes')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })

  return (
    <DashboardClient
      restaurant={restaurant}
      initialDishes={dishes ?? []}
    />
  )
}
