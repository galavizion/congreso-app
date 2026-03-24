'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AsistentesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [attendees, setAttendees] = useState<any[]>([])
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

      const { data: congress } = await supabase
        .from('congresses')
        .select('*')
        .eq('id', profile.congress_id)
        .single()

      const { data: attendeesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('congress_id', congress?.id)
        .eq('role', 'attendee')
        .order('created_at', { ascending: false })

      const attendeeList = attendeesData ?? []

      if (attendeeList.length > 0) {
        const ids = attendeeList.map((a: any) => a.id)
        const { data: pointsData } = await supabase
          .from('points')
          .select('*')
          .in('attendee_id', ids)

        const pointsByAttendee: Record<string, number> = {}
        for (const p of pointsData ?? []) {
          pointsByAttendee[p.attendee_id] = (pointsByAttendee[p.attendee_id] ?? 0) + p.total_points
        }

        setAttendees(attendeeList.map((a: any) => ({ ...a, totalPoints: pointsByAttendee[a.id] ?? 0 })))
      } else {
        setAttendees([])
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/congreso/dashboard" className="text-gray-400 text-xl">‹</Link>
        <h1 className="text-lg font-semibold text-gray-900">Asistentes</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-3 max-w-2xl mx-auto">

        {/* Resumen */}
        <div className="bg-gray-900 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total registrados</p>
            <p className="text-white text-3xl font-bold mt-0.5">{attendees.length}</p>
          </div>
          <div className="text-4xl">👥</div>
        </div>

        {attendees.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            No hay asistentes registrados aún.
          </div>
        )}

        {attendees.map(attendee => (
          <div
            key={attendee.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-gray-900">{attendee.name ?? 'Sin nombre'}</p>
              <p className="text-sm text-gray-400">{attendee.email}</p>
              <p className="text-xs text-gray-300 mt-0.5">
                {new Date(attendee.created_at).toLocaleDateString('es-MX')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-amber-600 font-semibold">{attendee.totalPoints}</p>
              <p className="text-xs text-gray-400">puntos</p>
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}
