'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function StandDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [stand, setStand] = useState<any>(null)
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

      if (!profile || profile.role !== 'congress') {
        router.push('/login')
        return
      }

      // Cargar stand
      const { data: standData } = await supabase
        .from('stands')
        .select('*')
        .eq('id', params.id)
        .eq('congress_id', profile.congress_id)
        .single()

      if (!standData) {
        router.push('/congreso/stands')
        return
      }

      setStand(standData)

      // Cargar leads SIN join
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('stand_id', params.id)
        .order('created_at', { ascending: false })

      // Cargar perfiles de esos leads
      const attendeeIds = leadsData?.map(l => l.attendee_id) ?? []
      const { data: profilesData } = attendeeIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', attendeeIds)
        : { data: [] }

      // Combinar datos
      const leadsWithProfiles = leadsData?.map(lead => ({
        ...lead,
        profile: profilesData?.find(p => p.id === lead.attendee_id) || null
      })) ?? []

      setLeads(leadsWithProfiles)
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!stand) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <p className="text-gray-400">Stand no encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <Link
                href="/congreso/stands"
                className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">{stand.name}</h1>
                <p className="text-sm text-white/80 mt-0.5">{stand.brand || 'Sin marca'}</p>
              </div>
            </div>
            <Link
              href={`/congreso/stands/${stand.id}/editar`}
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-white/30 transition-all"
            >
              Editar
            </Link>
          </div>
        </div>
        <div className="h-1 bg-cyan-400"></div>
      </div>

      <div className="px-6 py-8 flex flex-col gap-4 max-w-5xl mx-auto">

        {/* Datos del stand */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          {stand.logo_url && (
            <img
              src={stand.logo_url}
              alt={stand.name}
              className="w-20 h-20 rounded-lg object-cover border border-gray-100 mb-4"
            />
          )}

          <p className="text-sm font-semibold text-gray-700 mb-3">Información</p>

          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-gray-400">Marca</p>
              <p className="text-sm text-gray-900">{stand.brand || 'Sin marca'}</p>
            </div>

            {stand.description && (
              <div>
                <p className="text-xs text-gray-400">Descripción</p>
                <p className="text-sm text-gray-900">{stand.description}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400">QR Code</p>
              <p className="text-sm text-gray-900 font-mono">{stand.qr_code}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Leads capturados</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{leads.length}</p>
        </div>

        {/* Leads capturados */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">Lista de leads</p>

          {leads.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Aún no hay leads registrados
            </p>
          ) : (
            <div className="flex flex-col gap-0">
              {leads.map(lead => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {lead.profile?.name || 'Asistente'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {lead.profile?.email || 'Sin email'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(lead.created_at).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
