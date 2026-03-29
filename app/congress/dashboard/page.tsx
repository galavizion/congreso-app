'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CongressDetail from '@/components/congress/CongressDetail' // Reutiliza componente

export default function CongressDashboard() {
  const [congressId, setCongressId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, congress_id')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'congress' || !profile.congress_id) {
        window.location.href = '/login'
        return
      }

      setCongressId(profile.congress_id)
    }

    checkAuth()
  }, [])

  if (!congressId) return <div>Cargando...</div>

  // Reutiliza el MISMO componente que God Admin, pero pasándole el congress_id fijo
  return <CongressDetail congressId={congressId} />
}