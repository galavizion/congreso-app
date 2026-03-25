'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegalosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [totalPoints, setTotalPoints] = useState(0)
  const [gifts, setGifts] = useState<any[]>([])
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'attendee') { router.push('/login'); return }

      const { data: pointsData } = await supabase
        .from('points')
        .select('total_points')
        .eq('attendee_id', session.user.id)
        .maybeSingle()

      setTotalPoints(pointsData?.total_points ?? 0)

      const { data: giftsData } = await supabase
        .from('gifts')
        .select('*')
        .gt('stock', 0)
        .order('points_cost', { ascending: true })

      setGifts(giftsData ?? [])

      const { data: redemptionsData } = await supabase
        .from('redemptions')
        .select('*, gifts(*)')
        .eq('attendee_id', session.user.id)
        .order('redeemed_at', { ascending: false })

      setRedemptions(redemptionsData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleRedeem(gift: any) {
    setRedeeming(gift.id)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    try {
      if (totalPoints < gift.points_cost) {
        alert('No tienes suficientes puntos')
        setRedeeming(null)
        return
      }

      if (gift.stock <= 0) {
        alert('Este regalo ya no está disponible')
        setRedeeming(null)
        return
      }

      const { data: pointsData } = await supabase
        .from('points')
        .select('*')
        .eq('attendee_id', session.user.id)
        .maybeSingle()

      if (!pointsData) {
        alert('Error al obtener puntos')
        setRedeeming(null)
        return
      }

      const { error: updateError } = await supabase
        .from('points')
        .update({ total_points: pointsData.total_points - gift.points_cost })
        .eq('id', pointsData.id)

      if (updateError) {
        alert('Error al descontar puntos')
        setRedeeming(null)
        return
      }

      const { error: stockError } = await supabase
        .from('gifts')
        .update({ stock: gift.stock - 1 })
        .eq('id', gift.id)

      if (stockError) {
        await supabase
          .from('points')
          .update({ total_points: pointsData.total_points })
          .eq('id', pointsData.id)

        alert('Error al actualizar stock')
        setRedeeming(null)
        return
      }

      const { error: redemptionError } = await supabase
        .from('redemptions')
        .insert({
          attendee_id: session.user.id,
          gift_id: gift.id,
          points_spent: gift.points_cost,
          status: 'pending',
        })

      if (redemptionError) {
        alert('Error al registrar canje')
        setRedeeming(null)
        return
      }

      window.location.reload()

    } catch (error) {
      console.error('Error en canje:', error)
      alert('Ocurrió un error al canjear')
      setRedeeming(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Cargando regalos...</p>
        </div>
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
                href="/asistente/inicio"
                className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Regalos</h1>
                <p className="text-sm text-white/80 mt-0.5">Canjea tus puntos</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-white bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded-lg">
              ⭐ {totalPoints} pts
            </span>
          </div>
        </div>
        <div className="h-1 bg-rose-400"></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto flex flex-col gap-6 pb-20">

        {/* Regalos disponibles */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
            Catálogo disponible
          </h2>

          {gifts.length === 0 ? (
            <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎁</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin regalos disponibles</h3>
              <p className="text-sm text-gray-500">No hay regalos disponibles por ahora</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gifts.map(gift => {
                const canRedeem = totalPoints >= gift.points_cost
                const pointsNeeded = gift.points_cost - totalPoints

                return (
                  <div
                    key={gift.id}
                    className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-200 ${
                      canRedeem ? 'border-gray-100 hover:border-gray-200 hover:shadow-md' : 'border-gray-100 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-4 p-5">
                      {gift.image_url ? (
                        <img
                          src={gift.image_url}
                          alt={gift.name}
                          className="w-14 h-14 rounded-lg object-cover border border-gray-100 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                          <span className="text-2xl">🎁</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{gift.name}</h3>
                        {gift.description && (
                          <p className="text-sm text-gray-500 truncate mt-0.5 line-clamp-1">{gift.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                            ⭐ {gift.points_cost} pts
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
                            gift.stock > 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                          }`}>
                            {gift.stock} disponibles
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRedeem(gift)}
                        disabled={!canRedeem || redeeming === gift.id}
                        className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          canRedeem && redeeming !== gift.id
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {redeeming === gift.id ? (
                          <span className="flex items-center gap-1.5">
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Canjeando
                          </span>
                        ) : canRedeem ? (
                          'Canjear'
                        ) : (
                          `${pointsNeeded} pts`
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Mis canjeos */}
        {redemptions.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
              Mis canjeos
            </h2>

            <div className="space-y-3">
              {redemptions.map(redemption => (
                <div
                  key={redemption.id}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-4"
                >
                  {redemption.gifts?.image_url ? (
                    <img
                      src={redemption.gifts.image_url}
                      alt={redemption.gifts?.name}
                      className="w-14 h-14 rounded-lg object-cover border border-gray-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                      <span className="text-2xl">🎁</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {redemption.gifts?.name || 'Regalo'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(redemption.redeemed_at).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <span className={`text-xs font-semibold px-2 py-1 rounded-md whitespace-nowrap ${
                    redemption.status === 'delivered'
                      ? 'bg-green-50 text-green-700'
                      : redemption.status === 'cancelled'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {redemption.status === 'delivered' ? '✓ Entregado' :
                     redemption.status === 'cancelled' ? '✗ Cancelado' : '⏱ Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
