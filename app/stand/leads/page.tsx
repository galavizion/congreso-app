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
              href="/stand/dashboard"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Leads</h1>
              <p className="text-sm text-white/80 mt-0.5">Asistentes que visitaron tu stand</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-cyan-400"></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">

        {/* Stats */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Total de leads</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{leads.length}</p>
        </div>

        {leads.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📱</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aún no hay leads</h3>
            <p className="text-sm text-gray-500">Comparte tu QR con los asistentes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map(lead => (
              <div
                key={lead.id}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {lead.attendeeProfile?.name ?? 'Sin nombre'}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {lead.attendeeProfile?.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(lead.scanned_at).toLocaleString('es-MX')}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-md">
                  +{lead.points_awarded} pts
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
