'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuevoStandCongresPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    brand: '',
    description: '',
    email: '',
    password: '',
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
      .select('*, congresses(*)')
      .eq('id', user.id)
      .single()

    const congress = (profile as any)?.congresses

    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Error al crear usuario')
      setLoading(false)
      return
    }

    // 2. Crear stand
    const { data: stand, error: standError } = await supabase
      .from('stands')
      .insert({
        congress_id: congress.id,
        name: form.name,
        brand: form.brand,
        description: form.description,
      })
      .select()
      .single()

    if (standError || !stand) {
      setError(standError?.message ?? 'Error al crear stand')
      setLoading(false)
      return
    }

    // 3. Crear perfil del stand
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        role: 'stand',
        name: form.name,
        email: form.email,
        congress_id: congress.id,
        stand_id: stand.id,
      })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    router.push('/congreso/stands')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 text-xl">‹</button>
        <h1 className="text-lg font-semibold text-gray-900">Nuevo stand</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">

        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-sm font-medium text-gray-500">Datos del stand</p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Nombre</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej. Stand Farmacéutica XYZ"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Marca</label>
            <input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder="Ej. Farmacéutica XYZ"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Breve descripción del stand"
              rows={3}
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400 resize-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-sm font-medium text-gray-500">Acceso del expositor</p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Correo</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="correo@stand.com"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Contraseña temporal</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gray-900 text-white rounded-xl px-4 py-4 text-base font-medium hover:bg-gray-700 active:bg-gray-800 transition-colors disabled:opacity-50 w-full"
        >
          {loading ? 'Guardando...' : 'Crear stand'}
        </button>

      </div>
    </div>
  )
}