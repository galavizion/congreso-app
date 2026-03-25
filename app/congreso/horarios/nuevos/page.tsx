'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <Link
              href="/congreso/horarios"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Nueva Conferencia</h1>
              <p className="text-sm text-white/80 mt-0.5">Agrega una sesión al horario</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-violet-400"></div>
      </div>

      <div className="px-6 py-8 flex flex-col gap-4 max-w-5xl mx-auto">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Título</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ej. Avances en cardiología"
              className="border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Ponente</label>
            <input
              name="speaker"
              value={form.speaker}
              onChange={handleChange}
              placeholder="Ej. Dr. Juan Pérez"
              className="border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Sala</label>
            <input
              name="room"
              value={form.room}
              onChange={handleChange}
              placeholder="Ej. Auditorio A"
              className="border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors"
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
                className="border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-gray-600">Fin</label>
              <input
                name="ends_at"
                type="datetime-local"
                value={form.ends_at}
                onChange={handleChange}
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
          {loading ? 'Guardando...' : 'Crear conferencia'}
        </button>

      </div>
    </div>
  )
}
