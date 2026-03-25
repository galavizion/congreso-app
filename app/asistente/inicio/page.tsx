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
          <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <h1 className="text-xl font-bold text-white">WinWin</h1>
              <p className="text-sm text-white/80 mt-0.5">Hola, {profile?.name?.split(' ')[0] || 'Asistente'} 👋</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-indigo-400"></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto flex flex-col gap-4">

        {/* Stats de puntos */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-gray-900">{totalPoints}</p>
            <p className="text-xs font-medium text-gray-500 mt-1">Puntos</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-gray-900">{leadsCount}</p>
            <p className="text-xs font-medium text-gray-500 mt-1">Visitados</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-gray-900">#12</p>
            <p className="text-xs font-medium text-gray-500 mt-1">Ranking</p>
          </div>
        </div>

        {/* Menu */}
        <Link
          href="/asistente/horarios"
          className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
            <span className="text-2xl">🗓️</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Horarios</p>
            <p className="text-sm text-gray-500 mt-0.5">Conferencias del congreso</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/asistente/mapa"
          className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <span className="text-2xl">🗺️</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Mapa</p>
            <p className="text-sm text-gray-500 mt-0.5">Encuentra los stands</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/asistente/stands"
          className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
            <span className="text-2xl">🏪</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Stands</p>
            <p className="text-sm text-gray-500 mt-0.5">Noticias y novedades</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/asistente/regalos"
          className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
            <span className="text-2xl">🎁</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Regalos</p>
            <p className="text-sm text-gray-500 mt-0.5">Canjea tus puntos</p>
          </div>
          <div className="flex items-center gap-2">
            {totalPoints > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                ⭐ {totalPoints}
              </span>
            )}
            <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* CTA Escanear */}
        <div className="bg-white rounded-xl p-5 border border-indigo-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Escanea un QR</p>
              <p className="text-sm text-gray-500 mt-0.5">Gana 10 puntos por cada stand visitado</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
