'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', data.user.id)
  .single()

console.log('👤 Profile encontrado:', profile) // ← AGREGAR ESTO
console.log('🎯 Rol:', profile?.role)        

if (!profile) {
  setError('No se encontró el perfil')
  setLoading(false)
  return
}

const routes: Record<string, string> = {
  god: '/god-admin/dashboard',        // ← Cambiar de 'god_admin' a 'god'
  god_admin: '/god-admin/dashboard',  // ← Dejar ambos por si acaso
  congress: '/congress/dashboard',
  stand: '/stand/dashboard',
  attendee: '/asistente/inicio',
}

// Esperar a que Supabase guarde la sesión
await supabase.auth.getSession()

window.location.href = routes[profile.role] ?? '/login'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">WinWin</h1>
          <p className="text-gray-500 text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400 w-full"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400 w-full"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-gray-900 text-white rounded-xl px-4 py-3 text-base font-medium hover:bg-gray-700 active:bg-gray-800 transition-colors disabled:opacity-50 w-full mt-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}