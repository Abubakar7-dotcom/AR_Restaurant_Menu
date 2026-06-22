'use client'

import { useState } from 'react'

interface DishWithRestaurant {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  video_url: string | null
  created_at: string
  restaurants: { name: string; slug: string } | null
}

interface Props {
  dishes: DishWithRestaurant[]
  secret: string
}

export default function ReviewClient({ dishes: initialDishes, secret }: Props) {
  const [dishes, setDishes] = useState(initialDishes)
  const [rejectionNote, setRejectionNote] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  async function updateStatus(dishId: string, status: 'approved' | 'rejected') {
    setLoading(prev => ({ ...prev, [dishId]: true }))

    await fetch('/api/admin/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        dishId,
        status,
        note: rejectionNote[dishId] ?? '',
      }),
    })

    setDishes(prev => prev.filter(d => d.id !== dishId))
    setLoading(prev => ({ ...prev, [dishId]: false }))
  }

  if (dishes.length === 0) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center text-center px-4">
        <div>
          <div className="text-4xl mb-3">✅</div>
          <h1 className="text-white text-lg font-bold mb-1">All clear</h1>
          <p className="text-gray-400 text-sm">No dishes waiting for review.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-xl font-bold">Review queue</h1>
          <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
            {dishes.length}
          </span>
        </div>

        <div className="space-y-4">
          {dishes.map(dish => (
            <div key={dish.id} className="bg-gray-900 rounded-xl overflow-hidden">
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between"
                onClick={() => setExpanded(prev => (prev === dish.id ? null : dish.id))}
              >
                <div>
                  <p className="font-semibold">{dish.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {dish.restaurants?.name ?? 'Unknown restaurant'} · Rs {dish.price}
                  </p>
                </div>
                <span className="text-gray-500 text-sm">{expanded === dish.id ? '▲' : '▼'}</span>
              </button>

              {expanded === dish.id && (
                <div className="px-5 pb-5 space-y-4 border-t border-gray-800 pt-4">
                  {dish.description && (
                    <p className="text-gray-300 text-sm">{dish.description}</p>
                  )}

                  {dish.video_url && (
                    <video
                      src={dish.video_url}
                      controls
                      className="w-full rounded-lg max-h-64 bg-black"
                    />
                  )}

                  <div>
                    <label className="block text-gray-400 text-xs mb-1">
                      Rejection note (required if rejecting)
                    </label>
                    <textarea
                      rows={2}
                      value={rejectionNote[dish.id] ?? ''}
                      onChange={e =>
                        setRejectionNote(prev => ({ ...prev, [dish.id]: e.target.value }))
                      }
                      className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-orange-500 resize-none"
                      placeholder="e.g. Video too shaky — please reshoot on a flat surface"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => updateStatus(dish.id, 'approved')}
                      disabled={loading[dish.id]}
                      className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
                    >
                      {loading[dish.id] ? '…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => updateStatus(dish.id, 'rejected')}
                      disabled={loading[dish.id]}
                      className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
                    >
                      {loading[dish.id] ? '…' : 'Reject'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
