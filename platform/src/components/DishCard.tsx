'use client'

import { useState } from 'react'
import ARViewer from './ARViewer'
import { Dish } from '@/types'

interface DishCardProps {
  dish: Dish
}

export default function DishCard({ dish }: DishCardProps) {
  const [showAR, setShowAR] = useState(false)

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {dish.glb_url && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 h-44 flex items-center justify-center">
            {/* @ts-expect-error model-viewer is a custom element */}
            <model-viewer
              src={dish.glb_url}
              camera-controls
              auto-rotate
              shadow-intensity="0.5"
              alt={dish.name}
              style={{ width: '100%', height: '100%' }}
            >
              {/* @ts-expect-error model-viewer is a custom element */}
            </model-viewer>
          </div>
        )}

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-base leading-tight">{dish.name}</h3>
            {dish.price !== null && (
              <span className="text-orange-600 font-bold text-sm whitespace-nowrap">
                Rs {dish.price.toLocaleString()}
              </span>
            )}
          </div>

          {dish.description && (
            <p className="text-gray-500 text-sm leading-snug mb-3 flex-1">{dish.description}</p>
          )}

          {dish.glb_url && (
            <button
              onClick={() => setShowAR(true)}
              className="mt-auto w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              📱 View on Table
            </button>
          )}
        </div>
      </div>

      {showAR && dish.glb_url && (
        <ARViewer
          glbUrl={dish.glb_url}
          dishName={dish.name}
          onClose={() => setShowAR(false)}
        />
      )}
    </>
  )
}
