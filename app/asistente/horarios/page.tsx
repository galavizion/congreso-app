'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function HorariosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [schedules, setSchedules] = useState<any[]>([])
  const [savedScheduleIds, setSavedScheduleIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [attendeeId, setAttendeeId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'attendee') { router.push('/login'); return }

    setAttendeeId(profile.id)

    // Cargar horarios
    const { data: schedulesData } = await supabase
      .from('schedules')
      .select('*')
      .eq('congress_id', profile.congress_id)
      .order('starts_at', { ascending: true })

    setSchedules(schedulesData ?? [])

    // Cargar eventos ya guardados
    const { data: savedData } = await supabase
      .from('attendee_schedule')
      .select('schedule_id')
      .eq('attendee_id', profile.id)

    if (savedData) {
      setSavedScheduleIds(new Set(savedData.map(s => s.schedule_id)))
    }

    setLoading(false)
  }

  async function toggleSchedule(scheduleId: string) {
    if (!attendeeId) return

    const isSaved = savedScheduleIds.has(scheduleId)

    if (isSaved) {
      // Eliminar
      const { error } = await supabase
        .from('attendee_schedule')
        .delete()
        .eq('attendee_id', attendeeId)
        .eq('schedule_id', scheduleId)

      if (error) {
        alert('Error al eliminar: ' + error.message)
        return
      }

      const newSet = new Set(savedScheduleIds)
      newSet.delete(scheduleId)
      setSavedScheduleIds(newSet)
    } else {
      // Agregar
      const { error } = await supabase
        .from('attendee_schedule')
        .insert({
          attendee_id: attendeeId,
          schedule_id: scheduleId
        })

      if (error) {
        alert('Error al agregar: ' + error.message)
        return
      }

      const newSet = new Set(savedScheduleIds)
      newSet.add(scheduleId)
      setSavedScheduleIds(newSet)
    }
  }

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
              <h1 className="text-xl font-bold text-white">Horarios</h1>
              <p className="text-sm text-white/80 mt-0.5">Conferencias del congreso</p>
            </div>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin conferencias</h3>
            <p className="text-sm text-gray-500">No hay conferencias programadas aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map(schedule => {
              const isSaved = savedScheduleIds.has(schedule.id)
              
              return (
                <div
                  key={schedule.id}
                  className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
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

                  <button
                    onClick={() => toggleSchedule(schedule.id)}
                    className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                      isSaved
                        ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isSaved ? '✓ Agregado a Mi Horario' : '+ Agregar a Mi Horario'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}