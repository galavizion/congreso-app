'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CongresoRegalosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [gifts, setGifts] = useState<any[]>([])
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

      if (!profile || profile.role !== 'congress') { router.push('/login'); return }

      const { data: congress } = await supabase
        .from('congresses')
        .select('*')
        .eq('id', profile.congress_id)
        .single()

      const { data: giftsData } = await supabase
        .from('gifts')
        .select('*')
        .eq('congress_id', congress?.id)
        .order('created_at', { ascending: false })

      setGifts(giftsData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/congreso/dashboard" className="text-gray-400 text-xl">‹</Link>
          <h1 className="text-lg font-semibold text-gray-900">Regalos</h1>
        </div>
        <Link
          href="/congreso/regalos/nuevo"
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          + Nuevo
        </Link>
      </div>

      <div className="px-4 py-6 flex flex-col gap-3 max-w-2xl mx-auto">

        {gifts.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            No hay regalos registrados aún.
          </div>
        )}

        {gifts.map(gift => (
          <div key={gift.id} className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{gift.name}</p>
              {gift.description && (
                <p className="text-sm text-gray-400 mt-0.5">{gift.description}</p>
              )}
              <div className="flex gap-3 mt-2">
                <span className="text-sm font-medium text-amber-600">
                  {gift.points_cost} puntos
                </span>
                <span className="text-sm text-gray-400">
                  {gift.stock} disponibles
                </span>
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}
