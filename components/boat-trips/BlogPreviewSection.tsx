'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

type BlogPost = {
  id: string
  title: string
  excerpt: string | null
  featured_image: string | null
  created_at: string
  slug: string
}

type BlogPreviewSectionProps = {
  posts: BlogPost[]
  locale: string
}

export function BlogPreviewSection({ posts, locale }: BlogPreviewSectionProps) {
  const t = useTranslations('BoatTrips.blog')

  return (
    <section id="blog" className="py-32 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden scroll-mt-20">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16" data-aos="fade-up">
          <div className="text-center md:text-left mb-8 md:mb-0">
            <h2 className="font-geist text-5xl sm:text-6xl font-bold mb-4 text-blue-600">
              {t('title')}
            </h2>
            <p className="text-2xl text-blue-400">
              {t('subtitle')}
            </p>
          </div>
          <Link href={`/${locale}/blog?subject=boat-trips`}>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg px-8 py-6 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 group flex items-center gap-2"
            >
              {t('viewAll')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
            {posts.slice(0, 3).map((post, index) => (
              <Link
                key={post.id}
                href={`/${locale}/blog/${post.slug}`}
                className="group block"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <article className="bg-white rounded-3xl overflow-hidden transition-all duration-500 hover:scale-105 border-2 border-blue-100 hover:border-blue-300 shadow-xl hover:shadow-2xl h-full flex flex-col">
                  {/* Image */}
                  {post.featured_image && (
                    <div className="relative h-64 overflow-hidden">
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-125"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                      
                      {/* Read time badge */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-bold text-blue-600">5 min</span>
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-8 flex-1 flex flex-col bg-gradient-to-br from-white to-blue-50/30">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-blue-400 mb-4">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.created_at).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-blue-700 mb-4 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-blue-500 line-clamp-3 leading-relaxed mb-6 flex-1">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Read more */}
                    <div className="flex items-center text-blue-600 font-bold group-hover:text-blue-500 transition-colors mt-auto">
                      {t('readMore')}
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20" data-aos="fade-up">
            <div className="inline-block bg-white rounded-3xl p-12 shadow-xl border-2 border-blue-100">
              <p className="text-2xl text-blue-500 font-semibold">{t('noPosts')}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
