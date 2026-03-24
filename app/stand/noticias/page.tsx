import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function NoticiasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, stands(*)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'stand') redirect('/login')

  const stand = (profile as any).stands

  const { data: posts } = await supabase
    .from('stand_posts')
    .select('*')
    .eq('stand_id', stand.id)
    .order('created_at', { ascending: false })

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

        {posts?.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            No has publicado noticias aún.
          </div>
        )}

        {posts?.map(post => (
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