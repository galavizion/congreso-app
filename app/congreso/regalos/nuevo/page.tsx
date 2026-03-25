'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuevoRegaloPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    points_cost: '',
    stock: '',
    image: null as File | null,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setForm({ ...form, image: file })
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Obtener perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.congress_id) {
      setError('No se encontró el congreso')
      setLoading(false)
      return
    }

    // Subir imagen si existe
    let imageUrl: string | null = null

    if (form.image) {
      const fileExt = form.image.name.split('.').pop()
      const fileName = `gift-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('stand_logos')
        .upload(fileName, form.image)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('stand_logos')
          .getPublicUrl(fileName)
        
        imageUrl = publicUrl
      }
    }

    // Crear regalo CON imagen
    const { error: insertError } = await supabase
      .from('gifts')
      .insert({
        congress_id: profile.congress_id,
        name: form.name,
        description: form.description,
        points_cost: parseInt(form.points_cost),
        stock: parseInt(form.stock),
        image_url: imageUrl,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    window.location.href = '/congreso/regalos'
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 text-xl">‹</button>
        <h1 className="text-lg font-semibold text-gray-900">Nuevo regalo</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Nombre</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej. Taza WinWin"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Descripción del regalo"
              rows={3}
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
  <label className="text-sm font-medium text-gray-600">Imagen (opcional)</label>
  <p className="text-xs text-gray-400 mb-2">
    💡 Sube una imagen cuadrada (500x500px recomendado) para mejores resultados
  </p>
  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={handleImageChange}
    className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
  />
  {form.image && (
    <p className="text-xs text-gray-500 mt-1">
      {form.image.name} ({(form.image.size / 1024).toFixed(1)} KB)
    </p>
  )}
</div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-gray-600">Puntos necesarios</label>
              <input
                name="points_cost"
                type="number"
                value={form.points_cost}
                onChange={handleChange}
                placeholder="Ej. 50"
                className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-gray-600">Stock</label>
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                placeholder="Ej. 100"
                className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gray-900 text-white rounded-xl px-4 py-4 text-base font-medium hover:bg-gray-700 active:bg-gray-800 transition-colors disabled:opacity-50 w-full"
        >
          {loading ? 'Guardando...' : 'Crear regalo'}
        </button>

      </div>
    </div>
  )
}