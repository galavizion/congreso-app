'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuevoCongresoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    slug: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const { error } = await supabase
      .from('congresses')
      .insert({
        name: form.name,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
        slug: form.slug,
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
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
        <h1 className="text-lg font-semibold text-gray-900">Nuevo congreso</h1>
      </div>

      {/* Form */}
      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Nombre</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej. Congreso de Medicina 2025"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Descripción breve del congreso"
              rows={3}
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-gray-600">Inicio</label>
              <input
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-gray-600">Fin</label>
              <input
                name="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
                className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Slug</label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="Ej. congreso-medicina-2025"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
            <p className="text-xs text-gray-400">Identificador único sin espacios ni acentos</p>
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
          {loading ? 'Guardando...' : 'Crear congreso'}
        </button>

      </div>
    </div>
  )
}