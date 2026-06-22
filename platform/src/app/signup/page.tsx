'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [restaurantName, setRestaurantName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function slugify(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const slug = slugify(restaurantName)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Create restaurant row linked to the new user
    if (data.user) {
      const { error: dbError } = await supabase.from('restaurants').insert({
        owner_user_id: data.user.id,
        name: restaurantName,
        slug,
        subscription_status: 'inactive',
      })

      if (dbError) {
        // Slug collision → append random suffix
        if (dbError.code === '23505') {
          const fallbackSlug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
          await supabase.from('restaurants').insert({
            owner_user_id: data.user.id,
            name: restaurantName,
            slug: fallbackSlug,
            subscription_status: 'inactive',
          })
        }
      }
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-white text-xl font-bold mb-2">Check your email</h1>
          <p className="text-gray-400 text-sm max-w-xs">
            We sent a confirmation link to <span className="text-orange-400">{email}</span>.
            Click it to activate your account.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🍽️</div>
          <h1 className="text-white text-2xl font-bold">AR Menu</h1>
          <p className="text-gray-400 text-sm mt-1">Create your restaurant account</p>
        </div>

        <form onSubmit={handleSignup} className="bg-gray-900 rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-xs mb-1.5">Restaurant name</label>
            <input
              type="text"
              value={restaurantName}
              onChange={e => setRestaurantName(e.target.value)}
              required
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-orange-500"
              placeholder="Abubakar's Kitchen"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-orange-500"
              placeholder="you@restaurant.com"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-orange-500"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-orange-400 hover:text-orange-300">
            Sign in
          </a>
        </p>
      </div>
    </main>
  )
}
