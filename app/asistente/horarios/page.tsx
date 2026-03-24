'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function HorariosPage() {
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

      if (!profile || profile.role !== 'attendee') { router.push('/login'); return }

      const { data: schedulesData } = await supabase
        .from('schedules')
        .select('*')
        .order('starts_at', { ascending: true })

      setSchedules(schedulesData ?? [])
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
        <h1 className="text-lg font-semibold text-gray-900">Horarios</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-3 max-w-2xl mx-auto">

        {schedules.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            No hay conferencias programadas aún.
          </div>
        )}

        {schedules.map(schedule => (
          <div
            key={schedule.id}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
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
    </div>
  )
}
