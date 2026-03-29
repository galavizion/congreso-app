'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type News = {
  id: string
  title: string
  content: string
  image_url: string | null
  published_at: string
  stand_id: string | null
}

type NewsManagerProps = {
  congressId: string
  standId?: string | null
  canEdit?: boolean
}

export default function NewsManager({ congressId, standId, canEdit = false }: NewsManagerProps) {
  const supabase = createClient()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  
  // Edit state
  const [editingNews, setEditingNews] = useState<News | null>(null)
  
  // Delete state
  const [deletingNews, setDeletingNews] = useState<News | null>(null)
  const [deleting, setDeleting] = useState(false)

  // View detail state
  const [viewingNews, setViewingNews] = useState<News | null>(null)

  useEffect(() => {
    loadNews()
  }, [congressId, standId])

  async function loadNews() {
    setLoading(true)
    
    let query = supabase
      .from('news')
      .select('*')
      .eq('congress_id', congressId)
    
    // Si hay standId, filtrar solo noticias de ese stand
    if (standId) {
      query = query.eq('stand_id', standId)
    }
    
    const { data } = await query.order('published_at', { ascending: false })
    
    if (data) setNews(data)
    
    setLoading(false)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    try {
      let imageUrl = editingNews?.image_url || null

      // Upload imagen si hay una nueva
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${congressId}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('news_images')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('news_images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl

        // Eliminar imagen anterior si existe
        if (editingNews?.image_url) {
          const oldPath = editingNews.image_url.split('/').pop()
          if (oldPath && oldPath !== fileName) {
            await supabase.storage
              .from('news_images')
              .remove([oldPath])
          }
        }
      }

      // Crear o actualizar noticia
      if (editingNews) {
        const { error } = await supabase
          .from('news')
          .update({
            title,
            content,
            image_url: imageUrl
          })
          .eq('id', editingNews.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('news')
          .insert([{
            congress_id: congressId,
            stand_id: standId || null,
            title,
            content,
            image_url: imageUrl
          }])

        if (error) throw error
      }

      // Reset form
      setTitle('')
      setContent('')
      setImageFile(null)
      setImagePreview(null)
      setShowForm(false)
      setEditingNews(null)
      loadNews()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }

    setCreating(false)
  }

  function openEditForm(newsItem: News) {
    setEditingNews(newsItem)
    setTitle(newsItem.title)
    setContent(newsItem.content)
    setImagePreview(newsItem.image_url)
    setImageFile(null)
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingNews(null)
    setTitle('')
    setContent('')
    setImageFile(null)
    setImagePreview(null)
  }

  async function handleDelete() {
    if (!deletingNews) return

    setDeleting(true)

    try {
      // Eliminar imagen si existe
      if (deletingNews.image_url) {
        const imagePath = deletingNews.image_url.split('/').pop()
        if (imagePath) {
          await supabase.storage
            .from('news_images')
            .remove([imagePath])
        }
      }

      // Eliminar noticia
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', deletingNews.id)

      if (error) throw error

      setDeletingNews(null)
      loadNews()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }

    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  // Vista detalle de noticia
  if (viewingNews) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <button
          onClick={() => setViewingNews(null)}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          ← Volver a noticias
        </button>

        {/* Contenido */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Imagen */}
          {viewingNews.image_url && (
            <img 
              src={viewingNews.image_url} 
              alt={viewingNews.title}
              className="w-full h-64 object-cover"
            />
          )}

          {/* Contenido */}
          <div className="p-4">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {viewingNews.title}
            </h1>
            <p className="text-gray-500 text-xs mb-4">
              📅 {new Date(viewingNews.published_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <div className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
              {viewingNews.content}
            </div>
          </div>

          {/* Botones de edición */}
          {canEdit && (
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => {
                  setViewingNews(null)
                  openEditForm(viewingNews)
                }}
                className="flex-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  setDeletingNews(viewingNews)
                  setViewingNews(null)
                }}
                className="flex-1 text-red-600 hover:text-red-700 text-sm font-medium py-2 border border-red-200 rounded-lg hover:bg-red-50"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Botón agregar */}
      {canEdit && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 font-medium"
        >
          + Crear Noticia
        </button>
      )}

      {/* Formulario crear/editar */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">
            {editingNews ? 'Editar Noticia' : 'Nueva Noticia'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Preview de imagen */}
            {imagePreview && (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Upload imagen */}
            {!imagePreview && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Imagen
                </label>
                <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="text-gray-500 text-sm">
                    <div className="text-2xl mb-2">📷</div>
                    Toca para subir imagen
                  </div>
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                required
                placeholder="Título de la noticia"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Contenido *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                rows={6}
                required
                placeholder="Escribe el contenido de la noticia..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 text-sm"
              >
                {creating ? 'Guardando...' : editingNews ? 'Guardar' : 'Publicar'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de noticias */}
      {news.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="text-4xl mb-3">📰</div>
          <div className="text-gray-400 text-base mb-1">Sin noticias</div>
          <p className="text-gray-500 text-xs">
            {standId ? 'Publica la primera noticia de tu stand' : 'Publica la primera noticia'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((newsItem) => (
            <div
              key={newsItem.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Imagen */}
              {newsItem.image_url && (
                <div 
                  onClick={() => !canEdit && setViewingNews(newsItem)}
                  className={!canEdit ? 'cursor-pointer' : ''}
                >
                  <img 
                    src={newsItem.image_url} 
                    alt={newsItem.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* Contenido */}
              <div className="p-4">
                <div 
                  onClick={() => !canEdit && setViewingNews(newsItem)}
                  className={!canEdit ? 'cursor-pointer' : ''}
                >
                  <h3 className="font-bold text-gray-900 mb-1">{newsItem.title}</h3>
                  <p className="text-gray-600 text-xs mb-2">
                    {new Date(newsItem.published_at).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-gray-700 text-sm line-clamp-3">
                    {newsItem.content}
                  </p>
                </div>

                {/* Botón leer más para usuarios sin edición */}
                {!canEdit && (
                  <button
                    onClick={() => setViewingNews(newsItem)}
                    className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Leer más →
                  </button>
                )}

                {/* Botones de edición */}
                {canEdit && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setViewingNews(newsItem)}
                      className="flex-1 text-gray-700 hover:text-gray-900 text-xs font-medium py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Ver completo
                    </button>
                    <button
                      onClick={() => openEditForm(newsItem)}
                      className="flex-1 text-indigo-600 hover:text-indigo-700 text-xs font-medium py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeletingNews(newsItem)}
                      className="flex-1 text-red-600 hover:text-red-700 text-xs font-medium py-2 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deletingNews && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Eliminar Noticia</h3>
              <p className="text-gray-600 mb-6 text-sm">
                ¿Eliminar <strong>{deletingNews.title}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button
                  onClick={() => setDeletingNews(null)}
                  disabled={deleting}
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