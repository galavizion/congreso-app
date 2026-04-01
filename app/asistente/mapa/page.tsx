'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/hooks/useTheme'

export default function MapaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [congress, setCongress] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Zoom y pan
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Cargar tema
  const { colors } = useTheme(profile?.congress_id)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profileData || profileData.role !== 'attendee') { router.push('/login'); return }

      setProfile(profileData)

      const { data: congressData } = await supabase
        .from('congresses')
        .select('*')
        .eq('id', profileData.congress_id)
        .single()

      setCongress(congressData)
      setLoading(false)
    }
    load()
  }, [])

  function handleZoomIn() {
    setScale(prev => Math.min(prev + 0.25, 3))
  }

  function handleZoomOut() {
    setScale(prev => Math.max(prev - 0.25, 1))
  }

  function handleReset() {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || scale <= 1) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  function handleMouseUp() {
    setIsDragging(false)
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (scale <= 1 || e.touches.length !== 1) return
    setIsDragging(true)
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y
    })
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging || scale <= 1 || e.touches.length !== 1) return
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    })
  }

  function handleTouchEnd() {
    setIsDragging(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: colors.accent }}></div>
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div style={{ background: `linear-gradient(to right, ${colors.header_from}, ${colors.header_to})` }}>
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <Link
              href="/asistente/inicio"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
              style={{ color: colors.header_text }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold" style={{ color: colors.header_text }}>Mapa</h1>
              <p className="text-sm mt-0.5" style={{ color: colors.header_text, opacity: 0.8 }}>Encuentra los stands del congreso</p>
            </div>
          </div>
        </div>
        <div className="h-1" style={{ backgroundColor: colors.divider_color }}></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {congress?.map_url ? (
          <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm relative">
            
            {/* Controles de zoom */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button
                onClick={handleZoomIn}
                disabled={scale >= 3}
                className="w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Acercar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={handleZoomOut}
                disabled={scale <= 1}
                className="w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Alejar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>
              {scale > 1 && (
                <button
                  onClick={handleReset}
                  className="w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  title="Restablecer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>

            {/* Contenedor con overflow para pan */}
            <div
              ref={containerRef}
              className="w-full overflow-hidden touch-none"
              style={{ 
                height: '70vh',
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={congress.map_url}
                alt="Mapa del congreso"
                className="w-full h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  transformOrigin: 'center center'
                }}
                draggable={false}
              />
            </div>

            {/* Indicador de zoom */}
            {scale > 1 && (
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
                {Math.round(scale * 100)}%
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🗺️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mapa no disponible</h3>
            <p className="text-sm text-gray-500">El mapa del evento aún no está disponible</p>
          </div>
        )}
      </div>
    </div>
  )
}