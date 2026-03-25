'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <Link
              href="/congreso/regalos"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Nuevo Regalo</h1>
              <p className="text-sm text-white/80 mt-0.5">Agrega un premio al catálogo</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-rose-400"></div>
      </div>

      <div className="px-6 py-8 flex flex-col gap-4 max-w-5xl mx-auto">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Nombre</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej. Taza WinWin"
              className="border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors"
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
              className="border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors resize-none"
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
              className="border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-indigo-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
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
                className="border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors"
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
                className="border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors"
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
          className="bg-indigo-600 text-white text-sm font-semibold px-5 py-4 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-50 w-full"
        >
          {loading ? 'Guardando...' : 'Crear regalo'}
        </button>

      </div>
    </div>
  )
}
