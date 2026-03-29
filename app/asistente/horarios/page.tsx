'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Event = {
  id: string
  title: string
  description: string | null
  speaker: string | null
  starts_at: string
  ends_at: string
  room_id: string | null
  room_name?: string
}

export default function HorariosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [attendeeId, setAttendeeId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [days, setDays] = useState<string[]>([])

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

    // Cargar eventos
  const { data: eventsData, error } = await supabase
  .from('congress_events')
  .select('*')
  .eq('congress_id', profile.congress_id)
  .order('starts_at', { ascending: true })

console.log('🔍 Events query:', { eventsData, error, congress_id: profile.congress_id })

if (error) {
  console.error('❌ Error loading events:', error)
  setLoading(false)
  return
}

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

    // Enriquecer eventos con nombre de sala
    const enrichedEvents = eventsData.map(e => ({
      ...e,
      room_name: e.room_id ? roomsMap[e.room_id] : null
    }))

    setEvents(enrichedEvents)

    // Extraer días únicos
    const uniqueDays = [...new Set(
      eventsData.map(e => new Date(e.starts_at).toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }))
    )]
    setDays(uniqueDays)

    // Cargar eventos ya guardados
    const { data: savedData } = await supabase
      .from('attendee_schedule')
      .select('event_id')
      .eq('attendee_id', profile.id)

    if (savedData) {
      setSavedEventIds(new Set(savedData.map(s => s.event_id)))
    }

    setLoading(false)
  }

  async function toggleEvent(eventId: string) {
    if (!attendeeId) return

    const isSaved = savedEventIds.has(eventId)

    if (isSaved) {
      // Eliminar
      const { error } = await supabase
        .from('attendee_schedule')
        .delete()
        .eq('attendee_id', attendeeId)
        .eq('event_id', eventId)

      if (error) {
        alert('Error al eliminar: ' + error.message)
        return
      }

      const newSet = new Set(savedEventIds)
      newSet.delete(eventId)
      setSavedEventIds(newSet)
    } else {
      // Agregar
      const { error } = await supabase
        .from('attendee_schedule')
        .insert({
          attendee_id: attendeeId,
          event_id: eventId
        })

      if (error) {
        alert('Error al agregar: ' + error.message)
        return
      }

      const newSet = new Set(savedEventIds)
      newSet.add(eventId)
      setSavedEventIds(newSet)
    }
  }

  // Filtrar eventos por día seleccionado
  const filteredEvents = selectedDay === 'all' 
    ? events 
    : events.filter(e => {
        const eventDay = new Date(e.starts_at).toLocaleDateString('es-MX', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })
        return eventDay === selectedDay
      })

  // Agrupar por sala
  const eventsByRoom = filteredEvents.reduce((acc, event) => {
    const roomKey = event.room_name || 'Sin sala asignada'
    if (!acc[roomKey]) acc[roomKey] = []
    acc[roomKey].push(event)
    return acc
  }, {} as Record<string, Event[]>)

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

      <div className="px-6 py-6 max-w-5xl mx-auto">
        {/* Tabs de días */}
        {days.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
            <button
              onClick={() => setSelectedDay('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedDay === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              Todos
            </button>
            {days.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedDay === day
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🗓️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin conferencias</h3>
            <p className="text-sm text-gray-500">
              {selectedDay === 'all' ? 'No hay conferencias programadas' : 'No hay conferencias en este día'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(eventsByRoom).map(([roomName, roomEvents]) => (
              <div key={roomName}>
                {/* Nombre de sala */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                  <h3 className="font-bold text-gray-900">{roomName}</h3>
                  <div className="text-xs text-gray-400">
                    {roomEvents.length} {roomEvents.length === 1 ? 'evento' : 'eventos'}
                  </div>
                </div>

                {/* Eventos de la sala */}
                <div className="space-y-3 mb-6">
                  {roomEvents.map(event => {
                    const isSaved = savedEventIds.has(event.id)
                    
                    return (
                      <div
                        key={event.id}
                        className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{event.title}</p>
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            )}
                            {event.speaker && (
                              <p className="text-sm text-gray-500 mt-1">🎤 {event.speaker}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium text-gray-700">
                              {new Date(event.starts_at).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(event.ends_at).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleEvent(event.id)}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}