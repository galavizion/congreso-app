'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Congress = {
  id: string
  name: string
  logo_url: string | null
  created_at: string
}

type Stats = {
  totalStands: number
  totalAttendees: number
  totalUsers: number
  totalNews: number
}

export default function CongressDashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [congress, setCongress] = useState<Congress | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalStands: 0,
    totalAttendees: 0,
    totalUsers: 0,
    totalNews: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

async function loadData() {
  setLoading(true)

  // Obtener sesión
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    // Esperar un poco y reintentar (puede estar cargando)
    await new Promise(resolve => setTimeout(resolve, 500))
    const { data: { session: retrySession } } = await supabase.auth.getSession()
    
    if (!retrySession) {
      window.location.href = '/login'
      return
    }
    
    // Usar la sesión del retry
    const { data: profile } = await supabase
      .from('profiles')
      .select('congress_id, role')
      .eq('id', retrySession.user.id)
      .single()

    if (!profile || profile.role !== 'congress' || !profile.congress_id) {
      window.location.href = '/login'
      return
    }

    // Obtener datos del congreso
    const { data: congressData } = await supabase
      .from('congresses')
      .select('*')
      .eq('id', profile.congress_id)
      .single()

    if (congressData) {
      setCongress(congressData)
      loadStats(profile.congress_id)
    }

    setLoading(false)
    return
  }

  // Si hay sesión desde el inicio
  const { data: profile } = await supabase
    .from('profiles')
    .select('congress_id, role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'congress' || !profile.congress_id) {
    window.location.href = '/login'
    return
  }

  // Obtener datos del congreso
  const { data: congressData } = await supabase
    .from('congresses')
    .select('*')
    .eq('id', profile.congress_id)
    .single()

  if (congressData) {
    setCongress(congressData)
    loadStats(profile.congress_id)
  }

  setLoading(false)
}
  async function loadStats(congressId: string) {
    const { count: standsCount } = await supabase
      .from('stands')
      .select('*', { count: 'exact', head: true })
      .eq('congress_id', congressId)

    const { count: attendeesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('congress_id', congressId)
      .eq('role', 'attendee')

    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('congress_id', congressId)
      .eq('role', 'congress')

    const { count: newsCount } = await supabase
      .from('news')
      .select('*', { count: 'exact', head: true })
      .eq('congress_id', congressId)

    setStats({
      totalStands: standsCount || 0,
      totalAttendees: attendeesCount || 0,
      totalUsers: usersCount || 0,
      totalNews: newsCount || 0
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!congress) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">No tienes un congreso asignado</div>
          <button
            onClick={handleLogout}
            className="text-indigo-600 hover:text-indigo-700 text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9] text-white">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="text-white/80 hover:text-white text-sm"
            >
              Cerrar sesión
            </button>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
            {congress.logo_url ? (
              <img 
                src={congress.logo_url} 
                alt={congress.name}
                className="w-12 h-12 rounded-lg object-cover bg-white"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-xl font-bold">
                  {congress.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold truncate">{congress.name}</h2>
              <p className="text-white/80 text-xs">Mi Congreso</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Estadísticas</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-2xl mb-1">🏪</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalStands}</div>
            <div className="text-xs text-gray-500">Stands</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalAttendees}</div>
            <div className="text-xs text-gray-500">Asistentes</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-2xl mb-1">📰</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalNews}</div>
            <div className="text-xs text-gray-500">Noticias</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-2xl mb-1">👔</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
            <div className="text-xs text-gray-500">Usuarios</div>
          </div>
        </div>

        <button
          onClick={() => router.push(`/congress/congreso/${congress.id}`)}
          className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl hover:bg-indigo-700 font-medium shadow-lg"
        >
          Gestionar Congreso →
        </button>
      </div>
    </div>
  )
}