'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LeadsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [leads, setLeads] = useState<any[]>([])
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

      if (!profile || profile.role !== 'stand') { router.push('/login'); return }

      const { data: stand } = await supabase
        .from('stands')
        .select('*')
        .eq('id', profile.stand_id)
        .single()

      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('stand_id', stand?.id)
        .order('scanned_at', { ascending: false })

      const leadList = leadsData ?? []

      if (leadList.length > 0) {
        const attendeeIds = leadList.map((l: any) => l.attendee_id)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', attendeeIds)

        const profilesById: Record<string, any> = {}
        for (const p of profilesData ?? []) {
          profilesById[p.id] = p
        }

        setLeads(leadList.map((l: any) => ({ ...l, attendeeProfile: profilesById[l.attendee_id] ?? null })))
      } else {
        setLeads([])
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
        <Link href="/stand/dashboard" className="text-gray-400 text-xl">‹</Link>
        <h1 className="text-lg font-semibold text-gray-900">Leads</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-3 max-w-2xl mx-auto">

        {/* Resumen */}
        <div className="bg-gray-900 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total de leads</p>
            <p className="text-white text-3xl font-bold mt-0.5">{leads.length}</p>
          </div>
          <div className="text-4xl">👥</div>
        </div>

        {leads.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            Aún no hay leads. Comparte tu QR con los asistentes.
          </div>
        )}

        {leads.map(lead => (
          <div
            key={lead.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-gray-900">
                {lead.attendeeProfile?.name ?? 'Sin nombre'}
              </p>
              <p className="text-sm text-gray-400">
                {lead.attendeeProfile?.email}
              </p>
              <p className="text-xs text-gray-300 mt-0.5">
                {new Date(lead.scanned_at).toLocaleString('es-MX')}
              </p>
            </div>
            <span className="text-green-500 text-sm font-medium shrink-0">
              +{lead.points_awarded} pts
            </span>
          </div>
        ))}

      </div>
    </div>
  )
}
