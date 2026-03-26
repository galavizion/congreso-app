'use client'

import { use, useEffect, useState } from 'react'
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

export default function CongressDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params)
  const supabase = createClient()
  const router = useRouter()
  const [congress, setCongress] = useState<Congress | null>(null)
  const [users, setUsers] = useState<CongressUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('general')
  
  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // Edit modal state
  const [editingUser, setEditingUser] = useState<CongressUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [updating, setUpdating] = useState(false)
  const [editError, setEditError] = useState('')

  // Delete confirmation
  const [deletingUser, setDeletingUser] = useState<CongressUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Logo upload
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    loadCongressData()
  }, [id])

  async function loadCongressData() {
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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !congress) return

    setUploadingLogo(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('congress_logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('congress_logos')
        .getPublicUrl(fileName)

      const response = await fetch('/api/update-congress-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          congressId: id,
          logoUrl: publicUrl
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error actualizando logo')
      }

      if (congress.logo_url) {
        const oldPath = congress.logo_url.split('/').pop()
        if (oldPath && oldPath !== fileName) {
          await supabase.storage
            .from('congress_logos')
            .remove([oldPath])
        }
      }

      setCongress({ ...congress, logo_url: publicUrl })
      
      alert('Logo actualizado correctamente')
    } catch (err: any) {
      alert('Error al subir logo: ' + err.message)
    }

    setUploadingLogo(false)
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const response = await fetch('/api/create-congress-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          congressId: id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al crear usuario')
        setCreating(false)
        return
      }

      setName('')
      setEmail('')
      setPassword('')
      setShowCreateForm(false)
      loadCongressData()
    } catch (err: any) {
      setError(err.message)
    }
    
    setCreating(false)
  }

  function openEditModal(user: CongressUser) {
    setEditingUser(user)
    setEditName(user.name)
    setEditPassword('')
    setEditError('')
  }

  function closeEditModal() {
    setEditingUser(null)
    setEditName('')
    setEditPassword('')
    setEditError('')
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return

    setUpdating(true)
    setEditError('')

    try {
      const response = await fetch('/api/update-congress-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          name: editName,
          password: editPassword || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setEditError(data.error || 'Error al actualizar usuario')
        setUpdating(false)
        return
      }

      closeEditModal()
      loadCongressData()
    } catch (err: any) {
      setEditError(err.message)
    }
    
    setUpdating(false)
  }

  function openDeleteConfirm(user: CongressUser) {
    setDeletingUser(user)
  }

  function closeDeleteConfirm() {
    setDeletingUser(null)
  }

  async function handleDeleteUser() {
    if (!deletingUser) return

    setDeleting(true)

    try {
      const response = await fetch('/api/delete-congress-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: deletingUser.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al eliminar usuario')
        setDeleting(false)
        return
      }

      closeDeleteConfirm()
      loadCongressData()
    } catch (err: any) {
      alert(err.message)
    }
    
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!congress) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-gray-500">Congreso no encontrado</div>
      </div>
    )
  }

  const tabs = [
    { id: 'general' as Tab, label: 'General', icon: '⚙️' },
    { id: 'mapa' as Tab, label: 'Mapa', icon: '🗺️' },
    { id: 'horarios' as Tab, label: 'Horarios', icon: '📅' },
    { id: 'noticias' as Tab, label: 'Noticias', icon: '📰' },
    { id: 'stands' as Tab, label: 'Stands', icon: '🏪' },
    { id: 'asistentes' as Tab, label: 'Asistentes', icon: '👥' }
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9] text-white">
        <div className="px-4 py-4">
          <button
            onClick={() => router.push('/god-admin/dashboard')}
            className="text-white/80 hover:text-white text-sm mb-3 flex items-center gap-1"
          >
            ← Volver
          </button>
          
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="relative group flex-shrink-0">
              {congress.logo_url ? (
                <img 
                  src={congress.logo_url} 
                  alt={congress.name}
                  className="w-14 h-14 rounded-lg object-cover bg-white"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {congress.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Upload overlay */}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
                <span className="text-white text-xs font-medium">
                  {uploadingLogo ? '...' : '📷'}
                </span>
              </label>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{congress.name}</h1>
              <p className="text-white/80 text-xs mt-1">
                {new Date(congress.created_at).toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs - Scroll horizontal mobile */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex px-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 min-w-[90px] px-3 py-3 text-sm font-medium whitespace-nowrap
                  transition-colors relative
                  ${activeTab === tab.id
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-xs">{tab.label}</span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* TAB: GENERAL */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="text-gray-500 text-xs font-medium mb-1">Usuarios Asignados</div>
              <div className="text-2xl font-bold text-gray-900">{users.length}</div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Usuarios</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                {showCreateForm ? 'Cancelar' : '+ Agregar'}
              </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Nuevo Usuario</h3>
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      required
                      minLength={6}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 text-sm"
                  >
                    {creating ? 'Creando...' : 'Crear Usuario'}
                  </button>
                </form>
              </div>
            )}

            {/* Users List */}
            {users.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="text-gray-400 text-base mb-1">Sin usuarios</div>
                <p className="text-gray-500 text-xs">Agrega el primero</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
                        <p className="text-gray-600 text-xs truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openEditModal(user)}
                        className="flex-1 text-indigo-600 hover:text-indigo-700 text-xs font-medium py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(user)}
                        className="flex-1 text-red-600 hover:text-red-700 text-xs font-medium py-2 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: MAPA */}
        {/* TAB: MAPA */}
{activeTab === 'mapa' && (
  <MapViewer 
    congressId={id}
    mapUrl={congress.map_url}
    canEdit={true}
    onMapUpdated={loadCongressData}
  />
)}
        {/* TAB: HORARIOS */}
       {activeTab === 'horarios' && (
  <ScheduleManager 
    congressId={id}
    canEdit={true}
  />
)}

        {/* TAB: NOTICIAS */}
     {activeTab === 'noticias' && (
  <NewsManager 
    congressId={id}
    canEdit={true}
  />
)}

        {/* TAB: STANDS */}
      {activeTab === 'stands' && (
  <StandsManager 
    congressId={id}
    canEdit={true}
  />
)}

        {/* TAB: ASISTENTES */}
   {/* TAB: ASISTENTES */}
      {/* TAB: ASISTENTES */}
        {activeTab === 'asistentes' && (
          <AttendeesManager congressId={id} />
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Usuario</h3>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña (opcional)
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                    minLength={6}
                    placeholder="Dejar vacío para no cambiar"
                  />
                </div>

                {editError && (
                  <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                    {editError}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {updating ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={updating}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Eliminar Usuario</h3>
              <p className="text-gray-600 mb-6 text-sm">
                ¿Eliminar a <strong>{deletingUser.name}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteUser}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button
                  onClick={closeDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}