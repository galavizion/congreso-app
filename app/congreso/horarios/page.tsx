'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CongresoHorariosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [schedules, setSchedules] = useState<any[]>([])
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

      const { data: congressData } = await supabase
        .from('congresses')
        .select('*')
        .eq('id', profile.congress_id)
        .single()

      const { data: schedulesData } = await supabase
        .from('schedules')
        .select('*')
        .eq('congress_id', congressData?.id)
        .order('starts_at', { ascending: true })

      setSchedules(schedulesData ?? [])
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
                <h1 className="text-xl font-bold text-white">Horarios</h1>
                <p className="text-sm text-white/80 mt-0.5">Conferencias del evento</p>
              </div>
            </div>
            <Link
              href="/congreso/horarios/nuevo"
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-white/30 transition-all"
            >
              + Nueva
            </Link>
          </div>
        </div>
        <div className="h-1 bg-violet-400"></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">

        {schedules.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🗓️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay conferencias</h3>
            <p className="text-sm text-gray-500 mb-6">Agrega la primera conferencia al horario</p>
            <Link
              href="/congreso/horarios/nuevo"
              className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Crear Primera Conferencia
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map(schedule => (
              <div key={schedule.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{schedule.title}</p>
                    {schedule.speaker && (
                      <p className="text-sm text-gray-500 mt-0.5">{schedule.speaker}</p>
                    )}
                    {schedule.room && (
                      <p className="text-xs text-gray-400 mt-1">📍 {schedule.room}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-gray-700">
                      {schedule.starts_at
                        ? new Date(schedule.starts_at).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {schedule.ends_at
                        ? new Date(schedule.ends_at).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
