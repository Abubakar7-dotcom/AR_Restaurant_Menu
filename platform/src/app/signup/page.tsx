'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [restaurantName, setRestaurantName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // The restaurant row is created automatically by a DB trigger
    // (handle_new_user) that reads restaurant_name from this metadata.
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { restaurant_name: restaurantName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Hard navigation so the new session cookie is sent to the server
    window.location.href = '/dashboard'
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
