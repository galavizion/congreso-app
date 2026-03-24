'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NoticiasPage() {
  const router = useRouter()
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>([])
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

      if (!profile || profile.role !== 'stand') { router.push('/login'); return }

      const { data: stand } = await supabase
        .from('stands')
        .select('*')
        .eq('id', profile.stand_id)
        .single()

      const { data: postsData } = await supabase
        .from('stand_posts')
        .select('*')
        .eq('stand_id', stand?.id)
        .order('created_at', { ascending: false })

      setPosts(postsData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/stand/dashboard" className="text-gray-400 text-xl">‹</Link>
          <h1 className="text-lg font-semibold text-gray-900">Noticias</h1>
        </div>
        <Link
          href="/stand/noticias/nueva"
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          + Nueva
        </Link>
      </div>

      <div className="px-4 py-6 flex flex-col gap-3 max-w-2xl mx-auto">

        {posts.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            No has publicado noticias aún.
          </div>
        )}

        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="font-semibold text-gray-900">{post.title}</p>
            {post.body && (
              <p className="text-sm text-gray-500 mt-1">{post.body}</p>
            )}
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-40 object-cover rounded-xl mt-3"
              />
            )}
            <p className="text-xs text-gray-300 mt-3">
              {new Date(post.created_at).toLocaleString('es-MX')}
            </p>
          </div>
        ))}

      </div>
    </div>
  )
}
