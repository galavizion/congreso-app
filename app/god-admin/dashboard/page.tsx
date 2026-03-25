'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Congress = {
  id: string
  name: string
  created_at: string
}

export default function GodAdminDashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [congresses, setCongresses] = useState<Congress[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCongressName, setNewCongressName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadCongresses()
  }, [])

  async function loadCongresses() {
    setLoading(true)
    const { data } = await supabase
      .from('congresses')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setCongresses(data)
    setLoading(false)
  }

  async function handleCreateCongress(e: React.FormEvent) {
    e.preventDefault()
    if (!newCongressName.trim()) return

    setCreating(true)
    const { error } = await supabase
      .from('congresses')
      .insert([{ name: newCongressName.trim() }])

    if (!error) {
      setNewCongressName('')
      setShowCreateForm(false)
      loadCongresses()
    }
    setCreating(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">God Admin</h1>
              <p className="text-white/80 text-sm mt-1">Gestión de Congresos</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Color line */}
      <div className="h-1 bg-indigo-500" />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="text-gray-500 text-sm font-medium mb-1">Total Congresos</div>
            <div className="text-3xl font-bold text-gray-900">{congresses.length}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Congresos</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            {showCreateForm ? 'Cancelar' : '+ Crear Congreso'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <form onSubmit={handleCreateCongress} className="flex gap-3">
              <input
                type="text"
                placeholder="Nombre del congreso"
                value={newCongressName}
                onChange={(e) => setNewCongressName(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                autoFocus
              />
              <button
                type="submit"
                disabled={creating || !newCongressName.trim()}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear'}
              </button>
            </form>
          </div>
        )}

        {/* Congresses List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : congresses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-gray-400 text-lg mb-2">No hay congresos creados</div>
            <p className="text-gray-500 text-sm">Crea tu primer congreso para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {congresses.map((congress) => (
              <div
                key={congress.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-gray-900 text-lg mb-2">{congress.name}</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Creado: {new Date(congress.created_at).toLocaleDateString('es-MX')}
                </p>
                <button
                  onClick={() => router.push(`/god-admin/congresos/${congress.id}`)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  Ver detalles →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
