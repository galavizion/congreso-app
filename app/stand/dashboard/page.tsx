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
      console.log('🔍 Stand Dashboard - Iniciando carga...')
      
      const { data: { session } } = await supabase.auth.getSession()
      console.log('📝 Sesión:', session ? 'Existe' : 'No existe')
      
      if (!session) { 
        console.log('❌ No hay sesión, redirigiendo a login')
        router.push('/login')
        return 
      }

      console.log('👤 User ID:', session.user.id)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      console.log('📋 Profile:', profile)
      console.log('❌ Profile error:', profileError)

      if (!profile) {
        console.log('❌ No se encontró el perfil')
        router.push('/login')
        return
      }

      console.log('🎭 Rol del perfil:', profile.role)

      if (profile.role !== 'stand') { 
        console.log('❌ Rol incorrecto, redirigiendo a login')
        router.push('/login')
        return 
      }

      console.log('🏪 Stand ID del perfil:', profile.stand_id)

      const { data: standData, error: standError } = await supabase
        .from('stands')
        .select('*, congresses(name)')
        .eq('id', profile.stand_id)
        .single()

      console.log('🏢 Stand data:', standData)
      console.log('❌ Stand error:', standError)

      setStand(standData)
      setLoading(false)
      
      console.log('✅ Carga completada')
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Cargando dashboard...</p>
      </div>
    </div>
  )

  if (!stand) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 font-semibold mb-2">No se encontró el stand</p>
        <Link href="/login" className="text-indigo-600 text-sm">Volver al login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <h1 className="text-xl font-bold text-white">
                {stand?.congresses?.name || 'Incentiva'}
              </h1>
              <p className="text-sm text-white/80 mt-0.5">{stand?.name ?? 'Mi stand'}</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-violet-400"></div>
      </div>

      {/* Contenido */}
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <Link
            href="/stand/mi-qr"
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-3">📱</div>
            <h3 className="font-bold text-gray-900 mb-1">Mi código QR</h3>
            <p className="text-sm text-gray-500">Ver mi QR para capturar leads</p>
          </Link>

          <Link
            href="/stand/leads"
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-3">👥</div>
            <h3 className="font-bold text-gray-900 mb-1">Mis Leads</h3>
            <p className="text-sm text-gray-500">Ver asistentes que me visitaron</p>
          </Link>

          <Link
            href="/stand/noticias"
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-3">📰</div>
            <h3 className="font-bold text-gray-900 mb-1">Noticias</h3>
            <p className="text-sm text-gray-500">Publicar novedades del stand</p>
          </Link>

        </div>
      </div>
    </div>
  )
}