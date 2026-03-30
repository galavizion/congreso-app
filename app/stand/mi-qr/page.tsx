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

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )

  // Quitar slash final de la URL base si existe, y usar stand.id
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://winwin-brown.vercel.app'
  const qrValue = `${baseUrl}/scan/${stand?.id}`

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <Link
              href="/stand/dashboard"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Mi QR</h1>
              <p className="text-sm text-white/80 mt-0.5">Captura leads con este código</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-cyan-400"></div>
      </div>

      <div className="px-6 py-8 flex flex-col items-center gap-4 max-w-sm mx-auto">

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col items-center gap-4 w-full">
          <p className="font-semibold text-gray-900 text-lg">{stand?.name}</p>
          <p className="text-sm text-gray-500">{stand?.brand}</p>

          {/* QR */}
          <div className="p-4 bg-white border border-gray-100 rounded-xl">
            <QRCode value={qrValue} />
          </div>

          <p className="text-xs text-gray-400 text-center">
            Los asistentes escanean este QR para registrar su visita y ganar puntos
          </p>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 w-full border border-amber-100">
          <p className="text-sm text-amber-700 text-center font-medium">
            💡 Imprime este QR y colócalo en tu stand
          </p>
        </div>

      </div>
    </div>
  )
}