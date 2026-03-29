'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import NewsManager from '@/components/congress/NewsManager'

export default function StandNewsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [congressId, setCongressId] = useState<string | null>(null)
  const [standId, setStandId] = useState<string | null>(null)
  const [standName, setStandName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, congress_id, stand_id')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'stand') {
        router.push('/login')
        return
      }

      // Cargar nombre del stand
      const { data: standData } = await supabase
        .from('stands')
        .select('name')
        .eq('id', profile.stand_id)
        .single()

      setCongressId(profile.congress_id)
      setStandId(profile.stand_id)
      setStandName(standData?.name || 'Mi Stand')
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

  if (!congressId) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-gray-500">No se encontró el congreso</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header fancy */}
      <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <Link
                href="/stand/dashboard"
                className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Noticias</h1>
                <p className="text-sm text-white/80 mt-0.5">{standName}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="h-1 bg-violet-400"></div>
      </div>

      {/* Contenido */}
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <NewsManager 
          congressId={congressId}
          standId={standId}
          canEdit={true}
        />
      </div>
    </div>
  )
}