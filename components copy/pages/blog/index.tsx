'use client'

import Image from "next/image"
import { useTranslations } from 'next-intl'
import { Button } from '@/app/components/Button'
import { Link } from '@/app/i18n/navigation'
import { formatDate } from '@/utils/date'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  slug: string
  cover_image: string
  author: {
    name: string
  }
  category: string
  published_at: string
  reading_time: number
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Props {
  params: {
    locale: string
  }
  posts: BlogPost[]
  categories: Category[]
  currentCategory?: string
  error?: any
}

export default function BlogPageContent({ params, posts, categories, currentCategory, error }: Props) {
  const { locale } = params
  const t = useTranslations('Blog')

  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden pt-8 pb-16 md:pt-12 md:pb-20">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <Image
            src="/images/finance-office-interior-optimized.webp"
            alt="Blog background"
            fill
            quality={75}
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        
        <div className="container mx-auto px-8 relative max-w-[1440px] z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
              {t('meta.title')}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-white leading-relaxed mb-10">
              {t('meta.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
              <section className="py-8 bg-background border-t border-gray-dark sticky top-0 z-10 backdrop-blur-lg bg-background/90">
        <div className="container mx-auto px-8 max-w-[1440px]">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/blog"
              className={`px-6 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                !currentCategory
                  ? 'bg-gold-primary text-black shadow-lg shadow-gold-primary/25 transform hover:scale-105'
                  : 'bg-gray-very-dark text-gold-primary border border-gray-dark hover:border-gold-primary'
              }`}
            >
              {t('categories.all')}
            </Link>
            {(categories ?? []).map((cat: Category) => (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className={`px-6 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                  currentCategory === cat.slug
                    ? 'bg-gold-primary text-black shadow-lg shadow-gold-primary/25 transform hover:scale-105'
                    : 'bg-gray-very-dark text-gold-primary border border-gray-dark hover:border-gold-primary'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className="py-12 bg-black">
        <div className="container mx-auto px-8 max-w-[1440px]">
          {error ? (
            <div className="text-center text-white bg-gray-very-dark p-8 rounded-2xl border border-gray-dark">
              <p className="text-xl font-medium">{t('error.loading')}</p>
            </div>
          ) : posts?.length === 0 ? (
            <div className="text-center text-white bg-gray-very-dark p-8 rounded-2xl border border-gray-dark">
              <p className="text-xl font-medium">{t('error.noPosts')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {(posts ?? []).map((post: BlogPost) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group"
                >
                  <article className="bg-gray-very-dark rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 border border-gray-dark hover:border-gold-primary h-full flex flex-col">
                    <div className="relative h-64">
                      <Image
                        src={post.cover_image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    </div>
                    <div className="p-8 flex flex-col flex-grow">
                      <div className="flex items-center gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {post.author.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatDate(post.published_at)} · {post.reading_time} min
                          </p>
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold mb-4 text-white group-hover:text-gold-highlight transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-gray-300 line-clamp-3 group-hover:text-white transition-colors flex-grow">
                        {post.excerpt}
                      </p>
                      <div className="mt-6 flex items-center text-white font-medium">
                        <span className="group-hover:text-gold-highlight transition-colors">Lue lisää</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 bg-black border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-white mb-10">
              {t('cta.description')}
            </p>
            <Button
              size="lg"
              href="/contact"
              variant="primary"
              className="h-14 px-10 text-lg bg-gold-primary hover:bg-gold-highlight text-black rounded-xl shadow-lg"
            >
              {t('cta.button')}
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
} 