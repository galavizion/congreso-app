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
              href="/congreso/dashboard"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Asistentes</h1>
              <p className="text-sm text-white/80 mt-0.5">Lista de registrados</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-amber-400"></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">

        {/* Stats */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Total registrados</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{attendees.length}</p>
        </div>

        {attendees.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay asistentes</h3>
            <p className="text-sm text-gray-500">Aún no se han registrado asistentes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attendees.map(attendee => (
              <div
                key={attendee.id}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">{attendee.name ?? 'Sin nombre'}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{attendee.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(attendee.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                  <span>⭐</span>
                  {attendee.totalPoints} pts
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
