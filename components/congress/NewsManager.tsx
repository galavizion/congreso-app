'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useImageCompression } from '@/hooks/useImageCompression'
import Image from 'next/image'

type News = {
  id: string
  title: string
  content: string
  image_url: string | null
  published_at: string
  stand_id: string | null
  author_name?: string
  author_logo?: string | null
}

type NewsManagerProps = {
  congressId: string
  standId?: string | null
  canEdit?: boolean
}

interface PostLimit {
  can_post: boolean
  posts_today: number
  remaining: number
  limit: number
}

export default function NewsManager({ congressId, standId, canEdit = false }: NewsManagerProps) {
  const supabase = createClient()
  const { compressImage, isCompressing } = useImageCompression()
  
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [postLimit, setPostLimit] = useState<PostLimit | null>(null)
  
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  
  // Edit state
  const [editingNews, setEditingNews] = useState<News | null>(null)
  
  // Delete state
  const [deletingNews, setDeletingNews] = useState<News | null>(null)
  const [deleting, setDeleting] = useState(false)

  // View detail state
  const [viewingNews, setViewingNews] = useState<News | null>(null)

  useEffect(() => {
    loadNews()
    if (canEdit && standId) {
      checkPostLimit()
    }
  }, [congressId, standId])

  async function checkPostLimit() {
    if (!standId) return
    
    try {
      const response = await fetch('/api/check-post-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stand_id: standId }),
      })
      const data = await response.json()
      setPostLimit(data)
    } catch (err) {
      console.error('Error al verificar límite:', err)
    }
  }

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
    
    if (!data) {
      setLoading(false)
      return
    }

    // Cargar info del congreso
    const { data: congressData } = await supabase
      .from('congresses')
      .select('name, logo_url')
      .eq('id', congressId)
      .single()

    // Cargar info de stands para noticias con stand_id
    const standIds = [...new Set(data.filter(n => n.stand_id).map(n => n.stand_id))]
    let standsMap: Record<string, any> = {}
    
    if (standIds.length > 0) {
      const { data: standsData } = await supabase
        .from('stands')
        .select('id, name, logo_url')
        .in('id', standIds)
      
      if (standsData) {
        standsMap = Object.fromEntries(standsData.map(s => [s.id, s]))
      }
    }

    // Enriquecer noticias con datos del autor
    const enrichedNews = data.map(newsItem => ({
      ...newsItem,
      author_name: newsItem.stand_id 
        ? standsMap[newsItem.stand_id]?.name || 'Stand' 
        : congressData?.name || 'Congreso',
      author_logo: newsItem.stand_id
        ? standsMap[newsItem.stand_id]?.logo_url
        : congressData?.logo_url
    }))
    
    setNews(enrichedNews)
    setLoading(false)
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes')
      return
    }

    // Validar tamaño máximo 4MB antes de comprimir
    const maxSize = 4 * 1024 * 1024
    if (file.size > maxSize * 2) {
      setError('La imagen es demasiado grande. Máximo 4MB.')
      return
    }

    setError('')

    try {
      // Comprimir imagen
      const compressed = await compressImage(file, {
        maxSizeMB: 4,
        maxWidthOrHeight: 1920,
        quality: 0.8,
      })

      // Verificar tamaño después de comprimir
      if (compressed.size > maxSize) {
        setError('La imagen sigue siendo muy grande después de comprimir.')
        return
      }

      setImageFile(compressed)

      // Preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(compressed)
    } catch (err) {
      setError('Error al procesar la imagen')
      console.error(err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      setError('Completa todos los campos')
      return
    }

    setCreating(true)
    setError('')
    setUploadProgress(0)

    try {
      let imageUrl = editingNews?.image_url || null

      // Upload imagen si hay una nueva
      if (imageFile) {
        setUploadProgress(30)

        const fileName = `news-${Date.now()}.jpg`
        
        const { error: uploadError } = await supabase.storage
          .from('news_images')
          .upload(fileName, imageFile, {
            contentType: 'image/jpeg',
            upsert: false
          })

        if (uploadError) throw uploadError

        setUploadProgress(60)

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

        setUploadProgress(80)
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

      setUploadProgress(100)

      // Reset form
      setTitle('')
      setContent('')
      setImageFile(null)
      setImagePreview(null)
      setShowForm(false)
      setEditingNews(null)
      loadNews()
      if (standId) checkPostLimit()
    } catch (err: any) {
      setError('Error: ' + err.message)
    }

    setCreating(false)
    setUploadProgress(0)
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
    setError('')
    setUploadProgress(0)
  }

  function removeImage() {
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
      if (standId) checkPostLimit()
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
        <button
          onClick={() => setViewingNews(null)}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          ← Volver a noticias
        </button>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {viewingNews.image_url && (
            <img 
              src={viewingNews.image_url} 
              alt={viewingNews.title}
              className="w-full h-64 object-cover"
            />
          )}

          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {viewingNews.author_logo ? (
                <img 
                  src={viewingNews.author_logo} 
                  alt={viewingNews.author_name}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600">
                    {viewingNews.author_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">
                {viewingNews.author_name}
              </span>
            </div>

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

  const canCreatePost = !postLimit || postLimit.can_post

  return (
    <div className="space-y-4">
      {/* Header con contador */}
      {canEdit && postLimit && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Publicaciones de hoy</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {postLimit.remaining > 0 
                ? `Te quedan ${postLimit.remaining} disponibles`
                : 'Límite alcanzado, vuelve mañana'
              }
            </p>
          </div>
          <div className="text-3xl font-bold text-indigo-600">
            {postLimit.posts_today}/{postLimit.limit}
          </div>
        </div>
      )}

      {/* Límite alcanzado */}
      {canEdit && postLimit && !canCreatePost && !showForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-900">Límite diario alcanzado</p>
              <p className="text-sm text-amber-700 mt-1">
                Has publicado {postLimit.posts_today} noticias hoy. El límite es {postLimit.limit} publicaciones por día.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botón agregar */}
      {canEdit && !showForm && canCreatePost && (
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
            
            {/* Título */}
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

            {/* Contenido */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Contenido *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 resize-none"
                rows={6}
                required
                placeholder="Escribe el contenido de la noticia..."
              />
            </div>

            {/* Upload de imagen */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Imagen (opcional)
                <span className="text-gray-400 ml-1">Máx. 4 MB</span>
              </label>
              
              {!imagePreview ? (
                <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="text-gray-500 text-sm">
                    <div className="text-2xl mb-2">
                      {isCompressing ? '⏳' : '📷'}
                    </div>
                    {isCompressing ? 'Comprimiendo...' : 'Toca para subir imagen'}
                  </div>
                </label>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {imageFile && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Barra de progreso */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Subiendo...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={creating || isCompressing}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 text-sm"
              >
                {creating ? 'Guardando...' : isCompressing ? 'Comprimiendo...' : editingNews ? 'Guardar' : 'Publicar'}
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

              <div className="p-4">
                <div 
                  onClick={() => !canEdit && setViewingNews(newsItem)}
                  className={!canEdit ? 'cursor-pointer' : ''}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {newsItem.author_logo ? (
                      <img 
                        src={newsItem.author_logo} 
                        alt={newsItem.author_name}
                        className="w-6 h-6 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-600">
                          {newsItem.author_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-xs font-medium text-gray-600">
                      {newsItem.author_name}
                    </span>
                  </div>

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

                {!canEdit && (
                  <button
                    onClick={() => setViewingNews(newsItem)}
                    className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Leer más →
                  </button>
                )}

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