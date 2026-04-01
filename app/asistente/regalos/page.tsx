'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/hooks/useTheme'

type Gift = {
  id: string
  name: string
  description: string | null
  points_cost: number
  stock: number
  image_url: string | null
}

export default function RegalosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [attendeeId, setAttendeeId] = useState<string | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)
  const [gifts, setGifts] = useState<Gift[]>([])
  const [redeemedGiftIds, setRedeemedGiftIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [filterRange, setFilterRange] = useState<'all' | 'low' | 'mid' | 'high'>('all')

  // Cargar tema
  const { colors } = useTheme(profile?.congress_id)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!profileData || profileData.role !== 'attendee') { router.push('/login'); return }

    setProfile(profileData)
    setAttendeeId(profileData.id)
    setTotalPoints(profileData.points ?? 0)

    // Cargar todos los regalos del congreso
    const { data: giftsData } = await supabase
      .from('gifts')
      .select('*')
      .eq('congress_id', profileData.congress_id)
      .order('points_cost', { ascending: true })

    setGifts(giftsData ?? [])

    // Cargar IDs de regalos ya canjeados
    const { data: redemptionsData } = await supabase
      .from('redemptions')
      .select('gift_id')
      .eq('attendee_id', profileData.id)

    if (redemptionsData) {
      setRedeemedGiftIds(new Set(redemptionsData.map(r => r.gift_id)))
    }

    setLoading(false)
  }

  async function handleRedeem(gift: Gift) {
    if (!attendeeId) return

    setRedeeming(gift.id)

    try {
      if (totalPoints < gift.points_cost) {
        alert('No tienes suficientes puntos')
        setRedeeming(null)
        return
      }

      if (gift.stock <= 0) {
        alert('Este regalo está agotado')
        setRedeeming(null)
        return
      }

      // Descontar puntos del perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: totalPoints - gift.points_cost })
        .eq('id', attendeeId)

      if (updateError) {
        alert('Error al descontar puntos: ' + updateError.message)
        setRedeeming(null)
        return
      }

      // Reducir stock
      const { error: stockError } = await supabase
        .from('gifts')
        .update({ stock: gift.stock - 1 })
        .eq('id', gift.id)

      if (stockError) {
        // Rollback: devolver puntos
        await supabase
          .from('profiles')
          .update({ points: totalPoints })
          .eq('id', attendeeId)

        alert('Error al actualizar stock: ' + stockError.message)
        setRedeeming(null)
        return
      }

      // Registrar canje
      const { error: redemptionError } = await supabase
        .from('redemptions')
        .insert({
          attendee_id: attendeeId,
          gift_id: gift.id,
          points_spent: gift.points_cost,
          status: 'pending',
        })

      if (redemptionError) {
        alert('Error al registrar canje: ' + redemptionError.message)
        setRedeeming(null)
        return
      }

      // Recargar
      window.location.reload()

    } catch (error) {
      console.error('Error en canje:', error)
      alert('Ocurrió un error al canjear')
      setRedeeming(null)
    }
  }

  // Filtrar regalos por rango de puntos
  const filteredGifts = gifts.filter(gift => {
    if (filterRange === 'all') return true
    if (filterRange === 'low') return gift.points_cost <= 50
    if (filterRange === 'mid') return gift.points_cost > 50 && gift.points_cost <= 100
    if (filterRange === 'high') return gift.points_cost > 100
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: colors.accent }}></div>
          <p className="text-sm text-gray-500">Cargando regalos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div style={{ background: `linear-gradient(to right, ${colors.header_from}, ${colors.header_to})` }}>
        <div className="px-6 py-6">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <Link
                href="/asistente/inicio"
                className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
                style={{ color: colors.header_text }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold" style={{ color: colors.header_text }}>Regalos</h1>
                <p className="text-sm mt-0.5" style={{ color: colors.header_text, opacity: 0.8 }}>Canjea tus puntos</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded-lg" style={{ color: colors.header_text }}>
              ⭐ {totalPoints} pts
            </span>
          </div>
        </div>
        <div className="h-1" style={{ backgroundColor: colors.divider_color }}></div>
      </div>

      <div className="px-6 py-6 max-w-5xl mx-auto">
        {/* Filtros por rango de puntos */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-600 mb-2">Filtrar por puntos:</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilterRange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterRange === 'all'
                  ? 'text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
              style={filterRange === 'all' ? { backgroundColor: colors.accent } : {}}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterRange('low')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterRange === 'low'
                  ? 'text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
              style={filterRange === 'low' ? { backgroundColor: colors.accent } : {}}
            >
              1-50 pts
            </button>
            <button
              onClick={() => setFilterRange('mid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterRange === 'mid'
                  ? 'text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
              style={filterRange === 'mid' ? { backgroundColor: colors.accent } : {}}
            >
              51-100 pts
            </button>
            <button
              onClick={() => setFilterRange('high')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterRange === 'high'
                  ? 'text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
              style={filterRange === 'high' ? { backgroundColor: colors.accent } : {}}
            >
              +100 pts
            </button>
          </div>
        </div>

        {/* Grid de regalos */}
        {filteredGifts.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎁</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin regalos</h3>
            <p className="text-sm text-gray-500">No hay regalos en este rango</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredGifts.map(gift => {
              const canRedeem = totalPoints >= gift.points_cost && gift.stock > 0
              const alreadyRedeemed = redeemedGiftIds.has(gift.id)
              const isLowStock = gift.stock > 0 && gift.stock <= 3

              return (
                <div
                  key={gift.id}
                  className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all relative"
                >
                  {/* Imagen */}
                  <div className="relative w-full h-32 bg-gray-50">
                    {gift.image_url ? (
                      <img
                        src={gift.image_url}
                        alt={gift.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">🎁</span>
                      </div>
                    )}

                    {/* Badge único - prioridad: canjeado > agotado > últimos */}
                    <div className="absolute top-2 right-2">
                      {alreadyRedeemed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-green-600 px-2 py-1 rounded-md shadow-sm">
                          ✓ Canjeado
                        </span>
                      ) : gift.stock === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-red-600 px-2 py-1 rounded-md shadow-sm">
                          Agotado
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-orange-600 px-2 py-1 rounded-md shadow-sm">
                          Últimos {gift.stock}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">{gift.name}</h3>
                    
                    {gift.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{gift.description}</p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600">
                        ⭐ {gift.points_cost} pts
                      </span>
                    </div>

                    <button
                      onClick={() => handleRedeem(gift)}
                      disabled={!canRedeem || alreadyRedeemed || redeeming === gift.id}
                      className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
                        canRedeem && !alreadyRedeemed && redeeming !== gift.id
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      style={canRedeem && !alreadyRedeemed && redeeming !== gift.id ? { backgroundColor: colors.accent } : {}}
                    >
                      {redeeming === gift.id ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Canjeando...
                        </span>
                      ) : alreadyRedeemed ? (
                        '✓ Ya canjeaste'
                      ) : gift.stock === 0 ? (
                        'Agotado'
                      ) : !canRedeem ? (
                        `Te faltan ${gift.points_cost - totalPoints} pts`
                      ) : (
                        'Canjear'
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}