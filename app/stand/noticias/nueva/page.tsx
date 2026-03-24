'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuevaNoticiaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    body: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, stands(*)')
      .eq('id', user.id)
      .single()

    const stand = (profile as any)?.stands

    if (!stand) {
      setError('No se encontró el stand')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('stand_posts')
      .insert({
        stand_id: stand.id,
        title: form.title,
        body: form.body,
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/stand/noticias')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 text-xl"
        >
          ‹
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Nueva noticia</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Título</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ej. Estamos sirviendo café gratis"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Mensaje</label>
            <textarea
              name="body"
              value={form.body}
              onChange={handleChange}
              placeholder="Cuéntale a los asistentes qué está pasando en tu stand..."
              rows={4}
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400 resize-none"
            />
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
          {loading ? 'Publicando...' : 'Publicar noticia'}
        </button>

      </div>
    </div>
  )
}