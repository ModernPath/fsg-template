'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { usePartner } from '@/hooks/usePartners'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { 
  ArrowLeft,
  Edit,
  QrCode,
  Copy,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  Mail,
  Phone,
  Building,
  Activity,
  Crown,
  Star,
  Globe,
  Bell,
  CreditCard,
  Zap,
  Shield,
  Settings,
  ExternalLink
} from 'lucide-react'
import { Link } from '@/app/i18n/navigation'
import { format } from 'date-fns'
import { fi } from 'date-fns/locale'
import { useParams } from 'next/navigation'

// Tier configurations (same as edit page)
const TIER_CONFIG = {
  basic: {
    icon: Building,
    color: 'bg-gray-100 border-gray-300',
    badgeColor: 'bg-gray-500',
    name: 'Perustaso',
    maxCommission: 5,
    features: [
      'Perusseuranta',
      'Kuukausiraportit',
      'Signup-linkki',
      'Sähköpostinnotifikaatiot'
    ]
  },
  premium: {
    icon: Star,
    color: 'bg-blue-50 border-blue-300',
    badgeColor: 'bg-blue-500',
    name: 'Premium',
    maxCommission: 15,
    features: [
      'Reaaliaikaseuranta',
      'Viikoittaiset raportit',
      'Mukautetut signup-sivut',
      'API-käyttöoikeus',
      'Prioriteettituki'
    ]
  },
  enterprise: {
    icon: Crown,
    color: 'bg-amber-50 border-amber-300',
    badgeColor: 'bg-amber-500',
    name: 'Yritystaso',
    maxCommission: 30,
    features: [
      'Kaikki Premium-ominaisuudet',
      'Mukautettu brändäys',
      'Dedicated tukihenkilö',
      'Erikoisraportit',
      'Integraatio-oikeudet',
      'Mukautetut komissiot'
    ]
  }
}

