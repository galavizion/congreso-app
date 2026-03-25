'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CongresoStandsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [stands, setStands] = useState<any[]>([])
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

      const { data: standsData } = await supabase
        .from('stands')
        .select('*')
        .eq('congress_id', profile.congress_id)
        .order('created_at', { ascending: false })

      setStands(standsData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
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
                <h1 className="text-xl font-bold text-white">Stands</h1>
                <p className="text-sm text-white/80 mt-0.5">Gestiona los expositores</p>
              </div>
            </div>
            <Link
              href="/congreso/stands/nuevo"
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-white/30 transition-all"
            >
              + Nuevo Stand
            </Link>
          </div>
        </div>
        <div className="h-1 bg-cyan-400"></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">

        {stands.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏪</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay stands registrados</h3>
            <p className="text-sm text-gray-500 mb-6">Crea el primer stand para tu congreso</p>
            <Link
              href="/congreso/stands/nuevo"
              className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Crear Primer Stand
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stands.map(stand => (
              <Link
                key={stand.id}
                href={`/congreso/stands/${stand.id}`}
                className="group block bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {stand.logo_url ? (
                    <img
                      src={stand.logo_url}
                      alt={stand.name}
                      className="w-14 h-14 rounded-lg object-cover border border-gray-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                      <span className="text-2xl">🏪</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {stand.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {stand.brand ?? 'Sin marca'}
                    </p>
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
