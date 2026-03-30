'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type SavedEvent = {
  id: string
  event_id: string
  added_at: string
  event: {
    id: string
    title: string
    description: string | null
    speaker: string | null
    date: string
    start_time: string
    end_time: string
    room_id: string | null
  }
  room_name?: string
}

export default function MiHorarioPage() {
  const router = useRouter()
  const supabase = createClient()
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([])
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

    // Cargar eventos guardados
    const { data: savedData } = await supabase
      .from('attendee_schedule')
      .select('id, event_id, added_at')
      .eq('attendee_id', profile.id)
      .order('added_at', { ascending: false })

    if (!savedData || savedData.length === 0) {
      setLoading(false)
      return
    }

    // Cargar detalles de eventos
    const eventIds = savedData.map(s => s.event_id)
    const { data: eventsData } = await supabase
      .from('congress_events')
      .select('*')
      .in('id', eventIds)

    if (!eventsData) {
      setLoading(false)
      return
    }

    // Cargar nombres de salas
    const roomIds = [...new Set(eventsData.filter(e => e.room_id).map(e => e.room_id))]
    let roomsMap: Record<string, string> = {}

    if (roomIds.length > 0) {
      const { data: roomsData } = await supabase
        .from('congress_rooms')
        .select('id, name')
        .in('id', roomIds)

      if (roomsData) {
        roomsMap = Object.fromEntries(roomsData.map(r => [r.id, r.name]))
      }
    }

    // Combinar datos
    const enriched = savedData.map(saved => {
      const event = eventsData.find(e => e.id === saved.event_id)
      return {
        ...saved,
        event: event!,
        room_name: event?.room_id ? roomsMap[event.room_id] : null
      }
    }).filter(item => item.event) // Solo eventos que existen

    setSavedEvents(enriched)
    setLoading(false)
  }

  async function removeEvent(scheduleId: string) {
    if (!attendeeId) return

    const { error } = await supabase
      .from('attendee_schedule')
      .delete()
      .eq('id', scheduleId)

    if (error) {
      alert('Error al eliminar: ' + error.message)
      return
    }

    // Recargar
    load()
  }

  // Agrupar por día
  const eventsByDay = savedEvents.reduce((acc, item) => {
    const day = new Date(item.event.date).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    if (!acc[day]) acc[day] = []
    acc[day].push(item)
    return acc
  }, {} as Record<string, SavedEvent[]>)

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
              <h1 className="text-xl font-bold text-white">Mi Horario</h1>
              <p className="text-sm text-white/80 mt-0.5">Eventos que agregaste</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-purple-400"></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {savedEvents.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin eventos guardados</h3>
            <p className="text-sm text-gray-500 mb-6">Agrega eventos desde la sección de Horarios</p>
            <Link
              href="/asistente/horarios"
              className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ver Horarios
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de eventos</p>
                  <p className="text-2xl font-bold text-gray-900">{savedEvents.length}</p>
                </div>
              </div>
            </div>

            {/* Eventos agrupados por día */}
            {Object.entries(eventsByDay).map(([day, dayEvents]) => (
              <div key={day}>
                <h2 className="text-lg font-bold text-gray-900 mb-4 capitalize">{day}</h2>
                <div className="space-y-3">
                  {dayEvents
                    .sort((a, b) => a.event.start_time.localeCompare(b.event.start_time))
                    .map(item => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">{item.event.title}</p>
                            </div>
                            {item.event.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.event.description}</p>
                            )}
                            {item.event.speaker && (
                              <p className="text-sm text-gray-500 mt-1">🎤 {item.event.speaker}</p>
                            )}
                            {item.room_name && (
                              <p className="text-xs text-gray-400 mt-1">📍 {item.room_name}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium text-indigo-600">
                              {item.event.start_time?.substring(0, 5) || ''}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.event.end_time?.substring(0, 5) || ''}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => removeEvent(item.id)}
                          className="w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        >
                          🗑️ Eliminar de Mi Horario
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}