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

  function exportToCSV() {
    if (leads.length === 0) {
      alert('No hay leads para exportar')
      return
    }

    const headers = ['Nombre', 'Email', 'Empresa', 'Posición', 'Fecha de captura', 'Puntos otorgados']
    const rows = leads.map(lead => [
      lead.attendeeProfile?.name || 'Sin nombre',
      lead.attendeeProfile?.email || '',
      lead.attendeeProfile?.company || '',
      lead.attendeeProfile?.position || '',
      new Date(lead.scanned_at).toLocaleString('es-MX'),
      lead.points_awarded || 0
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

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
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
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

            {leads.length > 0 && (
              <button
                onClick={exportToCSV}
                className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-white/30 transition-all flex items-center gap-2"
              >
                <span>📥</span>
                <span className="hidden sm:inline">Exportar</span>
              </button>
            )}
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
            <p className="text-sm text-gray-500 mb-4">Comparte tu QR con los asistentes</p>
            <Link
              href="/stand/mi-qr"
              className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ver mi QR
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map(lead => (
              <div
                key={lead.id}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">
                      {lead.attendeeProfile?.name ?? 'Sin nombre'}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {lead.attendeeProfile?.email}
                    </p>
                    {lead.attendeeProfile?.company && (
                      <p className="text-sm text-gray-600 mt-1">
                        🏢 {lead.attendeeProfile.company}
                      </p>
                    )}
                    {lead.attendeeProfile?.position && (
                      <p className="text-xs text-gray-500">
                        {lead.attendeeProfile.position}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      📅 {new Date(lead.scanned_at).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                    +{lead.points_awarded} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}