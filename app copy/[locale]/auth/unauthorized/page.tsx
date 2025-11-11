import { useTranslations } from 'next-intl'
import { Link } from '@/app/i18n/navigation'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const t = useTranslations('Auth.Unauthorized')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          <div className="mb-6">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {t('title', { default: 'Käyttöoikeus evätty' })}
          </h1>
          
          <p className="text-muted-foreground mb-8">
            {t('description', { 
              default: 'Sinulla ei ole riittäviä käyttöoikeuksia tämän sivun katseluun. Tarvitset admin-käyttöoikeudet.' 
            })}
          </p>

          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToHome', { default: 'Takaisin etusivulle' })}
            </Link>
          </div>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {t('contactAdmin', { 
                default: 'Jos uskot, että tämä on virhe, ota yhteyttä järjestelmänvalvojaan.' 
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
