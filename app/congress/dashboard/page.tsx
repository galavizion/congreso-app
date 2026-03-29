'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import MapViewer from '@/components/congress/MapViewer'
import ScheduleManager from '@/components/congress/ScheduleManager'
import NewsManager from '@/components/congress/NewsManager'
import StandsManager from '@/components/congress/StandsManager' 
import AttendeesManager from '@/components/congress/AttendeesManager'

type Congress = {
  id: string
  name: string
  logo_url: string | null
  map_url: string | null 
  created_at: string
}

type CongressUser = {
  id: string
  name: string
  email: string
  created_at: string
}

type Tab = 'general' | 'mapa' | 'horarios' | 'noticias' | 'stands' | 'asistentes'

export default function CongressDashboard() {
  const supabase = createClient()
  const router = useRouter()
  
  // 🔥 CAMBIO PRINCIPAL: Obtener congress_id del profile
  const [congressId, setCongressId] = useState<string | null>(null)
  const [congress, setCongress] = useState<Congress | null>(null)
  const [users, setUsers] = useState<CongressUser[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('general')

  // ... resto del estado igual (showCreateForm, name, email, etc.)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  async function checkAuthAndLoadData() {
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
    loadCongressData(profile.congress_id)
  }

  async function loadCongressData(id: string) {
    setLoading(true)
    
    const { data: congressData } = await supabase
      .from('congresses')
      .select('*')
      .eq('id', id)
      .single()
    
    if (congressData) setCongress(congressData)

    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, name, email, created_at')
      .eq('congress_id', id)
      .eq('role', 'congress')
      .order('created_at', { ascending: false })
    
    if (usersData) setUsers(usersData)
    
    setLoading(false)
  }

  // ... TODO el resto del código IGUAL (funciones, JSX completo)
  // Solo cambia el botón de "Volver":
  
  // En el header, reemplaza:
  // router.push('/god-admin/dashboard')
  // Por:
  // await supabase.auth.signOut()
  // window.location.href = '/login'
}