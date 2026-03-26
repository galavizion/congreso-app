'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Stand = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  booth_number: string | null
  category: string | null
  website: string | null
  contact_email: string | null
  contact_phone: string | null
  facebook: string | null
  instagram: string | null
  linkedin: string | null
  tiktok: string | null
  userCount?: number
}

type StandUser = {
  id: string
  name: string
  email: string
  created_at: string
}

type StandsManagerProps = {
  congressId: string
  canEdit?: boolean
}

// Iconos SVG monocromáticos
const FacebookIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
)

export default function StandsManager({ congressId, canEdit = false }: StandsManagerProps) {
  const supabase = createClient()
  const [stands, setStands] = useState<Stand[]>([])
  const [selectedStand, setSelectedStand] = useState<Stand | null>(null)
  const [standUsers, setStandUsers] = useState<StandUser[]>([])
  const [loading, setLoading] = useState(true)
  
  // Stand form
  const [showStandForm, setShowStandForm] = useState(false)
  const [standName, setStandName] = useState('')
  const [standDescription, setStandDescription] = useState('')
  const [standBoothNumber, setStandBoothNumber] = useState('')
  const [standCategory, setStandCategory] = useState('')
  const [standWebsite, setStandWebsite] = useState('')
  const [standEmail, setStandEmail] = useState('')
  const [standPhone, setStandPhone] = useState('')
  const [standFacebook, setStandFacebook] = useState('')
  const [standInstagram, setStandInstagram] = useState('')
  const [standLinkedin, setStandLinkedin] = useState('')
  const [standTiktok, setStandTiktok] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [creatingStand, setCreatingStand] = useState(false)
  
  // Edit stand
  const [editingStand, setEditingStand] = useState<Stand | null>(null)
  
  // Delete stand
  const [deletingStand, setDeletingStand] = useState<Stand | null>(null)
  
  // User form
  const [showUserForm, setShowUserForm] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  const [userError, setUserError] = useState('')
  
  // Edit user
  const [editingUser, setEditingUser] = useState<StandUser | null>(null)
  const [editUserName, setEditUserName] = useState('')
  const [editUserPassword, setEditUserPassword] = useState('')
  const [updatingUser, setUpdatingUser] = useState(false)
  
  // Delete user
  const [deletingUser, setDeletingUser] = useState<StandUser | null>(null)
  const [deletingUserLoading, setDeletingUserLoading] = useState(false)

  useEffect(() => {
    loadStands()
  }, [congressId])

  useEffect(() => {
    if (selectedStand) {
      loadStandUsers(selectedStand.id)
    }
  }, [selectedStand])

  async function loadStands() {
    setLoading(true)
    
    const { data: standsData } = await supabase
      .from('stands')
      .select('*')
      .eq('congress_id', congressId)
      .order('created_at', { ascending: true })
    
    if (standsData) {
      const standsWithCount = await Promise.all(
        standsData.map(async (stand) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('stand_id', stand.id)
            .eq('role', 'stand')
          
          return { ...stand, userCount: count || 0 }
        })
      )
      
      setStands(standsWithCount)
    }
    
    setLoading(false)
  }

  async function loadStandUsers(standId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, created_at')
      .eq('stand_id', standId)
      .eq('role', 'stand')
      .order('created_at', { ascending: false })
    
    if (data) setStandUsers(data)
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmitStand(e: React.FormEvent) {
    e.preventDefault()
    setCreatingStand(true)

    try {
      let logoUrl = editingStand?.logo_url || null

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${congressId}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('stand_logos')
          .upload(fileName, logoFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('stand_logos')
          .getPublicUrl(fileName)

        logoUrl = publicUrl

        if (editingStand?.logo_url) {
          const oldPath = editingStand.logo_url.split('/').pop()
          if (oldPath && oldPath !== fileName) {
            await supabase.storage
              .from('stand_logos')
              .remove([oldPath])
          }
        }
      }

      if (editingStand) {
        const { error } = await supabase
          .from('stands')
          .update({
            name: standName,
            description: standDescription || null,
            booth_number: standBoothNumber || null,
            category: standCategory || null,
            website: standWebsite || null,
            contact_email: standEmail || null,
            contact_phone: standPhone || null,
            facebook: standFacebook || null,
            instagram: standInstagram || null,
            linkedin: standLinkedin || null,
            tiktok: standTiktok || null,
            logo_url: logoUrl
          })
          .eq('id', editingStand.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('stands')
          .insert([{
            congress_id: congressId,
            name: standName,
            description: standDescription || null,
            booth_number: standBoothNumber || null,
            category: standCategory || null,
            website: standWebsite || null,
            contact_email: standEmail || null,
            contact_phone: standPhone || null,
            facebook: standFacebook || null,
            instagram: standInstagram || null,
            linkedin: standLinkedin || null,
            tiktok: standTiktok || null,
            logo_url: logoUrl
          }])

        if (error) throw error
      }

      resetStandForm()
      loadStands()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }

    setCreatingStand(false)
  }

  function resetStandForm() {
    setStandName('')
    setStandDescription('')
    setStandBoothNumber('')
    setStandCategory('')
    setStandWebsite('')
    setStandEmail('')
    setStandPhone('')
    setStandFacebook('')
    setStandInstagram('')
    setStandLinkedin('')
    setStandTiktok('')
    setLogoFile(null)
    setLogoPreview(null)
    setShowStandForm(false)
    setEditingStand(null)
  }

  function openEditStand(stand: Stand) {
    setEditingStand(stand)
    setStandName(stand.name)
    setStandDescription(stand.description || '')
    setStandBoothNumber(stand.booth_number || '')
    setStandCategory(stand.category || '')
    setStandWebsite(stand.website || '')
    setStandEmail(stand.contact_email || '')
    setStandPhone(stand.contact_phone || '')
    setStandFacebook(stand.facebook || '')
    setStandInstagram(stand.instagram || '')
    setStandLinkedin(stand.linkedin || '')
    setStandTiktok(stand.tiktok || '')
    setLogoPreview(stand.logo_url)
    setLogoFile(null)
    setShowStandForm(true)
  }

  async function handleDeleteStand() {
    if (!deletingStand) return

    try {
      if (deletingStand.logo_url) {
        const logoPath = deletingStand.logo_url.split('/').pop()
        if (logoPath) {
          await supabase.storage
            .from('stand_logos')
            .remove([logoPath])
        }
      }

      const { error } = await supabase
        .from('stands')
        .delete()
        .eq('id', deletingStand.id)

      if (error) throw error

      setDeletingStand(null)
      if (selectedStand?.id === deletingStand.id) {
        setSelectedStand(null)
        setStandUsers([])
      }
      loadStands()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStand) return

    setCreatingUser(true)
    setUserError('')

    try {
      const response = await fetch('/api/create-stand-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          password: userPassword,
          name: userName,
          standId: selectedStand.id,
          congressId: congressId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setUserError(data.error || 'Error al crear usuario')
        setCreatingUser(false)
        return
      }

      setUserName('')
      setUserEmail('')
      setUserPassword('')
      setShowUserForm(false)
      loadStandUsers(selectedStand.id)
      loadStands()
    } catch (err: any) {
      setUserError(err.message)
    }

    setCreatingUser(false)
  }

  function openEditUser(user: StandUser) {
    setEditingUser(user)
    setEditUserName(user.name)
    setEditUserPassword('')
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return

    setUpdatingUser(true)

    try {
      const response = await fetch('/api/update-congress-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          name: editUserName,
          password: editUserPassword || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al actualizar usuario')
        setUpdatingUser(false)
        return
      }

      setEditingUser(null)
      if (selectedStand) loadStandUsers(selectedStand.id)
    } catch (err: any) {
      alert(err.message)
    }

    setUpdatingUser(false)
  }

  async function handleDeleteUser() {
    if (!deletingUser) return

    setDeletingUserLoading(true)

    try {
      const response = await fetch('/api/delete-congress-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: deletingUser.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al eliminar usuario')
        setDeletingUserLoading(false)
        return
      }

      setDeletingUser(null)
      if (selectedStand) {
        loadStandUsers(selectedStand.id)
        loadStands()
      }
    } catch (err: any) {
      alert(err.message)
    }

    setDeletingUserLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  // Vista de stand seleccionado (usuarios)
  if (selectedStand) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedStand(null)}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          ← Volver a stands
        </button>

        {/* Info del stand */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start gap-3 mb-3">
            {selectedStand.logo_url ? (
              <img 
                src={selectedStand.logo_url} 
                alt={selectedStand.name}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <span className="text-xl font-bold text-indigo-600">
                  {selectedStand.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-lg">{selectedStand.name}</h2>
              {selectedStand.booth_number && (
                <p className="text-gray-600 text-sm">📍 Stand {selectedStand.booth_number}</p>
              )}
              {selectedStand.category && (
                <p className="text-gray-600 text-sm">🏷️ {selectedStand.category}</p>
              )}
            </div>
          </div>

          {selectedStand.description && (
            <div className="mb-3 pb-3 border-b border-gray-100">
              <p className="text-gray-700 text-sm">{selectedStand.description}</p>
            </div>
          )}

          {(selectedStand.contact_email || selectedStand.contact_phone || selectedStand.website) && (
            <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
              {selectedStand.website && (
                <a 
                  href={selectedStand.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-2"
                >
                  🌐 {selectedStand.website}
                </a>
              )}
              {selectedStand.contact_email && (
                <a 
                  href={`mailto:${selectedStand.contact_email}`}
                  className="text-gray-700 text-sm flex items-center gap-2"
                >
                  ✉️ {selectedStand.contact_email}
                </a>
              )}
              {selectedStand.contact_phone && (
                <a 
                  href={`tel:${selectedStand.contact_phone}`}
                  className="text-gray-700 text-sm flex items-center gap-2"
                >
                  📞 {selectedStand.contact_phone}
                </a>
              )}
            </div>
          )}

          {(selectedStand.facebook || selectedStand.instagram || selectedStand.linkedin || selectedStand.tiktok) && (
            <div className="mb-3 pb-3 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-700 mb-2">Redes Sociales</p>
              <div className="flex gap-3">
                {selectedStand.facebook && (
                  <a
                    href={selectedStand.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-indigo-600 transition-colors"
                    title="Facebook"
                  >
                    <FacebookIcon />
                  </a>
                )}
                {selectedStand.instagram && (
                  <a
                    href={selectedStand.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-indigo-600 transition-colors"
                    title="Instagram"
                  >
                    <InstagramIcon />
                  </a>
                )}
                {selectedStand.linkedin && (
                  <a
                    href={selectedStand.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-indigo-600 transition-colors"
                    title="LinkedIn"
                  >
                    <LinkedInIcon />
                  </a>
                )}
                {selectedStand.tiktok && (
                  <a
                    href={selectedStand.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-indigo-600 transition-colors"
                    title="TikTok"
                  >
                    <TikTokIcon />
                  </a>
                )}
              </div>
            </div>
          )}

          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={() => openEditStand(selectedStand)}
                className="flex-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 font-medium text-sm"
              >
                ✏️ Editar Stand
              </button>
              <button
                onClick={() => setDeletingStand(selectedStand)}
                className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 font-medium text-sm"
              >
                🗑️ Eliminar
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Usuarios Asignados</h3>
          {canEdit && (
            <button
              onClick={() => setShowUserForm(!showUserForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              {showUserForm ? 'Cancelar' : '+ Agregar'}
            </button>
          )}
        </div>

        {showUserForm && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Nuevo Usuario Stand</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  required
                  minLength={6}
                />
              </div>

              {userError && (
                <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs">
                  {userError}
                </div>
              )}

              <button
                type="submit"
                disabled={creatingUser}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 text-sm"
              >
                {creatingUser ? 'Creando...' : 'Crear Usuario'}
              </button>
            </form>
          </div>
        )}

        {standUsers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="text-gray-400 text-base mb-1">Sin usuarios</div>
            <p className="text-gray-500 text-xs">Asigna el primero</p>
          </div>
        ) : (
          <div className="space-y-3">
            {standUsers.map((user) => (
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
                {canEdit && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openEditUser(user)}
                      className="flex-1 text-indigo-600 hover:text-indigo-700 text-xs font-medium py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeletingUser(user)}
                      className="flex-1 text-red-600 hover:text-red-700 text-xs font-medium py-2 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

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
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
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
                      value={editUserPassword}
                      onChange={(e) => setEditUserPassword(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                      minLength={6}
                      placeholder="Dejar vacío para no cambiar"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={updatingUser}
                      className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                    >
                      {updatingUser ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      disabled={updatingUser}
                      className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

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
                    disabled={deletingUserLoading}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                  >
                    {deletingUserLoading ? 'Eliminando...' : 'Eliminar'}
                  </button>
                  <button
                    onClick={() => setDeletingUser(null)}
                    disabled={deletingUserLoading}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
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

  // Vista principal (lista de stands)
  return (
    <div className="space-y-4">
      {canEdit && !showStandForm && (
        <button
          onClick={() => setShowStandForm(true)}
          className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 font-medium"
        >
          + Agregar Stand
        </button>
      )}

      {showStandForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">
            {editingStand ? 'Editar Stand' : 'Nuevo Stand'}
          </h3>
          <form onSubmit={handleSubmitStand} className="space-y-3">
            {logoPreview && (
              <div className="relative">
                <img 
                  src={logoPreview} 
                  alt="Preview"
                  className="w-24 h-24 rounded-lg object-cover mx-auto"
                />
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null)
                    setLogoPreview(null)
                  }}
                  className="absolute top-0 right-1/2 translate-x-12 bg-red-600 text-white w-6 h-6 rounded-full hover:bg-red-700 text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {!logoPreview && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Logo
                </label>
                <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                  <div className="text-gray-500 text-sm">
                    <div className="text-xl mb-1">🏪</div>
                    Subir logo
                  </div>
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={standName}
                onChange={(e) => setStandName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                required
                placeholder="Nombre del stand"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Número de Stand
                </label>
                <input
                  type="text"
                  value={standBoothNumber}
                  onChange={(e) => setStandBoothNumber(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  placeholder="A-12"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={standCategory}
                  onChange={(e) => setStandCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  placeholder="Farmacéutica"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={standDescription}
                onChange={(e) => setStandDescription(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                rows={3}
                placeholder="Descripción del stand..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sitio web
              </label>
              <input
                type="url"
                value={standWebsite}
                onChange={(e) => setStandWebsite(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="https://ejemplo.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={standEmail}
                  onChange={(e) => setStandEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  placeholder="contacto@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={standPhone}
                  onChange={(e) => setStandPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  placeholder="(81) 1234-5678"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <h4 className="text-xs font-medium text-gray-700 mb-3">Redes Sociales</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={standFacebook}
                    onChange={(e) => setStandFacebook(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={standInstagram}
                    onChange={(e) => setStandInstagram(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={standLinkedin}
                    onChange={(e) => setStandLinkedin(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    TikTok
                  </label>
                  <input
                    type="url"
                    value={standTiktok}
                    onChange={(e) => setStandTiktok(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    placeholder="https://tiktok.com/@..."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={creatingStand}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 text-sm"
              >
                {creatingStand ? 'Guardando...' : editingStand ? 'Guardar' : 'Crear Stand'}
              </button>
              <button
                type="button"
                onClick={resetStandForm}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {stands.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="text-4xl mb-3">🏪</div>
          <div className="text-gray-400 text-base mb-1">Sin stands</div>
          <p className="text-gray-500 text-xs">Agrega el primer stand</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stands.map((stand) => (
            <div
              key={stand.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                {stand.logo_url ? (
                  <img 
                    src={stand.logo_url} 
                    alt={stand.name}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-indigo-600">
                      {stand.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{stand.name}</h3>
                  {stand.booth_number && (
                    <p className="text-gray-600 text-xs">📍 Stand {stand.booth_number}</p>
                  )}
                  {stand.category && (
                    <p className="text-gray-600 text-xs">🏷️ {stand.category}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedStand(stand)}
                  className="flex-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 font-medium text-sm"
                >
                  Ver Detalle
                </button>
                {canEdit && (
                  <>
                    <button
                      onClick={() => openEditStand(stand)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setDeletingStand(stand)}
                      className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 text-sm"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {deletingStand && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Eliminar Stand</h3>
              <p className="text-gray-600 mb-6 text-sm">
                ¿Eliminar <strong>{deletingStand.name}</strong>? Se eliminarán también todos sus usuarios. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteStand}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setDeletingStand(null)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
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
