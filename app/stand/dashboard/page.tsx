'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function StandDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [stand, setStand] = useState<any>(null)
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

      if (!profile || profile.role !== 'stand') { router.push('/login'); return }

      const { data: standData } = await supabase
        .from('stands')
        .select('*')
        .eq('id', profile.stand_id)
        .single()

      setStand(standData)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">WinWin</h1>
        <p className="text-sm text-gray-400 mt-0.5">{stand?.name ?? 'Mi stand'}</p>
      </div>

      {/* Menu */}
      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">

        <Link
          href="/stand/mi-qr"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
            📱
          </div>
          <div>
            <p className="font-semibold text-gray-900">Mi QR</p>
            <p className="text-sm text-gray-400">Muéstralo para capturar leads</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

        <Link
          href="/stand/noticias"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
            📢
          </div>
          <div>
            <p className="font-semibold text-gray-900">Noticias</p>
            <p className="text-sm text-gray-400">Publica updates de tu stand</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

        <Link
          href="/stand/leads"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
            👥
          </div>
          <div>
            <p className="font-semibold text-gray-900">Leads</p>
            <p className="text-sm text-gray-400">Asistentes que escanearon tu QR</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

      </div>
    </div>
  )
}
