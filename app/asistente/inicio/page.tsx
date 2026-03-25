'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AsistenteDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [totalPoints, setTotalPoints] = useState(0)
  const [leadsCount, setLeadsCount] = useState(0)
  const [loading, setLoading] = useState(true)

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

      const { data: pointsData } = await supabase
        .from('points')
        .select('total_points')
        .eq('attendee_id', session.user.id)
        .maybeSingle()

      setTotalPoints(pointsData?.total_points ?? 0)

      const { count: leadsCount } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('attendee_id', session.user.id)

      setLeadsCount(leadsCount ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#fa709a] rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">

      {/* Header con Gradiente */}
      <div className="bg-gradient-to-br from-[#fa709a] to-[#fee140] px-6 py-8 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">WinWin</h1>
            <p className="text-white/80 text-sm mt-1">Hola, {profile?.name?.split(' ')[0] || 'Asistente'} 👋</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-xl">
            ⚙️
          </button>
        </div>

        {/* Card de Puntos Flotante */}
        <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-2xl">
          <p className="text-white/70 text-xs uppercase tracking-wide font-semibold">Tus puntos</p>
          <p className="text-white text-6xl font-bold mt-2">{totalPoints}</p>
          
          <div className="flex gap-6 mt-6">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wide">Visitados</p>
              <p className="text-white text-3xl font-bold mt-1">{leadsCount}</p>
            </div>
            <div className="h-12 w-px bg-white/30"></div>
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wide">Ranking</p>
              <p className="text-white text-3xl font-bold mt-1">#12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Cards */}
      <div className="px-6 -mt-16 pb-8 flex flex-col gap-4 max-w-2xl mx-auto">

        <Link
          href="/asistente/horarios"
          className="group bg-white rounded-2xl p-6 border-2 border-transparent hover:border-blue-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[6px_6px_0px_0px_rgba(59,130,246,0.3)] transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">
              🗓️
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-gray-900">Horarios</p>
              <p className="text-sm text-gray-500 mt-0.5">Conferencias del congreso</p>
            </div>
            <div className="text-gray-300 group-hover:text-blue-500 text-2xl transition-colors">›</div>
          </div>
        </Link>

        <Link
          href="/asistente/mapa"
          className="group bg-white rounded-2xl p-6 border-2 border-transparent hover:border-green-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[6px_6px_0px_0px_rgba(34,197,94,0.3)] transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-green-500/30">
              🗺️
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-gray-900">Mapa</p>
              <p className="text-sm text-gray-500 mt-0.5">Encuentra los stands</p>
            </div>
            <div className="text-gray-300 group-hover:text-green-500 text-2xl transition-colors">›</div>
          </div>
        </Link>

        <Link
          href="/asistente/stands"
          className="group bg-white rounded-2xl p-6 border-2 border-transparent hover:border-amber-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[6px_6px_0px_0px_rgba(245,158,11,0.3)] transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30">
              🏪
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-gray-900">Stands</p>
              <p className="text-sm text-gray-500 mt-0.5">Noticias y novedades</p>
            </div>
            <div className="text-gray-300 group-hover:text-amber-500 text-2xl transition-colors">›</div>
          </div>
        </Link>

        <Link
          href="/asistente/regalos"
          className="group relative overflow-hidden bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl p-6 border-2 border-transparent shadow-[4px_4px_0px_0px_rgba(102,126,234,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(102,126,234,0.5)] transition-all duration-200 active:scale-[0.98]"
        >
          {/* Badge de puntos disponibles */}
          {totalPoints > 0 && (
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
              <p className="text-white text-xs font-bold">{totalPoints} pts</p>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl border border-white/30">
              🎁
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-white">Regalos</p>
              <p className="text-sm text-white/80 mt-0.5">Canjea tus puntos</p>
            </div>
            <div className="text-white/50 group-hover:text-white text-2xl transition-colors">›</div>
          </div>
        </Link>

        {/* CTA Escanear */}
        <div className="mt-4 bg-gradient-to-r from-[#4facfe] to-[#00f2fe] rounded-2xl p-6 border-2 border-transparent shadow-[4px_4px_0px_0px_rgba(79,172,254,0.3)]">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📱</div>
            <div className="flex-1">
              <p className="text-white font-bold text-base">Escanea un QR</p>
              <p className="text-white/80 text-sm mt-0.5">Gana 10 puntos por cada stand visitado</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}