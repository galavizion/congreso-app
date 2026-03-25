'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CongresoRegalosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [gifts, setGifts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'congress') { router.push('/login'); return }

      const { data: giftsData } = await supabase
        .from('gifts')
        .select('*')
        .eq('congress_id', profile.congress_id)
        .order('created_at', { ascending: false })

      setGifts(giftsData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">

      {/* Header con gradiente índigo pastel */}
      <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]"> 
        <div className="px-6 py-6">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <Link 
                href="/congreso/dashboard" 
                className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Regalos</h1>
                <p className="text-sm text-white/80 mt-0.5">Gestiona el catálogo de premios</p>
              </div>
            </div>
            <Link
              href="/congreso/regalos/nuevo"
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-white/30 transition-all"
            >
              + Nuevo Regalo
            </Link>
          </div>
        </div>
        {/* Línea de color rosa para Regalos */}
        <div className="h-1 bg-rose-400"></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">

        {/* Stats limpios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <span className="text-2xl">🎁</span>
              </div>
              <p className="text-sm font-medium text-gray-600">Total Regalos</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{gifts.length}</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-sm font-medium text-gray-600">Stock Total</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{gifts.reduce((acc, g) => acc + g.stock, 0)}</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <p className="text-sm font-medium text-gray-600">Puntos Promedio</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {gifts.length > 0 ? Math.round(gifts.reduce((acc, g) => acc + g.points_cost, 0) / gifts.length) : 0}
            </p>
          </div>
        </div>

        {/* Lista de regalos */}
        {gifts.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎁</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay regalos</h3>
            <p className="text-sm text-gray-500 mb-6">Crea el primer regalo para tu catálogo</p>
            <Link
              href="/congreso/regalos/nuevo"
              className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Crear Primer Regalo
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {gifts.map(gift => (
              <Link
                key={gift.id}
                href={`/congreso/regalos/${gift.id}`}
                className="group block bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {gift.image_url ? (
                    <img 
                      src={gift.image_url} 
                      alt={gift.name}
                      className="w-14 h-14 rounded-lg object-cover border border-gray-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                      <span className="text-2xl">🎁</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {gift.name}
                    </h3>
                    {gift.description && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">{gift.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                        <span>⭐</span>
                        {gift.points_cost} pts
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
                        gift.stock > 0 
                          ? 'text-green-700 bg-green-50' 
                          : 'text-red-700 bg-red-50'
                      }`}>
                        <span>{gift.stock > 0 ? '✓' : '✗'}</span>
                        {gift.stock} en stock
                      </span>
                    </div>
                  </div>

                  <svg 
                    className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}