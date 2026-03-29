'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Gift = {
  id: string
  congress_id: string
  name: string
  description: string | null
  points_cost: number
  stock: number
  image_url: string | null
  created_at: string
}

type Redemption = {
  id: string
  attendee_id: string
  gift_id: string
  redeemed_at: string
  status: string
  points_spent: number
  attendee_name?: string
  attendee_email?: string
  gift_name?: string
}

export default function GiftsManager({ 
  congressId,
  canEdit = true 
}: { 
  congressId: string
  canEdit?: boolean 
}) {
  const supabase = createClient()
  const [gifts, setGifts] = useState<Gift[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pointsCost, setPointsCost] = useState('')
  const [stock, setStock] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // Edit modal state
  const [editingGift, setEditingGift] = useState<Gift | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPointsCost, setEditPointsCost] = useState('')
  const [editStock, setEditStock] = useState('')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [updating, setUpdating] = useState(false)
  const [editError, setEditError] = useState('')

  // Delete confirmation
  const [deletingGift, setDeletingGift] = useState<Gift | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Redemptions modals
  const [viewingRedemptionsGift, setViewingRedemptionsGift] = useState<Gift | null>(null)
  const [viewingAttendeeRedemptions, setViewingAttendeeRedemptions] = useState<{
    attendee_id: string
    attendee_name: string
    attendee_email: string
  } | null>(null)

  useEffect(() => {
    loadData()
  }, [congressId])

  async function loadData() {
    setLoading(true)
    await Promise.all([loadGifts(), loadRedemptions()])
    setLoading(false)
  }

  async function loadGifts() {
    const { data } = await supabase
      .from('gifts')
      .select('*')
      .eq('congress_id', congressId)
      .order('created_at', { ascending: false })
    
    if (data) setGifts(data)
  }
