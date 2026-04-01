'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/hooks/useTheme'

type Event = {
  id: string
  title: string
  description: string | null
  speaker: string | null
  date: string
  start_time: string
  end_time: string
  room_id: string | null
  room_name?: string
}

export default function HorariosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set())
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

    // Cargar eventos
    const { data: eventsData, error } = await supabase
      .from('congress_events')
      .select('*')
      .eq('congress_id', profileData.congress_id)
      .order('start_time', { ascending: true })

    console.log('🔍 Events query:', { eventsData, error, congress_id: profileData.congress_id })

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
      eventsData.map(e => new Date(e.date).toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }))
    )]
    setDays(uniqueDays)

    // Extraer salas únicas
    const uniqueRooms = [...new Set(
      enrichedEvents
        .filter(e => e.room_name)
        .map(e => e.room_name!)
    )]
    setRooms(uniqueRooms)

    // Cargar eventos ya guardados
    const { data: savedData } = await supabase
      .from('attendee_schedule')
      .select('event_id')
      .eq('attendee_id', profileData.id)

    if (savedData) {
      setSavedEventIds(new Set(savedData.map(s => s.event_id)))
    }

    setLoading(false)
  }

  async function toggleEvent(eventId: string) {
    console.log('🎯 Trying to save event:', eventId)
    
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
        console.error('❌ Error deleting:', error)
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
        console.error('❌ Error inserting:', error)
        alert('Error al agregar: ' + error.message)
        return
      }

      const newSet = new Set(savedEventIds)
      newSet.add(eventId)
      setSavedEventIds(newSet)
    }
  }

  // Filtrar eventos por día y sala seleccionados
  let filteredEvents = events

  if (selectedDay !== 'all') {
    filteredEvents = filteredEvents.filter(e => {
      const eventDay = new Date(e.date).toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })
      return eventDay === selectedDay
    })
  }

  if (selectedRoom !== 'all') {
    filteredEvents = filteredEvents.filter(e => e.room_name === selectedRoom)
  }

  // Agrupar por sala
  const eventsByRoom = filteredEvents.reduce((acc, event) => {
    const roomKey = event.room_name || 'Sin sala asignada'
    if (!acc[roomKey]) acc[roomKey] = []
    acc[roomKey].push(event)
    return acc
  }, {} as Record<string, Event[]>)

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
              <h1 className="text-xl font-bold" style={{ color: colors.header_text }}>Horarios</h1>
              <p className="text-sm mt-0.5" style={{ color: colors.header_text, opacity: 0.8 }}>Conferencias del congreso</p>
            </div>
          </div>
        </div>
        <div className="h-1" style={{ backgroundColor: colors.divider_color }}></div>
      </div>

      <div className="px-6 py-6 max-w-5xl mx-auto">
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

        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🗓️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin conferencias</h3>
            <p className="text-sm text-gray-500">
              {selectedDay !== 'all' || selectedRoom !== 'all' 
                ? 'No hay conferencias con estos filtros' 
                : 'No hay conferencias programadas'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(eventsByRoom).map(([roomName, roomEvents]) => (
              <div key={roomName}>
                {/* Nombre de sala */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }}></div>
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
                              {event.start_time?.substring(0, 5) || ''}
                            </p>
                            <p className="text-xs text-gray-400">
                              {event.end_time?.substring(0, 5) || ''}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            console.log('🔘 Button clicked, event:', event)
                            toggleEvent(event.id)
                          }}
                          className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                            isSaved
                              ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                              : 'text-white'
                          }`}
                          style={!isSaved ? { backgroundColor: colors.accent } : {}}
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