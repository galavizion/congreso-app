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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    )
  }

  if (!stand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Stand no encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/congreso/stands" className="text-gray-400 text-xl">‹</Link>
          <h1 className="text-lg font-semibold text-gray-900">{stand.name}</h1>
        </div>
        <Link
          href={`/congreso/stands/${stand.id}/editar`}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Editar
        </Link>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">

        {/* Datos del stand */}
        <div className="bg-white rounded-2xl p-5">
          {stand.logo_url && (
            <img 
              src={stand.logo_url} 
              alt={stand.name}
              className="w-24 h-24 rounded-xl object-cover mb-4"
            />
          )}

          <p className="text-sm font-medium text-gray-500 mb-3">Información</p>
          
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

        {/* Leads capturados */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Leads capturados</p>
            <span className="text-xs text-gray-400">{leads.length} total</span>
          </div>

          {leads.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Aún no hay leads registrados
            </p>
          ) : (
            <div className="flex flex-col gap-2">
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