'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Restaurant, Dish, DishStatus } from '@/types'

const STATUS_LABELS: Record<DishStatus, string> = {
  uploaded: 'Pending review',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
  processing: 'Processing',
  complete: 'Live',
  failed: 'Failed',
}

const STATUS_COLORS: Record<DishStatus, string> = {
  uploaded: 'bg-yellow-500/10 text-yellow-400',
  under_review: 'bg-blue-500/10 text-blue-400',
  approved: 'bg-teal-500/10 text-teal-400',
  rejected: 'bg-red-500/10 text-red-400',
  processing: 'bg-purple-500/10 text-purple-400',
  complete: 'bg-green-500/10 text-green-400',
  failed: 'bg-red-500/10 text-red-400',
}

interface Props {
  restaurant: Restaurant
  initialDishes: Dish[]
}

export default function DashboardClient({ restaurant, initialDishes }: Props) {
  const router = useRouter()
  const [dishes, setDishes] = useState<Dish[]>(initialDishes)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file || !name || !price) return

    setUploading(true)
    setUploadError('')

    try {
      const supabase = createClient()

      // Upload video to Supabase Storage (bucket: dish-videos)
      const ext = file.name.split('.').pop()
      const filePath = `${restaurant.id}/${Date.now()}.${ext}`
      const { error: storageError } = await supabase.storage
        .from('dish-videos')
        .upload(filePath, file, { upsert: false })

      if (storageError) throw storageError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('dish-videos')
        .getPublicUrl(filePath)

      // Insert dish row
      const { data: dish, error: dbError } = await supabase
        .from('dishes')
        .insert({
          restaurant_id: restaurant.id,
          name,
          description: description || null,
          price: parseFloat(price),
          category: category || 'Main',
          status: 'uploaded',
          video_url: urlData.publicUrl,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setDishes(prev => [dish, ...prev])
      setName('')
      setDescription('')
      setPrice('')
      setCategory('')
      if (fileRef.current) fileRef.current.value = ''
      setShowForm(false)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const menuUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${restaurant.slug}`

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-sm">
              {restaurant.name[0]}
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">{restaurant.name}</p>
              <p className="text-gray-500 text-xs">Restaurant dashboard</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-gray-400 hover:text-white text-xs transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Menu link */}
        <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Your menu link</p>
            <p className="text-orange-400 text-sm font-mono break-all">{menuUrl}</p>
          </div>
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg transition-colors"
          >
            Preview
          </a>
        </div>

        {/* Subscription status */}
        {restaurant.subscription_status !== 'active' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-yellow-400 text-sm font-semibold mb-1">
              {restaurant.subscription_status === 'lapsed' ? 'Subscription lapsed' : 'No active subscription'}
            </p>
            <p className="text-gray-400 text-xs">
              {restaurant.subscription_status === 'lapsed'
                ? 'Your menu is currently hidden. Renew your subscription to reactivate it.'
                : 'Contact us to activate your subscription and make your menu live.'}
            </p>
          </div>
        )}

        {/* Dishes section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Dishes</h2>
            <button
              onClick={() => setShowForm(v => !v)}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {showForm ? 'Cancel' : '+ Add dish'}
            </button>
          </div>

          {/* Upload form */}
          {showForm && (
            <form
              onSubmit={handleUpload}
              className="bg-gray-900 rounded-xl p-5 mb-5 space-y-4"
            >
              <h3 className="font-semibold text-sm text-gray-200">New dish</h3>

              {uploadError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-xs">
                  {uploadError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-gray-400 text-xs mb-1">Dish name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-orange-500"
                    placeholder="Chicken Karahi"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Price (Rs) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-orange-500"
                    placeholder="850"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-orange-500"
                    placeholder="Main Course"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 text-xs mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-orange-500 resize-none"
                    placeholder="A brief description of the dish…"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 text-xs mb-1">Dish video *</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/*"
                    required
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none file:mr-3 file:bg-gray-700 file:text-white file:border-0 file:rounded file:px-2 file:py-1 file:text-xs"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Shoot the dish from multiple angles. Avoid steam or glossy lighting.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
              >
                {uploading ? 'Uploading…' : 'Submit for review'}
              </button>
            </form>
          )}

          {/* Dish list */}
          {dishes.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <div className="text-4xl mb-3">🍽️</div>
              <p className="text-sm">No dishes yet. Add your first dish to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dishes.map(dish => (
                <div
                  key={dish.id}
                  className="bg-gray-900 rounded-xl px-4 py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{dish.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Rs {dish.price} · {dish.category ?? 'Uncategorised'}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[dish.status as DishStatus]}`}>
                    {STATUS_LABELS[dish.status as DishStatus]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
