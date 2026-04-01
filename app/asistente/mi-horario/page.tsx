'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/hooks/useTheme'

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
  room_name?: string | null
}

export default function MiHorarioPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [attendeeId, setAttendeeId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [days, setDays] = useState<string[]>([])
  const [rooms, setRooms] = useState<string[]>([])

  // Cargar tema
  const { colors } = useTheme(profile?.congress_id)

  useEffect(() => {
    load()
  }, [])

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
    setAttendeeId(profileData.id)

    // Cargar eventos guardados
    const { data: savedData } = await supabase
      .from('attendee_schedule')
      .select('id, event_id, added_at')
      .eq('attendee_id', profileData.id)
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

    // Extraer días únicos
    const uniqueDays = [...new Set(
      enriched.map(item => new Date(item.event.date).toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }))
    )]
    setDays(uniqueDays)

    // Extraer salas únicas
    const uniqueRooms = [...new Set(
      enriched
        .filter(item => item.room_name)
        .map(item => item.room_name!)
    )]
    setRooms(uniqueRooms)

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

  // Filtrar eventos
  let filteredEvents = savedEvents

  if (selectedDay !== 'all') {
    filteredEvents = filteredEvents.filter(item => {
      const eventDay = new Date(item.event.date).toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })
      return eventDay === selectedDay
    })
  }

  if (selectedRoom !== 'all') {
    filteredEvents = filteredEvents.filter(item => item.room_name === selectedRoom)
  }

  // Agrupar por día
  const eventsByDay = filteredEvents.reduce((acc, item) => {
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: colors.accent }}></div>
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div style={{ background: `linear-gradient(to right, ${colors.header_from}, ${colors.header_to})` }}>
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <Link
              href="/asistente/inicio"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
              style={{ color: colors.header_text }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold" style={{ color: colors.header_text }}>Mi Horario</h1>
              <p className="text-sm mt-0.5" style={{ color: colors.header_text, opacity: 0.8 }}>Eventos que agregaste</p>
            </div>
          </div>
        </div>
        <div className="h-1" style={{ backgroundColor: colors.divider_color }}></div>
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
              className="inline-block text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              style={{ backgroundColor: colors.accent }}
            >
              Ver Horarios
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.accent}15` }}>
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de eventos</p>
                  <p className="text-2xl font-bold text-gray-900">{savedEvents.length}</p>
                </div>
              </div>
            </div>

            {/* Tabs de días */}
            {days.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-600 mb-2">Filtrar por día:</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => {
                      setSelectedDay('all')
                      setSelectedRoom('all')
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedDay === 'all'
                        ? 'text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                    }`}
                    style={selectedDay === 'all' ? { backgroundColor: colors.accent } : {}}
                  >
                    Todos
                  </button>
                  {days.map(day => (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedDay(day)
                        setSelectedRoom('all')
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedDay === day
                          ? 'text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                      }`}
                      style={selectedDay === day ? { backgroundColor: colors.accent } : {}}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs de salas */}
            {rooms.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-gray-600 mb-2">Filtrar por sala:</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => setSelectedRoom('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedRoom === 'all'
                        ? 'text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                    }`}
                    style={selectedRoom === 'all' ? { backgroundColor: colors.accent } : {}}
                  >
                    Todas
                  </button>
                  {rooms.map(room => (
                    <button
                      key={room}
                      onClick={() => setSelectedRoom(room)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedRoom === room
                          ? 'text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                      }`}
                      style={selectedRoom === room ? { backgroundColor: colors.accent } : {}}
                    >
                      {room}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Eventos */}
            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🔍</span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Sin eventos</h3>
                <p className="text-sm text-gray-500">No hay eventos con estos filtros</p>
              </div>
            ) : (
              <div className="space-y-8">
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
                                <p className="text-sm font-medium" style={{ color: colors.accent }}>
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
          </>
        )}
      </div>
    </div>
  )
}