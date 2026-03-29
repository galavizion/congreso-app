'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Redemption = {
  id: string
  gift_id: string
  attendee_id: string
  redeemed_at: string
  status: string
  points_spent: number
  gift_name: string
  gift_image: string | null
}

type Attendee = {
  id: string
  name: string
  email: string
  points: number
}

export default function StoreDashboard() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null)
  const [pendingRedemptions, setPendingRedemptions] = useState<Redemption[]>([])
  const [completedToday, setCompletedToday] = useState<Redemption[]>([])
  const [marking, setMarking] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      window.location.href = '/login'
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'store') {
      window.location.href = '/login'
      return
    }

    setLoading(false)
    loadCompletedToday()
  }

  async function loadCompletedToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: redemptions } = await supabase
      .from('redemptions')
      .select(`
        id,
        gift_id,
        attendee_id,
        redeemed_at,
        status,
        points_spent
      `)
      .eq('status', 'completed')
      .gte('redeemed_at', today.toISOString())
      .order('redeemed_at', { ascending: false })

    if (!redemptions) return

    // Get gift names
    const giftIds = [...new Set(redemptions.map(r => r.gift_id))]
    const { data: gifts } = await supabase
      .from('gifts')
      .select('id, name, image_url')
      .in('id', giftIds)

    const enriched = redemptions.map(r => ({
      ...r,
      gift_name: gifts?.find(g => g.id === r.gift_id)?.name || 'Desconocido',
      gift_image: gifts?.find(g => g.id === r.gift_id)?.image_url || null
    }))

    setCompletedToday(enriched)
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return

    // Search by email or name
    const { data: attendees } = await supabase
      .from('profiles')
      .select('id, name, email, points')
      .eq('role', 'attendee')
      .or(`email.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
      .limit(10)

    if (attendees && attendees.length > 0) {
      loadAttendeeRedemptions(attendees[0])
    } else {
      alert('No se encontró ningún asistente con ese email o nombre')
    }
  }

  async function loadAttendeeRedemptions(attendee: Attendee) {
    setSelectedAttendee(attendee)

    // Load pending redemptions
    const { data: redemptions } = await supabase
      .from('redemptions')
      .select(`
        id,
        gift_id,
        attendee_id,
        redeemed_at,
        status,
        points_spent
      `)
      .eq('attendee_id', attendee.id)
      .eq('status', 'pending')
      .order('redeemed_at', { ascending: false })

    if (!redemptions || redemptions.length === 0) {
      setPendingRedemptions([])
      return
    }

    // Get gift details
    const giftIds = [...new Set(redemptions.map(r => r.gift_id))]
    const { data: gifts } = await supabase
      .from('gifts')
      .select('id, name, image_url')
      .in('id', giftIds)

    const enriched = redemptions.map(r => ({
      ...r,
      gift_name: gifts?.find(g => g.id === r.gift_id)?.name || 'Desconocido',
      gift_image: gifts?.find(g => g.id === r.gift_id)?.image_url || null
    }))

    setPendingRedemptions(enriched)
  }

  async function handleMarkAsDelivered(redemptionId: string) {
    setMarking(redemptionId)

    const { error } = await supabase
      .from('redemptions')
      .update({ status: 'completed' })
      .eq('id', redemptionId)

    if (error) {
      alert('Error al marcar como entregado: ' + error.message)
      setMarking(null)
      return
    }

    // Reload data
    if (selectedAttendee) {
      loadAttendeeRedemptions(selectedAttendee)
    }
    loadCompletedToday()
    setMarking(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9] text-white">
        <div className="px-4 py-4">
          <button
            onClick={handleLogout}
            className="text-white/80 hover:text-white text-sm mb-3 flex items-center gap-1"
          >
            ← Cerrar sesión
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-3xl">🏪</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">Tienda de Canjes</h1>
              <p className="text-white/80 text-xs mt-1">Entrega de premios</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Search Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-bold text-gray-900 mb-3">Buscar Asistente</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Email o nombre del asistente"
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <button
              onClick={handleSearch}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Buscar
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Busca por email o nombre para ver los premios pendientes
          </p>
        </div>

        {/* Selected Attendee Info */}
        {selectedAttendee && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">{selectedAttendee.name}</h3>
                <p className="text-sm text-gray-500">{selectedAttendee.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Puntos disponibles</p>
                <p className="text-2xl font-bold text-amber-600">{selectedAttendee.points}</p>
              </div>
            </div>

            {/* Pending Redemptions */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Premios Pendientes ({pendingRedemptions.length})
              </h4>

              {pendingRedemptions.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No hay premios pendientes de entrega
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRedemptions.map((redemption) => (
                    <div
                      key={redemption.id}
                      className="bg-gray-50 rounded-lg p-4 flex items-center gap-4"
                    >
                      {redemption.gift_image ? (
                        <img 
                          src={redemption.gift_image} 
                          alt={redemption.gift_name}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-3xl">🎁</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-gray-900">{redemption.gift_name}</h5>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-600">
                            {new Date(redemption.redeemed_at).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-xs font-semibold text-amber-600">
                            {redemption.points_spent} pts
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleMarkAsDelivered(redemption.id)}
                        disabled={marking === redemption.id}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {marking === redemption.id ? 'Marcando...' : 'Entregar'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Today's Deliveries */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3">
            Entregas de Hoy ({completedToday.length})
          </h3>

          {completedToday.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No hay entregas registradas hoy
            </div>
          ) : (
            <div className="space-y-2">
              {completedToday.slice(0, 10).map((redemption) => (
                <div
                  key={redemption.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">✓</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {redemption.gift_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(redemption.redeemed_at).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
