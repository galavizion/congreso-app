'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuevoHorarioPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    speaker: '',
    room: '',
    starts_at: '',
    ends_at: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
      .select('*, congresses(*)')
      .eq('id', user.id)
      .single()

    const congress = (profile as any)?.congresses

    const { error } = await supabase
      .from('schedules')
      .insert({
        congress_id: congress.id,
        title: form.title,
        speaker: form.speaker,
        room: form.room,
        starts_at: form.starts_at,
        ends_at: form.ends_at,
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/congreso/horarios')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 text-xl">‹</button>
        <h1 className="text-lg font-semibold text-gray-900">Nueva conferencia</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Título</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ej. Avances en cardiología"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Ponente</label>
            <input
              name="speaker"
              value={form.speaker}
              onChange={handleChange}
              placeholder="Ej. Dr. Juan Pérez"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Sala</label>
            <input
              name="room"
              value={form.room}
              onChange={handleChange}
              placeholder="Ej. Auditorio A"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-gray-600">Inicio</label>
              <input
                name="starts_at"
                type="datetime-local"
                value={form.starts_at}
                onChange={handleChange}
                className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-gray-600">Fin</label>
              <input
                name="ends_at"
                type="datetime-local"
                value={form.ends_at}
                onChange={handleChange}
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
          {loading ? 'Guardando...' : 'Crear conferencia'}
        </button>

      </div>
    </div>
  )
}