import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function NotFoundPage() {
  const t = useTranslations('Common')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {t('errors.pageNotFound', { default: 'Page Not Found' })}
        </h2>
        <p className="text-gray-600 mb-8">
          {t('errors.pageNotFoundDescription', { 
            default: 'The page you are looking for does not exist or has been moved.' 
          })}
        </p>
        <Link
          href="/"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {t('actions.goHome', { default: 'Go to Homepage' })}
        </Link>
      </div>
    </div>
  )
}

