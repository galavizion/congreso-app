'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function StandDashboardPage() {
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
        .select('*, congresses(name)')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'stand') { router.push('/login'); return }

      const { data: standData } = await supabase
        .from('stands')
        .select('*, congresses(name)')
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

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <h1 className="text-xl font-bold text-white">{stand?.congresses?.name || 'Incentiva'}</h1>
              <p className="text-sm text-white/80 mt-0.5">{stand?.name ?? 'Mi stand'}</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-cyan-400"></div>
      </div>

      <div className="px-6 py-8 flex flex-col gap-3 max-w-5xl mx-auto">

        <Link
          href="/stand/mi-qr"
          className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
            <span className="text-2xl">📱</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Mi QR</p>
            <p className="text-sm text-gray-500 mt-0.5">Muéstralo para capturar leads</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/stand/noticias"
          className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
            <span className="text-2xl">📢</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Noticias</p>
            <p className="text-sm text-gray-500 mt-0.5">Publica updates de tu stand</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/stand/leads"
          className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Leads</p>
            <p className="text-sm text-gray-500 mt-0.5">Asistentes que escanearon tu QR</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

      </div>
    </div>
  )
}