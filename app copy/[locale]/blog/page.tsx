import { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/app/i18n/navigation'
import { generateLocalizedMetadata } from '@/utils/metadata'
import { formatDate } from '@/utils/date'
import { setupServerLocale } from '@/app/i18n/server'
import BlogPageContent from '@/components/pages/blog/index'

interface Props {
  params: {
    locale: string
  }
  searchParams: {
    category?: string
    page?: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params
  const t = await getTranslations('Blog')
  
  return generateLocalizedMetadata(locale, 'Blog', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'website',
    canonicalUrl: '/blog',
    image: '/images/og/blog-og.webp'
  })
}

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
  created_at: string
  subject: string
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = params;
  const categorySlug = searchParams.category;
  const page = Number(searchParams.page) || 1;
  const postsPerPage = 9;

  await setupServerLocale(locale);
  const t = await getTranslations('Blog');

  const supabase = await createClient();
  
  const { data: distinctSubjects, error: subjectsError } = await supabase
    .from('posts')
    .select('subject')
    .eq('locale', locale)
    .eq('published', true);

  if (subjectsError) {
    console.error('Error fetching distinct subjects for categories:', subjectsError);
  }

  const categories: Category[] = [];
  if (distinctSubjects) {
    const uniqueSubjects = [...new Set(distinctSubjects.map(item => item.subject).filter(Boolean))];
    uniqueSubjects.forEach(subject => {
      categories.push({
        id: subject,
        name: subject.charAt(0).toUpperCase() + subject.slice(1).replace(/-/g, ' '),
        slug: subject
      });
    });
  }
  
  let query = supabase
    .from('posts')
    .select('*, profiles(*)')
    .eq('locale', locale)
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (categorySlug) {
    query = query.eq('subject', categorySlug);
  }

  const { data: fetchedPosts, error: postsError } = await query;

  if (postsError) {
    console.error('Error fetching posts:', postsError);
  }
  
  const posts: BlogPost[] = (fetchedPosts || []).map(p => ({
    id: p.id,
    title: p.title,
    excerpt: p.excerpt ?? '',
    slug: p.slug,
    cover_image: p.featured_image ?? '/images/default-blog-image.webp',
    author: p.profiles ? {
      name: p.profiles.full_name,
    } : {
      name: 'TrustyFinance Team',
    },
    category: p.subject,
    published_at: p.created_at,
    reading_time: Math.ceil((p.content?.split(' ').length ?? 0) / 200),
    created_at: p.created_at,
    subject: p.subject,
  }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: t('title'),
    description: t('description'),
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'TrustyFinance Inc',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo.png`,
      },
    },
    blogPost: posts.map((post: BlogPost) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.published_at,
      image: post.cover_image,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/blog/${post.slug}`,
      author: {
        '@type': 'Person',
        name: post.author?.name ?? 'TrustyFinance Team',
      }
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BlogPageContent 
        params={{ locale }}
        posts={posts ?? []}
        categories={categories ?? []}
        currentCategory={categorySlug}
        error={postsError}
      />
    </>
  )
}
