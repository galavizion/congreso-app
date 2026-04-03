'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/hooks/useTheme'
import ChatBot from "@/components/ChatBot"


export default function AsistenteDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [congressName, setCongressName] = useState<string>('')
  const [totalPoints, setTotalPoints] = useState(0)
  const [leadsCount, setLeadsCount] = useState(0)
  const [newsCount, setNewsCount] = useState(0)
  const [loading, setLoading] = useState(true)

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
      setTotalPoints(profileData?.points ?? 0)

      // Cargar nombre del congreso
      const { data: congress } = await supabase
        .from('congresses')
        .select('name')
        .eq('id', profileData.congress_id)
        .single()

      if (congress) {
        setCongressName(congress.name)
      }

      // Count de leads (stands visitados)
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('attendee_id', session.user.id)

      setLeadsCount(leadsCount ?? 0)

      // Contar noticias NO vistas
      const { data: allNews } = await supabase
        .from('news')
        .select('id')
        .eq('congress_id', profileData.congress_id)

      const { data: viewedNews } = await supabase
        .from('news_views')
        .select('news_id')
        .eq('attendee_id', session.user.id)

      const viewedIds = new Set(viewedNews?.map(v => v.news_id) || [])
      const unviewedCount = allNews?.filter(n => !viewedIds.has(n.id)).length || 0

      setNewsCount(unviewedCount)

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: colors.accent }}></div>
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(to right, ${colors.header_from}, ${colors.header_to})` }}>
        <div className="px-6 py-6">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <h1 className="text-xl font-bold" style={{ color: colors.header_text }}>
              {congressName || 'Incentiva'}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: colors.header_text, opacity: 0.8 }}>
                Hola, {profile?.name?.split(' ')[0] || 'Asistente'} 👋
              </p>
            </div>
          </div>
        </div>
        <div className="h-1" style={{ backgroundColor: colors.divider_color }}></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">

        {/* Stats de puntos y visitados  
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-gray-900">{totalPoints}</p>
            <p className="text-xs font-medium text-gray-500 mt-1">Puntos</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-gray-900">{leadsCount}</p>
            <p className="text-xs font-medium text-gray-500 mt-1">Stands Visitados</p>
          </div>
        </div> */}

        {/* Menu Grid 3x3 */}
        <div className="grid grid-cols-3 gap-3">
          
          {/* Horarios */}
          <Link
            href="/asistente/horarios"
            className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-lg bg-violet-50 flex items-center justify-center mb-2">
              <span className="text-2xl">🗓️</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">Horarios</p>
            <p className="text-xs text-gray-500 mt-0.5">Conferencias</p>
          </Link>

          {/* Mi Horario */}
          <Link
            href="/asistente/mi-horario"
            className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center mb-2">
              <span className="text-2xl">📋</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">Mi Horario</p>
            <p className="text-xs text-gray-500 mt-0.5">Tus eventos</p>
          </Link>

          {/* Noticias */}
          <Link
            href="/asistente/noticias"
            className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center relative"
          >
            {newsCount > 0 && (
              <div className="absolute top-2 right-2 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
                {newsCount}
              </div>
            )}
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-2">
              <span className="text-2xl">📰</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">Noticias</p>
            <p className="text-xs text-gray-500 mt-0.5">Novedades</p>
          </Link>

          {/* Mapa */}
          <Link
            href="/asistente/mapa"
            className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
          >
            
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-2">
              <span className="text-2xl">🗺️</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">Mapa</p>
            <p className="text-xs text-gray-500 mt-0.5">Encuentra stands</p>
          </Link>

          {/* Stands */}
          <Link
            href="/asistente/stands"
            className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center mb-2">
              <span className="text-2xl">🏪</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">Stands</p>
            <p className="text-xs text-gray-500 mt-0.5">Patrocinadores</p>
          </Link>

          {/* Regalos */}
          <Link
            href="/asistente/regalos"
            className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center mb-2">
              <span className="text-2xl">🎁</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">Regalos</p>
            <p className="text-xs text-gray-500 mt-0.5">{totalPoints} puntos</p>
          </Link>

        </div>

        {/* CTA Escanear */}
        <Link
          href="/asistente/escanear"
          className="block bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all mt-6"
          style={{ borderColor: `${colors.accent}20` }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.accent}10` }}>
              <span className="text-2xl">📱</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Escanea un QR</p>
              <p className="text-sm text-gray-500 mt-0.5">Gana 10 puntos por cada stand visitado</p>
            </div>
            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

      </div>

      {/* ChatBot flotante - solo se muestra cuando hay congress_id */}
      {profile?.congress_id && (
        <ChatBot congressId={profile.congress_id} userPoints={totalPoints} />
      )}
    </div>
  )
}