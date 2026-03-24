'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qrCode = searchParams.get('qr')
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleRegister() {
    setLoading(true)
    setError('')

    // 1. Crear usuario
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Error al registrarse')
      setLoading(false)
      return
    }

    // 2. Crear perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        role: 'attendee',
        name: form.name,
        email: form.email,
      })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    // 3. Si venía de un QR, procesar el escaneo
    if (qrCode) {
      router.push(`/scan/${qrCode}`)
    } else {
      router.push('/asistente/inicio')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">WinWin</h1>
          <p className="text-gray-500 text-sm mt-1">Crea tu cuenta para ganar puntos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">

          {qrCode && (
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-green-700 text-sm font-medium">
                🎉 Estás a un paso de ganar tus primeros puntos
              </p>
            </div>
          )}

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Tu nombre"
            className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400 w-full"
          />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Correo electrónico"
            className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400 w-full"
          />
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Contraseña"
            className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400 w-full"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="bg-gray-900 text-white rounded-xl px-4 py-3 text-base font-medium hover:bg-gray-700 active:bg-gray-800 transition-colors disabled:opacity-50 w-full mt-2"
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>

          <button
            onClick={() => router.push(qrCode ? `/login?qr=${qrCode}` : '/login')}
            className="text-gray-400 text-sm text-center"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>

        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}