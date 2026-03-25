'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AsistenteStandsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [stands, setStands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'attendee') { router.push('/login'); return }

      const { data: standsData } = await supabase
        .from('stands')
        .select('*')
        .order('created_at', { ascending: true })

      const standList = standsData ?? []

      if (standList.length > 0) {
        const standIds = standList.map((s: any) => s.id)
        const { data: postsData } = await supabase
          .from('stand_posts')
          .select('*')
          .in('stand_id', standIds)

        const postsByStand: Record<string, any[]> = {}
        for (const p of postsData ?? []) {
          if (!postsByStand[p.stand_id]) postsByStand[p.stand_id] = []
          postsByStand[p.stand_id].push(p)
        }

        setStands(standList.map((s: any) => ({ ...s, stand_posts: postsByStand[s.id] ?? [] })))
      } else {
        setStands([])
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <Link
              href="/asistente/inicio"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Stands</h1>
              <p className="text-sm text-white/80 mt-0.5">Noticias y novedades</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-cyan-400"></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">

        {stands.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏪</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin stands</h3>
            <p className="text-sm text-gray-500">No hay stands registrados aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stands.map(stand => {
              const posts: any[] = stand.stand_posts ?? []
              const lastPost = [...posts].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]

              return (
                <div key={stand.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

                  {/* Stand header */}
                  <div className="px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {stand.logo_url ? (
                          <img
                            src={stand.logo_url}
                            alt={stand.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                            <span className="text-lg">🏪</span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{stand.name}</p>
                          <p className="text-sm text-gray-500">{stand.brand}</p>
                        </div>
                      </div>
                      {posts.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                          {posts.length} {posts.length === 1 ? 'noticia' : 'noticias'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Última noticia */}
                  <div className="px-5 py-4">
                    {lastPost ? (
                      <>
                        <p className="text-sm font-medium text-gray-700">{lastPost.title}</p>
                        {lastPost.body && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{lastPost.body}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(lastPost.created_at).toLocaleString('es-MX')}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">Sin noticias por ahora</p>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
