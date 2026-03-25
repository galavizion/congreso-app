'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function MapaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [congress, setCongress] = useState<any>(null)
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

      if (!profile || profile.role !== 'attendee') { router.push('/login'); return }

      const { data: congressData } = await supabase
        .from('congresses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setCongress(congressData)
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
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <Link
              href="/asistente/inicio"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Mapa</h1>
              <p className="text-sm text-white/80 mt-0.5">Encuentra los stands del congreso</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-emerald-400"></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {congress?.map_url ? (
          <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img
              src={congress.map_url}
              alt="Mapa del congreso"
              className="w-full h-auto"
            />
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
