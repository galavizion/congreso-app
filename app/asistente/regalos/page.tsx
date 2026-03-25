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
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#667eea] rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Cargando regalos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">

      {/* Header con Gradiente */}
      <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/asistente/inicio" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-xl">
            ‹
          </Link>
          <h1 className="text-white text-xl font-bold">Regalos</h1>
          <div className="w-10"></div>
        </div>

        {/* Card de Puntos */}
        <div className="bg-white/20 backdrop-blur-md rounded-3xl p-5 border border-white/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wide font-semibold">Tus puntos</p>
              <p className="text-white text-4xl font-bold mt-1">{totalPoints}</p>
            </div>
            <div className="text-5xl">🎯</div>
          </div>
          
          {/* Progress bar */}
          {gifts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-white/70 text-xs mb-2">
                {totalPoints >= gifts[0].points_cost 
                  ? '¡Puedes canjear regalos!' 
                  : `${gifts[0].points_cost - totalPoints} pts para tu primer regalo`}
              </p>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((totalPoints / (gifts[0]?.points_cost || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-6 flex flex-col gap-6 max-w-2xl mx-auto pb-20">

        {/* Regalos disponibles */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
            Catálogo disponible
          </h2>

          {gifts.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
              <div className="text-6xl mb-4">🎁</div>
              <p className="text-gray-400 text-sm">No hay regalos disponibles por ahora</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {gifts.map(gift => {
              const canRedeem = totalPoints >= gift.points_cost
              const pointsNeeded = gift.points_cost - totalPoints
              
              return (
                <div
                  key={gift.id}
                  className={`group relative bg-white rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                    canRedeem 
                      ? 'border-transparent shadow-[4px_4px_0px_0px_rgba(102,126,234,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(102,126,234,0.4)] hover:scale-[1.02]' 
                      : 'border-gray-100 opacity-75'
                  }`}
                >
                  {/* Imagen en círculo */}
                  {gift.image_url ? (
                    <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 p-8 flex items-center justify-center">
                      <div className="relative">
                        {/* Círculo decorativo de fondo */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 rounded-full blur-2xl"></div>
                        
                        {/* Imagen en círculo */}
                        <img 
                          src={gift.image_url} 
                          alt={gift.name}
                          className="relative w-40 h-40 object-cover rounded-full border-4 border-white shadow-2xl"
                        />
                      </div>
                      
                      {!canRedeem && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full">
                            <p className="text-gray-900 text-sm font-bold">
                              Necesitas {pointsNeeded} pts más
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-8 flex items-center justify-center">
                      <div className="w-40 h-40 rounded-full bg-white/50 flex items-center justify-center">
                        <span className="text-6xl">🎁</span>
                      </div>
                    </div>
                  )}

                  {/* Contenido */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 leading-tight">{gift.name}</h3>
                        {gift.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{gift.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                            {gift.points_cost}
                          </span>
                          <span className="text-sm font-semibold text-amber-600">pts</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {gift.stock} disponibles
                        </p>
                      </div>

                      <button
                        onClick={() => handleRedeem(gift)}
                        disabled={!canRedeem || redeeming === gift.id}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                          canRedeem && redeeming !== gift.id
                            ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/50 active:scale-95'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {redeeming === gift.id ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                </div>
              )
            })}
          </div>
        </div>

        {/* Mis canjeos */}
        {redemptions.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
              Mis canjeos
            </h2>

            <div className="flex flex-col gap-3">
              {redemptions.map(redemption => (
                <div
                  key={redemption.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4"
                >
                  {redemption.gifts?.image_url ? (
                    <img 
                      src={redemption.gifts.image_url} 
                      alt={redemption.gifts?.name}
                      className="w-14 h-14 rounded-xl object-cover border-2 border-gray-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-xl border-2 border-gray-100">
                      🎁
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
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

                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${
                    redemption.status === 'delivered'
                      ? 'bg-green-100 text-green-700'
                      : redemption.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
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