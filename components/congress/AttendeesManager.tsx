'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Attendee = {
  id: string
  name: string
  email: string
  company: string | null
  position: string | null
  points: number
  created_at: string
}

type AttendeesManagerProps = {
  congressId: string
}

export default function AttendeesManager({ congressId }: AttendeesManagerProps) {
  const supabase = createClient()
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null)

  useEffect(() => {
    loadAttendees()
  }, [congressId])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAttendees(attendees)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = attendees.filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          a.email.toLowerCase().includes(term) ||
          (a.company && a.company.toLowerCase().includes(term))
      )
      setFilteredAttendees(filtered)
    }
  }, [searchTerm, attendees])

  async function loadAttendees() {
    setLoading(true)

    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, company, position, points, created_at')
      .eq('congress_id', congressId)
      .eq('role', 'attendee')
      .order('created_at', { ascending: false })

    if (data) {
      setAttendees(data)
      setFilteredAttendees(data)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando asistentes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con búsqueda */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">
            Asistentes ({attendees.length})
          </h3>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, email o empresa..."
            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-400"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {searchTerm && (
          <p className="text-xs text-gray-500 mt-2">
            {filteredAttendees.length} resultado(s) encontrado(s)
          </p>
        )}
      </div>

      {/* Lista de asistentes */}
      {filteredAttendees.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="text-4xl mb-3">👥</div>
          <div className="text-gray-400 text-base mb-1">
            {searchTerm ? 'Sin resultados' : 'Sin asistentes'}
          </div>
          <p className="text-gray-500 text-xs">
            {searchTerm
              ? 'Intenta con otro término de búsqueda'
              : 'Los asistentes aparecerán aquí cuando se registren'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAttendees.map((attendee) => (
            <div
              key={attendee.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-indigo-200 transition-colors cursor-pointer"
              onClick={() => setSelectedAttendee(attendee)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {attendee.name}
                  </h3>
                  <p className="text-gray-600 text-xs truncate">
                    {attendee.email}
                  </p>
                  {attendee.company && (
                    <p className="text-gray-500 text-xs mt-1">
                      🏢 {attendee.company}
                      {attendee.position && ` • ${attendee.position}`}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end ml-3">
                  <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-medium">
                    ⭐ {attendee.points} pts
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(attendee.created_at).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal detalle asistente */}
      {selectedAttendee && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Perfil del Asistente
                </h3>
                <button
                  onClick={() => setSelectedAttendee(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Avatar inicial */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-600">
                      {selectedAttendee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">
                      {selectedAttendee.name}
                    </h4>
                    <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-medium inline-block mt-1">
                      ⭐ {selectedAttendee.points} puntos
                    </div>
                  </div>
                </div>

                {/* Información de contacto */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Email
                    </p>
                    <a
                      href={`mailto:${selectedAttendee.email}`}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      {selectedAttendee.email}
                    </a>
                  </div>

                  {selectedAttendee.company && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Empresa
                      </p>
                      <p className="text-sm text-gray-900">
                        {selectedAttendee.company}
                      </p>
                    </div>
                  )}

                  {selectedAttendee.position && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Cargo
                      </p>
                      <p className="text-sm text-gray-900">
                        {selectedAttendee.position}
                      </p>
                    </div>
                  )}
                </div>

                {/* Fecha de registro */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Fecha de registro
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedAttendee.created_at).toLocaleDateString(
                      'es-MX',
                      {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAttendee(null)}
                className="w-full mt-6 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
