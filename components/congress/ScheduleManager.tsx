'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Room = {
  id: string
  name: string
  capacity: number | null
  location: string | null
  eventCount?: number
}

type Event = {
  id: string
  room_id: string
  title: string
  description: string | null
  speaker: string | null
  date: string
  start_time: string
  end_time: string
}

type ScheduleManagerProps = {
  congressId: string
  canEdit?: boolean
}

export default function ScheduleManager({ congressId, canEdit = false }: ScheduleManagerProps) {
  const supabase = createClient()
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  
  // Room form
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [roomCapacity, setRoomCapacity] = useState('')
  const [roomLocation, setRoomLocation] = useState('')
  const [creatingRoom, setCreatingRoom] = useState(false)
  
  // Event form
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventSpeaker, setEventSpeaker] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [creatingEvent, setCreatingEvent] = useState(false)
  
  // Edit room
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [editRoomName, setEditRoomName] = useState('')
  const [editRoomCapacity, setEditRoomCapacity] = useState('')
  const [editRoomLocation, setEditRoomLocation] = useState('')
  
  // Delete room
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null)
  
  // Edit event
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  
  // Delete event
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)
  
  // Selected date filter
  const [selectedDate, setSelectedDate] = useState<string>('')

  useEffect(() => {
    loadRooms()
  }, [congressId])

  useEffect(() => {
    if (selectedRoom) {
      loadEvents(selectedRoom.id)
    }
  }, [selectedRoom])

  async function loadRooms() {
    setLoading(true)
    
    const { data: roomsData } = await supabase
      .from('congress_rooms')
      .select('*')
      .eq('congress_id', congressId)
      .order('created_at', { ascending: true })
    
    if (roomsData) {
      // Contar eventos por sala
      const roomsWithCount = await Promise.all(
        roomsData.map(async (room) => {
          const { count } = await supabase
            .from('congress_events')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
          
          return { ...room, eventCount: count || 0 }
        })
      )
      
      setRooms(roomsWithCount)
    }
    
    setLoading(false)
  }

  async function loadEvents(roomId: string) {
    const { data: eventsData } = await supabase
      .from('congress_events')
      .select('*')
      .eq('room_id', roomId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (eventsData) setEvents(eventsData)
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault()
    setCreatingRoom(true)

    const { error } = await supabase
      .from('congress_rooms')
      .insert([{
        congress_id: congressId,
        name: roomName,
        capacity: roomCapacity ? parseInt(roomCapacity) : null,
        location: roomLocation || null
      }])

    if (!error) {
      setRoomName('')
      setRoomCapacity('')
      setRoomLocation('')
      setShowRoomForm(false)
      loadRooms()
    } else {
      alert('Error: ' + error.message)
    }

    setCreatingRoom(false)
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRoom) return

    setCreatingEvent(true)

    const { error } = await supabase
      .from('congress_events')
      .insert([{
        congress_id: congressId,
        room_id: selectedRoom.id,
        title: eventTitle,
        description: eventDescription || null,
        speaker: eventSpeaker || null,
        date: eventDate,
        start_time: eventStartTime,
        end_time: eventEndTime
      }])

    if (!error) {
      setEventTitle('')
      setEventDescription('')
      setEventSpeaker('')
      setEventDate('')
      setEventStartTime('')
      setEventEndTime('')
      setShowEventForm(false)
      loadEvents(selectedRoom.id)
      loadRooms() // Actualizar contador
    } else {
      alert('Error: ' + error.message)
    }

    setCreatingEvent(false)
  }

  function openEditRoom(room: Room) {
    setEditingRoom(room)
    setEditRoomName(room.name)
    setEditRoomCapacity(room.capacity?.toString() || '')
    setEditRoomLocation(room.location || '')
  }

  async function handleUpdateRoom(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRoom) return

    const { error } = await supabase
      .from('congress_rooms')
      .update({
        name: editRoomName,
        capacity: editRoomCapacity ? parseInt(editRoomCapacity) : null,
        location: editRoomLocation || null
      })
      .eq('id', editingRoom.id)

    if (!error) {
      setEditingRoom(null)
      loadRooms()
      if (selectedRoom?.id === editingRoom.id) {
        setSelectedRoom({ ...editingRoom, name: editRoomName })
      }
    } else {
      alert('Error: ' + error.message)
    }
  }

  async function handleDeleteRoom() {
    if (!deletingRoom) return

    const { error } = await supabase
      .from('congress_rooms')
      .delete()
      .eq('id', deletingRoom.id)

    if (!error) {
      setDeletingRoom(null)
      if (selectedRoom?.id === deletingRoom.id) {
        setSelectedRoom(null)
        setEvents([])
      }
      loadRooms()
    } else {
      alert('Error: ' + error.message)
    }
  }

  async function handleUpdateEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!editingEvent) return

    const { error } = await supabase
      .from('congress_events')
      .update({
        title: eventTitle,
        description: eventDescription || null,
        speaker: eventSpeaker || null,
        date: eventDate,
        start_time: eventStartTime,
        end_time: eventEndTime
      })
      .eq('id', editingEvent.id)

    if (!error) {
      setEditingEvent(null)
      if (selectedRoom) loadEvents(selectedRoom.id)
    } else {
      alert('Error: ' + error.message)
    }
  }

  async function handleDeleteEvent() {
    if (!deletingEvent) return

    const { error } = await supabase
      .from('congress_events')
      .delete()
      .eq('id', deletingEvent.id)

    if (!error) {
      setDeletingEvent(null)
      if (selectedRoom) {
        loadEvents(selectedRoom.id)
        loadRooms() // Actualizar contador
      }
    } else {
      alert('Error: ' + error.message)
    }
  }

  function openEditEvent(event: Event) {
    setEditingEvent(event)
    setEventTitle(event.title)
    setEventDescription(event.description || '')
    setEventSpeaker(event.speaker || '')
    setEventDate(event.date)
    setEventStartTime(event.start_time)
    setEventEndTime(event.end_time)
    setShowEventForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  // Vista de sala seleccionada (eventos)
  if (selectedRoom) {
    const uniqueDates = [...new Set(events.map(e => e.date))].sort()
    const filteredEvents = selectedDate 
      ? events.filter(e => e.date === selectedDate)
      : events

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedRoom(null)}
              className="text-indigo-600 hover:text-indigo-700"
            >
              ← Volver
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-bold text-gray-900 text-lg">{selectedRoom.name}</h2>
          {selectedRoom.location && (
            <p className="text-gray-600 text-sm">📍 {selectedRoom.location}</p>
          )}
          {selectedRoom.capacity && (
            <p className="text-gray-600 text-sm">👥 Capacidad: {selectedRoom.capacity}</p>
          )}
        </div>

        {/* Filtro por fecha */}
        {uniqueDates.length > 0 && (
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-2">
              <button
                onClick={() => setSelectedDate('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  selectedDate === ''
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                Todos
              </button>
              {uniqueDates.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedDate === date
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700'
                  }`}
                >
                  {new Date(date + 'T00:00:00').toLocaleDateString('es-MX', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Botón agregar evento */}
        {canEdit && !showEventForm && (
          <button
            onClick={() => setShowEventForm(true)}
            className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 font-medium"
          >
            + Agregar Evento
          </button>
        )}

        {/* Formulario crear/editar evento */}
        {showEventForm && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">
              {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
            </h3>
            <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Ponente
                </label>
                <input
                  type="text"
                  value={eventSpeaker}
                  onChange={(e) => setEventSpeaker(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  placeholder="Ej: Dr. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Hora inicio *
                  </label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Hora fin *
                  </label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 text-sm"
                >
                  {creatingEvent ? 'Guardando...' : editingEvent ? 'Guardar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEventForm(false)
                    setEditingEvent(null)
                    setEventTitle('')
                    setEventDescription('')
                    setEventSpeaker('')
                    setEventDate('')
                    setEventStartTime('')
                    setEventEndTime('')
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de eventos */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="text-gray-400 text-base mb-1">Sin eventos</div>
            <p className="text-gray-500 text-xs">Agrega el primer evento</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-indigo-600">
                        {event.start_time.substring(0, 5)} - {event.end_time.substring(0, 5)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(event.date + 'T00:00:00').toLocaleDateString('es-MX', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    {event.description && (
                      <p className="text-gray-600 text-xs mt-1">{event.description}</p>
                    )}
                    {event.speaker && (
                      <p className="text-gray-500 text-xs mt-1">🎤 {event.speaker}</p>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openEditEvent(event)}
                      className="flex-1 text-indigo-600 hover:text-indigo-700 text-xs font-medium py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeletingEvent(event)}
                      className="flex-1 text-red-600 hover:text-red-700 text-xs font-medium py-2 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delete Event Modal */}
        {deletingEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Eliminar Evento</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  ¿Eliminar <strong>{deletingEvent.title}</strong>? Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteEvent}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => setDeletingEvent(null)}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Vista principal (lista de salas)
  return (
    <div className="space-y-4">
      {/* Botón agregar sala */}
      {canEdit && !showRoomForm && (
        <button
          onClick={() => setShowRoomForm(true)}
          className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 font-medium"
        >
          + Agregar Sala
        </button>
      )}

      {/* Formulario crear sala */}
      {showRoomForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Nueva Sala</h3>
          <form onSubmit={handleCreateRoom} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="Ej: Sala A"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Capacidad
              </label>
              <input
                type="number"
                value={roomCapacity}
                onChange={(e) => setRoomCapacity(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="Ej: 200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                value={roomLocation}
                onChange={(e) => setRoomLocation(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="Ej: Piso 2"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={creatingRoom}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 text-sm"
              >
                {creatingRoom ? 'Creando...' : 'Crear Sala'}
              </button>
              <button
                type="button"
                onClick={() => setShowRoomForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de salas */}
      {rooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="text-4xl mb-3">🏛️</div>
          <div className="text-gray-400 text-base mb-1">Sin salas</div>
          <p className="text-gray-500 text-xs">Agrega la primera sala</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{room.name}</h3>
                  {room.location && (
                    <p className="text-gray-600 text-xs">📍 {room.location}</p>
                  )}
                  {room.capacity && (
                    <p className="text-gray-600 text-xs">👥 Capacidad: {room.capacity}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedRoom(room)}
                  className="flex-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 font-medium text-sm"
                >
                  Ver Horarios ({room.eventCount || 0})
                </button>
                {canEdit && (
                  <>
                    <button
                      onClick={() => openEditRoom(room)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setDeletingRoom(room)}
                      className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 text-sm"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Room Modal */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Sala</h3>
              <form onSubmit={handleUpdateRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={editRoomName}
                    onChange={(e) => setEditRoomName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidad
                  </label>
                  <input
                    type="number"
                    value={editRoomCapacity}
                    onChange={(e) => setEditRoomCapacity(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={editRoomLocation}
                    onChange={(e) => setEditRoomLocation(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingRoom(null)}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Modal */}
      {deletingRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Eliminar Sala</h3>
              <p className="text-gray-600 mb-6 text-sm">
                ¿Eliminar <strong>{deletingRoom.name}</strong>? Se eliminarán también todos sus eventos. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteRoom}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setDeletingRoom(null)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}