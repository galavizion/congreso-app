'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Congress = {
  id: string
  name: string
  logo_url: string | null
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
    setCreating(true)

    const { error } = await supabase
      .from('congresses')
      .insert([{ name: newCongressName }])

    if (!error) {
      setNewCongressName('')
      setShowCreateForm(false)
      loadCongresses()
    } else {
      alert('Error al crear congreso: ' + error.message)
    }

    setCreating(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">God Admin</h1>
              <p className="text-white/80 text-sm mt-1">Panel de administración principal</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors font-medium"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            <h3 className="font-bold text-gray-900 mb-4">Nuevo Congreso</h3>
            <form onSubmit={handleCreateCongress} className="flex gap-3">
              <input
                type="text"
                value={newCongressName}
                onChange={(e) => setNewCongressName(e.target.value)}
                placeholder="Nombre del congreso"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                required
              />
              <button
                type="submit"
                disabled={creating}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear'}
              </button>
            </form>
          </div>
        )}

        {/* Congresses Grid */}
        {congresses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-gray-400 text-lg mb-2">No hay congresos creados</div>
            <p className="text-gray-500 text-sm">Crea tu primer congreso para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {congresses.map((congress) => (
              <div
                key={congress.id}
                onClick={() => router.push(`/god-admin/congresos/${congress.id}`)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  {congress.logo_url ? (
                    <img 
                      src={congress.logo_url} 
                      alt={congress.name}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <span className="text-xl font-bold text-indigo-600">
                        {congress.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 truncate">{congress.name}</h3>
                    <p className="text-gray-500 text-sm">
                      {new Date(congress.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
