'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type MapViewerProps = {
  congressId: string
  mapUrl: string | null
  canEdit?: boolean
  onMapUpdated?: () => void
}

export default function MapViewer({ 
  congressId, 
  mapUrl, 
  canEdit = false,
  onMapUpdated 
}: MapViewerProps) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)

  async function handleMapUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${congressId}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('congress_maps')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('congress_maps')
        .getPublicUrl(fileName)

      // Actualizar BD
      const response = await fetch('/api/update-congress-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          congressId,
          mapUrl: publicUrl
        })
      })

      if (!response.ok) throw new Error('Error actualizando mapa')

      // Eliminar mapa anterior si existe
      if (mapUrl) {
        const oldPath = mapUrl.split('/').pop()
        if (oldPath && oldPath !== fileName) {
          await supabase.storage
            .from('congress_maps')
            .remove([oldPath])
        }
      }

      onMapUpdated?.()
      alert('Mapa actualizado correctamente')
    } catch (err: any) {
      alert('Error: ' + err.message)
    }

    setUploading(false)
  }

  function handleZoomIn() {
    setScale(prev => Math.min(prev + 0.5, 3))
  }

  function handleZoomOut() {
    setScale(prev => Math.max(prev - 0.5, 1))
  }

  function handleReset() {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  function handleMouseUp() {
    setIsDragging(false)
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      })
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (isDragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      })
    }
  }

  function handleTouchEnd() {
    setIsDragging(false)
  }

  if (!mapUrl) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="text-4xl mb-3">🗺️</div>
        <h3 className="font-bold text-gray-900 mb-2">Sin mapa</h3>
        <p className="text-gray-500 text-sm mb-4">Sube la imagen del mapa del congreso</p>
        
        {canEdit && (
          <label className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 cursor-pointer font-medium">
            <input
              type="file"
              accept="image/*"
              onChange={handleMapUpload}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? 'Subiendo...' : 'Subir Mapa'}
          </label>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            🔍-
          </button>
          <span className="text-sm font-medium text-gray-600 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            🔍+
          </button>
          <button
            onClick={handleReset}
            className="px-3 h-10 rounded-lg bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
          >
            {isFullscreen ? '🗙' : '⛶'}
          </button>

          {canEdit && (
            <label className="px-4 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center cursor-pointer hover:bg-indigo-700 text-sm font-medium">
              <input
                type="file"
                accept="image/*"
                onChange={handleMapUpload}
                disabled={uploading}
                className="hidden"
              />
              {uploading ? '...' : '📷'}
            </label>
          )}
        </div>
      </div>

      {/* Visor del mapa */}
      <div 
        className={`
          bg-gray-100 rounded-xl overflow-hidden relative
          ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[500px]'}
        `}
      >
        <div
          className="w-full h-full overflow-hidden cursor-move select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={mapUrl}
            alt="Mapa del congreso"
            className="w-full h-full object-contain transition-transform"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > 1 ? 'move' : 'default'
            }}
            draggable={false}
          />
        </div>

        {scale > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
            Arrastra para mover
          </div>
        )}
      </div>
    </div>
  )
}