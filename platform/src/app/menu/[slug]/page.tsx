import { notFound } from 'next/navigation'
import DishCard from '@/components/DishCard'
import { getRestaurantBySlug, getDishesByRestaurant } from '@/lib/db'
import { Dish } from '@/types'

interface MenuPageProps {
  params: Promise<{ slug: string }>
}

function groupByCategory(dishes: Dish[]): Record<string, Dish[]> {
  return dishes.reduce((acc, dish) => {
    const cat = dish.category ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(dish)
    return acc
  }, {} as Record<string, Dish[]>)
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { slug } = await params

  const restaurant = await getRestaurantBySlug(slug)
  if (!restaurant) notFound()

  if (restaurant.subscription_status === 'lapsed') {
    return (
      <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-white text-xl font-bold mb-2">{restaurant.name}</h1>
        <p className="text-gray-400 text-sm">
          This menu is currently unavailable. Please contact the restaurant.
        </p>
      </main>
    )
  }

  const dishes = await getDishesByRestaurant(restaurant.id)
  const grouped = groupByCategory(dishes)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg">
            {restaurant.name[0]}
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">{restaurant.name}</h1>
            <p className="text-gray-400 text-xs">Tap a dish to view it in AR on your table</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {Object.entries(grouped).map(([category, categoryDishes]) => (
          <section key={category}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">
              {category}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {categoryDishes.map(dish => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="text-center py-8 text-gray-300 text-xs">
        Powered by AR Menu
      </div>
    </main>
  )
}
