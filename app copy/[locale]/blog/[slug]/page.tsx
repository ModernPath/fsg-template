import { createClient } from '@/utils/supabase/server'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { Database } from '@/types/database'
import Comments from '@/components/blog/Comments'
import FloatingNav from '@/components/blog/FloatingNav'
import StructuredData from '@/components/structured-data'
import { generateLocalizedMetadata, generateArticleStructuredData } from '@/utils/metadata'
import BlogContent from '@/components/blog/BlogContent'

type Post = Database['public']['Tables']['posts']['Row']
type SimilarPost = {
  id: string
  title: string
  slug: string
  content: string
  similarity: number
}

interface Props {
  params: Promise<{
    locale: string
    slug: string
  }>
}

// Helper function to strip HTML tags from content
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

async function getPost(slug: string, locale: string): Promise<Post | null> {
  const supabase = await createClient()
  
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('locale', locale)
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  return post
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations('Blog')
  const post = await getPost(slug, locale)

  if (!post) {
    return generateLocalizedMetadata(locale, 'Blog', {
      title: t('notFound'),
      description: t('notFoundDescription'),
      noindex: true
    })
  }

  const description = post.excerpt || stripHtmlTags(post.content).substring(0, 150)
  const canonicalUrl = `/blog/${post.slug}`
  const defaultBlogOgImage = '/images/og/blog-og.webp'

  return generateLocalizedMetadata(locale, 'Blog', {
    title: post.title,
    description,
    image: post.featured_image || defaultBlogOgImage,
    type: 'article',
    publishedTime: post.created_at,
    modifiedTime: post.updated_at,
    authors: ['TrustyFinance Team'],
    tags: post.tags || undefined,
    canonicalUrl
  })
}

// Get similar posts
async function getSimilarPosts(postId: string, locale: string): Promise<SimilarPost[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    // For server-side absolute URLs, ensure we have a valid base URL
    const apiUrl = baseUrl.startsWith('http') 
      ? `${baseUrl}/api/blog/similar` 
      : `/api/blog/similar`
    
    const response = await fetch(`${apiUrl}?postId=${postId}&locale=${locale}`)
    if (!response.ok) return []
    const { posts } = await response.json()
    return posts
  } catch (error) {
    console.error('Error fetching similar posts:', error)
    return []
  }
}

export default async function BlogPost({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations('Blog')
  const post = await getPost(slug, locale)

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl bg-black text-white">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-8 text-white">{t('notFound')}</h1>
        <p className="text-xl text-gray-300 mb-8">{t('notFoundDescription')}</p>
        <Link 
          href={`/${locale}/blog`} 
          className="inline-flex items-center text-lg font-semibold text-purple-500 hover:text-purple-400 transition-colors duration-200"
        >
          <span className="mr-2">←</span>
          {t('backToBlog')}
        </Link>
      </div>
    )
  }

  const similarPosts = await getSimilarPosts(post.id, locale)

  const structuredData = generateArticleStructuredData({
    title: post.title,
    description: post.excerpt || stripHtmlTags(post.content).substring(0, 150),
    image: post.featured_image || undefined,
    publishedTime: post.created_at,
    modifiedTime: post.updated_at,
    authors: ['TrustyFinance Team'],
    tags: post.tags || undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/blog/${post.slug}`
  })

  return (
    <div className="bg-black min-h-screen">
      <StructuredData data={structuredData} />
      <article className="container mx-auto px-4 py-12 max-w-5xl">
        {post.featured_image && (
          <div className="relative w-full h-[500px] mb-12 rounded-2xl overflow-hidden shadow-2xl hover:shadow-gold-primary/10 transition-shadow duration-300">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
        )}
        <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-8 text-white">{post.title}</h1>
        <BlogContent content={post.content} />
        
        {/* Call-to-Action Section */}
        {(post.cta_text || post.cta_button_text) && (
          <div className="mt-16 mb-12 p-8 bg-gradient-to-r from-gray-very-dark to-gray-dark rounded-2xl border border-gray-dark shadow-xl">
            {post.cta_text && (
              <div className="text-lg text-gray-200 mb-6 leading-relaxed">
                {post.cta_text.split('\n').map((line, index) => (
                  <p key={index} className={index > 0 ? 'mt-4' : ''}>
                    {line}
                  </p>
                ))}
              </div>
            )}
            {post.cta_button_text && post.cta_button_link && (
              <div className="flex justify-center">
                <Link
                  href={post.cta_button_link}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gold-primary to-yellow-500 text-black font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:from-yellow-400 hover:to-gold-primary"
                  target={post.cta_button_link.startsWith('http') ? '_blank' : undefined}
                  rel={post.cta_button_link.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {post.cta_button_text}
                  {post.cta_button_link.startsWith('http') && (
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-gray-dark">
          <Comments postId={post.id} />
        </div>
      </article>
      <FloatingNav locale={locale} />
      {similarPosts.length > 0 && (
        <div className="mt-16 mb-12 max-w-5xl mx-auto px-4">
          <h2 className="text-4xl font-extrabold leading-tight mb-8 text-white">{t('similarPosts')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarPosts.map((similar: SimilarPost) => (
              <Link
                key={similar.id}
                href={`/${locale}/blog/${similar.slug}`}
                className="block group"
              >
                <div className="border border-gray-dark rounded-2xl p-6 hover:shadow-2xl hover:shadow-gold-primary/10 transition-all duration-300 bg-gray-very-dark">
                  <h3 className="font-bold text-xl mb-3 text-white group-hover:text-gold-highlight transition-all duration-300">
                    {similar.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-3">
                    {stripHtmlTags(similar.content).substring(0, 150)}...
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="text-center mb-12">
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center text-lg font-semibold text-gold-highlight hover:text-gold-primary transition-colors duration-200"
        >
          <span className="mr-2">←</span>
          {t('backToBlog')}
        </Link>
      </div>
    </div>
  )
}
