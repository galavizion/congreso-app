'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#987BA6] via-[#94BBE9] to-[#987BA6] flex items-center justify-center">
      <div className="text-white text-xl">Redirigiendo...</div>
    </div>
  )
}