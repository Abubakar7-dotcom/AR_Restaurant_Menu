'use client'

import { useEffect, useRef } from 'react'

interface ARViewerProps {
  glbUrl: string
  dishName: string
  onClose: () => void
}

export default function ARViewer({ glbUrl, dishName, onClose }: ARViewerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" ref={ref}>
      <div className="flex items-center justify-between px-4 py-3 bg-black/60">
        <h2 className="text-white font-semibold text-lg">{dishName}</h2>
        <button
          onClick={onClose}
          className="text-white text-2xl leading-none px-2"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* @ts-expect-error model-viewer is a custom element */}
      <model-viewer
        src={glbUrl}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        alt={`3D model of ${dishName}`}
        style={{ width: '100%', flex: 1 }}
      >
        <button
          slot="ar-button"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg text-base"
        >
          📱 View on Table
        </button>
        {/* @ts-expect-error model-viewer is a custom element */}
      </model-viewer>
    </div>
  )
}