async function loadRedemptions() {
  console.log('🔍 loadRedemptions: Starting...', { congressId })
  
  // Primero cargar todos los gifts del congreso
  const { data: giftsData } = await supabase
    .from('gifts')
    .select('id, name')
    .eq('congress_id', congressId)

  console.log('🎁 Gifts loaded:', giftsData)

  if (!giftsData || giftsData.length === 0) {
    console.log('⚠️ No gifts found')
    setRedemptions([])
    return
  }

  const giftIds = giftsData.map(g => g.id)
  console.log('🔑 Gift IDs:', giftIds)

  // Fetch redemptions de esos gifts
  const { data: redemptionsData } = await supabase
    .from('redemptions')
    .select('*')
    .in('gift_id', giftIds)

  console.log('✨ Redemptions loaded:', redemptionsData)

  if (!redemptionsData || redemptionsData.length === 0) {
    console.log('⚠️ No redemptions found')
    setRedemptions([])
    return
  }

  // ... resto del código igual

  // Fetch attendees
  const attendeeIds = [...new Set(redemptionsData.map(r => r.attendee_id))]
  
  const { data: attendeesData } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', attendeeIds)

  // Merge data
  const enrichedRedemptions = redemptionsData.map(r => ({
    ...r,
    attendee_name: attendeesData?.find(a => a.id === r.attendee_id)?.name || 'Desconocido',
    attendee_email: attendeesData?.find(a => a.id === r.attendee_id)?.email || '',
    gift_name: giftsData?.find(g => g.id === r.gift_id)?.name || 'Desconocido'
  }))

  setRedemptions(enrichedRedemptions)
}

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `gift-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('stand_logos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('stand_logos')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (err: any) {
      console.error('Error uploading image:', err)
      return null
    }
  }

  async function handleCreateGift(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      let imageUrl = null
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const { error: insertError } = await supabase
        .from('gifts')
        .insert({
          congress_id: congressId,
          name,
          description: description || null,
          points_cost: parseInt(pointsCost),
          stock: parseInt(stock),
          image_url: imageUrl
        })

      if (insertError) throw insertError

      setName('')
      setDescription('')
      setPointsCost('')
      setStock('')
      setImageFile(null)
      setShowCreateModal(false)
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
    
    setCreating(false)
  }

  function openEditModal(gift: Gift) {
    setEditingGift(gift)
    setEditName(gift.name)
    setEditDescription(gift.description || '')
    setEditPointsCost(gift.points_cost.toString())
    setEditStock(gift.stock.toString())
    setEditImageFile(null)
    setEditError('')
  }

  function closeEditModal() {
    setEditingGift(null)
    setEditName('')
    setEditDescription('')
    setEditPointsCost('')
    setEditStock('')
    setEditImageFile(null)
    setEditError('')
  }

  async function handleUpdateGift(e: React.FormEvent) {
    e.preventDefault()
    if (!editingGift) return

    setUpdating(true)
    setEditError('')

    try {
      let imageUrl = editingGift.image_url
      
      if (editImageFile) {
        const newImageUrl = await uploadImage(editImageFile)
        if (newImageUrl) {
          imageUrl = newImageUrl
          
          if (editingGift.image_url) {
            const oldPath = editingGift.image_url.split('/').pop()
            if (oldPath) {
              await supabase.storage
                .from('stand_logos')
                .remove([oldPath])
            }
          }
        }
      }

      const { error: updateError } = await supabase
        .from('gifts')
        .update({
          name: editName,
          description: editDescription || null,
          points_cost: parseInt(editPointsCost),
          stock: parseInt(editStock),
          image_url: imageUrl
        })
        .eq('id', editingGift.id)

      if (updateError) throw updateError

      closeEditModal()
      loadData()
    } catch (err: any) {
      setEditError(err.message)
    }
    
    setUpdating(false)
  }

  function openDeleteConfirm(gift: Gift) {
    setDeletingGift(gift)
  }

  function closeDeleteConfirm() {
    setDeletingGift(null)
  }

  async function handleDeleteGift() {
    if (!deletingGift) return

    setDeleting(true)

    try {
      if (deletingGift.image_url) {
        const imagePath = deletingGift.image_url.split('/').pop()
        if (imagePath) {
          await supabase.storage
            .from('stand_logos')
            .remove([imagePath])
        }
      }

      const { error: deleteError } = await supabase
        .from('gifts')
        .delete()
        .eq('id', deletingGift.id)

      if (deleteError) throw deleteError

      closeDeleteConfirm()
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
    
    setDeleting(false)
  }

  function getRedemptionCountForGift(giftId: string): number {
    return redemptions.filter(r => r.gift_id === giftId).length
  }

  function openRedemptionsModal(gift: Gift) {
    setViewingRedemptionsGift(gift)
  }

  function closeRedemptionsModal() {
    setViewingRedemptionsGift(null)
  }

  function openAttendeeRedemptionsModal(attendeeId: string, attendeeName: string, attendeeEmail: string) {
    setViewingAttendeeRedemptions({ attendee_id: attendeeId, attendee_name: attendeeName, attendee_email: attendeeEmail })
    closeRedemptionsModal()
  }

  function closeAttendeeRedemptionsModal() {
    setViewingAttendeeRedemptions(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  const avgPoints = gifts.length > 0 
    ? Math.round(gifts.reduce((acc, g) => acc + g.points_cost, 0) / gifts.length) 
    : 0

  const totalRedeemed = redemptions.length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <span className="text-2xl">🎁</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Total Regalos</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{gifts.length}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Stock Total</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {gifts.reduce((acc, g) => acc + g.stock, 0)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Total Canjeados</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalRedeemed}</p>
        </div>
      </div>

      {/* Header con botón */}
      {canEdit && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white/20 backdrop-blur-sm border border-indigo-200 text-indigo-600 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-50 transition-all"
          >
            + Nuevo Regalo
          </button>
        </div>
      )}

      {/* Lista de regalos */}
      {gifts.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎁</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay regalos</h3>
          <p className="text-sm text-gray-500 mb-6">Crea el primer regalo para tu catálogo</p>
          {canEdit && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Crear Primer Regalo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {gifts.map(gift => {
            const redemptionCount = getRedemptionCountForGift(gift.id)
            
            return (
              <div
                key={gift.id}
                className="group block bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {gift.image_url ? (
                    <img 
                      src={gift.image_url} 
                      alt={gift.name}
                      className="w-14 h-14 rounded-lg object-cover border border-gray-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                      <span className="text-2xl">🎁</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {gift.name}
                    </h3>
                    {gift.description && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">{gift.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                        <span>⭐</span>
                        {gift.points_cost} pts
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
                        gift.stock > 0 
                          ? 'text-green-700 bg-green-50' 
                          : 'text-red-700 bg-red-50'
                      }`}>
                        <span>{gift.stock > 0 ? '✓' : '✗'}</span>
                        {gift.stock} en stock
                      </span>
                      {redemptionCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-md">
                          <span>✨</span>
                          {redemptionCount} canjeados
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {redemptionCount > 0 && (
                      <button
                        onClick={() => openRedemptionsModal(gift)}
                        className="text-purple-600 hover:text-purple-700 text-xs font-medium px-3 py-2 border border-purple-200 rounded-lg hover:bg-purple-50"
                      >
                        Ver canjes
                      </button>
                    )}
                    {canEdit && (
                      <>
                        <button
                          onClick={() => openEditModal(gift)}
                          className="text-indigo-600 hover:text-indigo-700 text-xs font-medium px-3 py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(gift)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Nuevo Regalo</h3>
              <form onSubmit={handleCreateGift} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Taza WinWin"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción del regalo"
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (opcional)</label>
                  <p className="text-xs text-gray-400 mb-2">
                    💡 Sube una imagen cuadrada (500x500px recomendado)
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {imageFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puntos necesarios</label>
                    <input
                      type="number"
                      value={pointsCost}
                      onChange={(e) => setPointsCost(e.target.value)}
                      placeholder="Ej. 50"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="Ej. 100"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                      required
                      min="0"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {creating ? 'Creando...' : 'Crear Regalo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
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

      {/* Edit Modal */}
      {editingGift && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Regalo</h3>
              <form onSubmit={handleUpdateGift} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar imagen (opcional)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puntos necesarios</label>
                    <input
                      type="number"
                      value={editPointsCost}
                      onChange={(e) => setEditPointsCost(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                    <input
                      type="number"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-400"
                      required
                      min="0"
                    />
                  </div>
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
      {deletingGift && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Eliminar Regalo</h3>
              <p className="text-gray-600 mb-6 text-sm">
                ¿Eliminar <strong>{deletingGift.name}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteGift}
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

      {/* Redemptions Modal - Lista de canjes por regalo */}
      {viewingRedemptionsGift && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Canjes de {viewingRedemptionsGift.name}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {redemptions.filter(r => r.gift_id === viewingRedemptionsGift.id).length} personas canjearon este premio
              </p>
              
              <div className="space-y-3">
                {redemptions
                  .filter(r => r.gift_id === viewingRedemptionsGift.id)
                  .map(redemption => (
                    <div
                      key={redemption.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => openAttendeeRedemptionsModal(
                        redemption.attendee_id, 
                        redemption.attendee_name || 'Desconocido',
                        redemption.attendee_email || ''
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{redemption.attendee_name}</p>
                          <p className="text-xs text-gray-500">{redemption.attendee_email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-600">
                              {new Date(redemption.redeemed_at).toLocaleDateString('es-MX', { 
                                day: '2-digit', 
                                month: 'short', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              redemption.status === 'completed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {redemption.status === 'completed' ? 'Entregado' : 'Pendiente'}
                            </span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
              </div>

              <button
                onClick={closeRedemptionsModal}
                className="w-full mt-6 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendee Redemptions Modal - Historial completo de un asistente */}
      {viewingAttendeeRedemptions && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{viewingAttendeeRedemptions.attendee_name}</h3>
              <p className="text-sm text-gray-500 mb-4">{viewingAttendeeRedemptions.attendee_email}</p>
              
              <h4 className="font-semibold text-gray-900 mb-3">Historial de canjes</h4>
              
              <div className="space-y-3">
                {redemptions
                  .filter(r => r.attendee_id === viewingAttendeeRedemptions.attendee_id)
                  .map(redemption => (
                    <div
                      key={redemption.id}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🎁</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{redemption.gift_name}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-600">
                              {new Date(redemption.redeemed_at).toLocaleDateString('es-MX', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric',
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            <span className="text-xs font-semibold text-amber-600">
                              {redemption.points_spent} pts
                            </span>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              redemption.status === 'completed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {redemption.status === 'completed' ? 'Entregado' : 'Pendiente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <button
                onClick={closeAttendeeRedemptionsModal}
                className="w-full mt-6 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
