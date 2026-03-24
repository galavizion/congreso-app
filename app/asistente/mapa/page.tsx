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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/asistente/inicio" className="text-gray-400 text-xl">‹</Link>
        <h1 className="text-lg font-semibold text-gray-900">Mapa</h1>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {congress?.map_url ? (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <img
              src={congress.map_url}
              alt="Mapa del congreso"
              className="w-full h-auto"
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            El mapa aún no está disponible.
          </div>
        )}
      </div>

    </div>
  )
}
