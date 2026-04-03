'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import LogoutButton from '@/components/shared/LogoutButton'

export default function CongresoDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [congress, setCongress] = useState<any>(null)
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

      const { data: congress } = await supabase
        .from('congresses')
        .select('*')
        .eq('id', profile.congress_id)
        .single()

      setCongress(congress)
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
              <h1 className="text-xl font-bold text-white">{congress?.name || 'Incentiva'}</h1>
              <p className="text-sm text-white/80 mt-0.5">{congress?.name ?? 'Mi congreso'}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
        <div className="h-1 bg-indigo-400"></div>
      </div>

      <div className="px-6 py-8 flex flex-col gap-3 max-w-5xl mx-auto">

        <Link href="/congreso/stands" className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
            <span className="text-2xl">🏪</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Stands</p>
            <p className="text-sm text-gray-500 mt-0.5">Gestiona los expositores</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/congreso/horarios" className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
            <span className="text-2xl">🗓️</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Horarios</p>
            <p className="text-sm text-gray-500 mt-0.5">Conferencias del evento</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/congreso/mapa" className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <span className="text-2xl">🗺️</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Mapa</p>
            <p className="text-sm text-gray-500 mt-0.5">Sube el plano del evento</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/congreso/regalos" className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
            <span className="text-2xl">🎁</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Regalos</p>
            <p className="text-sm text-gray-500 mt-0.5">Administra el catálogo</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/congreso/asistentes" className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Asistentes</p>
            <p className="text-sm text-gray-500 mt-0.5">Lista de registrados</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

      </div>
    </div>
  )
}