export default function PartnerDetailPage() {
  const params = useParams()
  const partnerId = params.id as string
  const t = useTranslations('AdminPartners')
  const { user } = useAuth()
  
  const { partner, loading, error, refetch } = usePartner(partnerId)
  const [copySuccess, setCopySuccess] = useState(false)

  // Check admin access
  const isAdmin = true // In real app would check user.user_metadata?.is_admin

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Sinulla ei ole oikeuksia nähdä tätä sivua.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleCopySignupUrl = async () => {
    if (partner?.signup_code) {
      const signupUrl = `${window.location.origin}/partner-signup?code=${partner.signup_code}`
      try {
        await navigator.clipboard.writeText(signupUrl)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Ladataan...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Kumppania ei löytynyt</AlertDescription>
        </Alert>
      </div>
    )
  }

  const currentTier = TIER_CONFIG[partner.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.basic
  const TierIcon = currentTier.icon
  const contactInfo = partner.contact_info || {}
  const settings = partner.settings || {}

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Aktiivinen' },
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'Ei aktiivinen' },
      suspended: { color: 'bg-red-100 text-red-800', text: 'Jäädytetty' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
    return <Badge className={config.color}>{config.text}</Badge>
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/partners">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('detail.backToList')}
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">{partner.name}</h1>
              <Badge className={`${currentTier.badgeColor} text-white`}>
                <TierIcon className="h-3 w-3 mr-1" />
                {currentTier.name}
              </Badge>
            </div>
            <p className="text-muted-foreground">{partner.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/admin/partners/${partner.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              {t('detail.edit')}
            </Button>
          </Link>
          {partner.signup_code && (
            <Button onClick={handleCopySignupUrl} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              {copySuccess ? t('detail.copied') : t('detail.copyLink')}
            </Button>
          )}
        </div>
      </div>

      {/* Status and Tier Badges */}
      <div className="flex items-center space-x-4">
        {getStatusBadge(partner.status)}
        <Badge variant="secondary">
          Komissio: {partner.commission_percent}%
        </Badge>
        <Badge variant="secondary">
          Liittynyt: {format(new Date(partner.created_at), 'dd.MM.yyyy')}
        </Badge>
      </div>

      {/* Main Info Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              {t('detail.basicInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{partner.email}</span>
            </div>
            {partner.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{partner.phone}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Liittynyt {format(new Date(partner.created_at), 'dd.MM.yyyy')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tier Information with Visual Enhancement */}
        <Card className={`${currentTier.color} border-2`}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TierIcon className="h-5 w-5 mr-2" />
              {currentTier.name}
              <Badge className={`ml-2 ${currentTier.badgeColor} text-white`}>
                Max {currentTier.maxCommission}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Nykyinen komissio:</span>
                <Badge variant="secondary">{partner.commission_percent}%</Badge>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Ominaisuudet:</span>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {currentTier.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Zap className="h-3 w-3 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              {t('stats.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Yrityksiä</span>
              </div>
              <span className="font-semibold">{partner.stats?.total_companies || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Komissioita</span>
              </div>
              <span className="font-semibold">€{partner.stats?.total_commissions?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Hakemuksia</span>
              </div>
              <span className="font-semibold">{partner.stats?.total_applications || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              {t('detail.contactInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contactInfo.linkedin && (
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={contactInfo.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  LinkedIn
                </a>
              </div>
            )}
            {contactInfo.company_website && (
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={contactInfo.company_website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Verkkosivut
                </a>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {contactInfo.preferred_contact_method === 'email' ? 'Sähköposti' :
                 contactInfo.preferred_contact_method === 'phone' ? 'Puhelin' :
                 contactInfo.preferred_contact_method === 'linkedin' ? 'LinkedIn' : 'Sähköposti'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {contactInfo.timezone || 'Europe/Helsinki'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {contactInfo.language_preference === 'fi' ? 'Suomi' :
                 contactInfo.language_preference === 'en' ? 'English' :
                 contactInfo.language_preference === 'sv' ? 'Svenska' : 'Suomi'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Partner Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              {t('detail.settings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Sähköposti-ilmoitukset</span>
              <Badge variant={settings.email_notifications ? 'default' : 'secondary'}>
                {settings.email_notifications ? 'Käytössä' : 'Ei käytössä'}
              </Badge>
            </div>
                         <div className="flex justify-between items-center">
               <span className="text-sm">Raportointi</span>
               <Badge variant="secondary">
                 {settings.commission_reporting === 'weekly' ? 'Viikoittain' :
                  settings.commission_reporting === 'monthly' ? 'Kuukausittain' :
                  settings.commission_reporting === 'quarterly' ? 'Neljännesvuosittain' : 'Kuukausittain'}
               </Badge>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm">Maksutapa</span>
               <Badge variant="secondary">
                 {settings.payment_method === 'bank_transfer' ? 'Pankkisiirto' :
                  settings.payment_method === 'paypal' ? 'PayPal' :
                  settings.payment_method === 'stripe' ? 'Stripe' : 'Pankkisiirto'}
               </Badge>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm">Minimikotiutus</span>
               <Badge variant="secondary">€{settings.minimum_payout || 100}</Badge>
             </div>
            
            {/* Premium/Enterprise Features */}
            {partner.tier !== 'basic' && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm">API-käyttö</span>
                  <Badge variant={settings.api_access ? 'default' : 'secondary'}>
                    {settings.api_access ? 'Sallittu' : 'Ei sallittu'}
                  </Badge>
                </div>
                
                {partner.tier === 'enterprise' && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Mukautettu brändäys</span>
                    <Badge variant={settings.custom_branding ? 'default' : 'secondary'}>
                      {settings.custom_branding ? 'Käytössä' : 'Ei käytössä'}
                    </Badge>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Signup Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              {t('detail.signupCode')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <span className="text-sm font-medium">Koodi:</span>
              <code className="block px-3 py-2 bg-muted rounded-md text-sm font-mono">
                {partner.signup_code || 'Ei koodia'}
              </code>
            </div>
            
            {partner.signup_code_expires_at && (
              <div className="text-sm text-muted-foreground">
                <strong>Vanhenee:</strong> {new Date(partner.signup_code_expires_at).toLocaleDateString('fi-FI')}
              </div>
            )}
            
            {partner.signup_code && (
              <Button 
                onClick={handleCopySignupUrl} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copySuccess ? 'Kopioitu!' : 'Kopioi signup-URL'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 