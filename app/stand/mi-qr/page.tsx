'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import QRCode from './QRCode'

export default function MiQRPage() {
  const router = useRouter()
  const supabase = createClient()
  const [stand, setStand] = useState<any>(null)
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

      const { data: standData } = await supabase
        .from('stands')
        .select('*')
        .eq('id', profile.stand_id)
        .single()

      setStand(standData)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>

  const qrValue = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${stand?.qr_code}`

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/stand/dashboard" className="text-gray-400 text-xl">‹</Link>
        <h1 className="text-lg font-semibold text-gray-900">Mi QR</h1>
      </div>

      <div className="px-4 py-8 flex flex-col items-center gap-6 max-w-sm mx-auto">

        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4 w-full">
          <p className="font-semibold text-gray-900 text-lg">{stand?.name}</p>
          <p className="text-sm text-gray-400">{stand?.brand}</p>

          {/* QR */}
          <div className="p-4 bg-white border border-gray-100 rounded-xl">
            <QRCode value={qrValue} />
          </div>

          <p className="text-xs text-gray-400 text-center">
            Los asistentes escanean este QR para registrar su visita y ganar puntos
          </p>
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 w-full">
          <p className="text-sm text-amber-700 text-center font-medium">
            💡 Imprime este QR y colócalo en tu stand
          </p>
        </div>

      </div>
    </div>
  )
}
