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

      const { data: points } = await supabase
        .from('points')
        .select('*')
        .eq('attendee_id', session.user.id)

      setTotalPoints(points?.reduce((acc, p) => acc + p.total_points, 0) ?? 0)

      const { data: giftsData } = await supabase
        .from('gifts')
        .select('*')
        .gt('stock', 0)
        .order('points_cost', { ascending: true })

      setGifts(giftsData ?? [])

      const { data: redemptionsData } = await supabase
        .from('redemptions')
        .select('*')
        .eq('attendee_id', session.user.id)
        .order('redeemed_at', { ascending: false })

      const redemptionList = redemptionsData ?? []

      if (redemptionList.length > 0 && giftsData && giftsData.length > 0) {
        const giftsById: Record<string, any> = {}
        for (const g of giftsData) {
          giftsById[g.id] = g
        }
        setRedemptions(redemptionList.map((r: any) => ({ ...r, giftData: giftsById[r.gift_id] ?? null })))
      } else {
        setRedemptions(redemptionList)
      }

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
    // 1. Verificar puntos y stock
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

    // 2. Obtener puntos actuales
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

    // 3. Descontar puntos
    const { error: updateError } = await supabase
      .from('points')
      .update({ total_points: pointsData.total_points - gift.points_cost })
      .eq('id', pointsData.id)

    if (updateError) {
      alert('Error al descontar puntos')
      setRedeeming(null)
      return
    }

    // 4. Descontar stock
    const { error: stockError } = await supabase
      .from('gifts')
      .update({ stock: gift.stock - 1 })
      .eq('id', gift.id)

    if (stockError) {
      // Revertir puntos si falla
      await supabase
        .from('points')
        .update({ total_points: pointsData.total_points })
        .eq('id', pointsData.id)
      
      alert('Error al actualizar stock')
      setRedeeming(null)
      return
    }

    // 5. Crear registro de canje
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

    // 6. Recargar datos
    window.location.reload()

  } catch (error) {
    console.error('Error en canje:', error)
    alert('Ocurrió un error al canjear')
    setRedeeming(null)
  }
}

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/asistente/inicio" className="text-gray-400 text-xl">‹</Link>
        <h1 className="text-lg font-semibold text-gray-900">Regalos</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">

        {/* Puntos disponibles */}
        <div className="bg-gray-900 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Tus puntos</p>
            <p className="text-white text-3xl font-bold mt-0.5">{totalPoints}</p>
          </div>
          <div className="text-4xl">🎯</div>
        </div>

        {/* Regalos disponibles */}
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Disponibles
        </h2>

        {gifts.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            No hay regalos disponibles por ahora.
          </div>
        )}

        {gifts.map(gift => {
          const canRedeem = totalPoints >= gift.points_cost
          return (
          <div
  key={gift.id}
  className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4"
>
  {/* Imagen del regalo */}
  {gift.image_url && (
    <img 
      src={gift.image_url} 
      alt={gift.name}
      className="w-20 h-20 rounded-xl object-cover shrink-0"
    />
  )}

  <div className="flex-1">
    <p className="font-semibold text-gray-900">{gift.name}</p>
    {gift.description && (
      <p className="text-sm text-gray-400 mt-0.5">{gift.description}</p>
    )}
    <p className="text-sm font-medium text-amber-600 mt-1">
      {gift.points_cost} puntos
    </p>
    <p className="text-xs text-gray-300 mt-0.5">
      {gift.stock} disponibles
    </p>
  </div>

  <button
    onClick={() => handleRedeem(gift)}
    disabled={!canRedeem || redeeming === gift.id}
    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
      canRedeem && redeeming !== gift.id
        ? 'bg-gray-900 text-white active:bg-gray-700'
        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
    }`}
  >
    {redeeming === gift.id ? 'Canjeando...' : canRedeem ? 'Canjear' : 'Sin puntos'}
  </button>

            </div>
          )
        })}

        {/* Mis canjeos */}
        {redemptions.length > 0 && (
          <>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-2">
              Mis canjeos
            </h2>
            {redemptions.map(redemption => (
              <div
                key={redemption.id}
                className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {redemption.giftData?.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(redemption.redeemed_at).toLocaleString('es-MX')}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  redemption.status === 'delivered'
                    ? 'bg-green-50 text-green-600'
                    : redemption.status === 'cancelled'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  {redemption.status === 'delivered' ? 'Entregado' :
                   redemption.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                </span>
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  )
}
