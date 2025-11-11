'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { usePartner, usePartnerMutations } from '@/hooks/usePartners'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

// Custom Switch component that works reliably (copied from surveys)
const CustomSwitch = ({ checked, onChange, disabled = false }: { 
  checked: boolean, 
  onChange: (checked: boolean) => void,
  disabled?: boolean 
}) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
  </label>
)

import { 
  ArrowLeft,
  Save,
  AlertCircle,
  QrCode,
  Crown,
  Star,
  Building,
  Mail,
  Bell,
  CreditCard,
  Globe,
  Zap
} from 'lucide-react'
import { Link } from '@/app/i18n/navigation'
import { useParams, useRouter } from 'next/navigation'
import type { UpdatePartnerRequest } from '@/types/partner'

// Extended form data with direct settings
interface ExtendedPartnerFormData extends UpdatePartnerRequest {
  // Contact info fields
  linkedin?: string
  company_website?: string
  preferred_contact_method?: string
  timezone?: string
  language_preference?: string
  
  // Settings fields
  email_notifications?: boolean
  commission_reporting?: string
  payment_method?: string
  minimum_payout?: number
  custom_branding?: boolean
  api_access?: boolean
}

// Tier configurations
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

export default function PartnerEditPage() {
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string
  const t = useTranslations('AdminPartners')
  const { user } = useAuth()
  
  const { partner, loading, error, refetch } = usePartner(partnerId)
  const { updatePartner, generateSignupCode, loading: mutationLoading, error: mutationError } = usePartnerMutations()
  
  // Extended form state
  const [formData, setFormData] = useState<ExtendedPartnerFormData>({
    name: '',
    email: '',
    phone: '',
    commission_percent: 0,
    tier: 'basic',
    status: 'active',
    contact_info: {},
    settings: {},
    // Contact info
    linkedin: '',
    company_website: '',
    preferred_contact_method: 'email',
    timezone: 'Europe/Helsinki',
    language_preference: 'fi',
    // Settings
    email_notifications: true,
    commission_reporting: 'monthly',
    payment_method: 'bank_transfer',
    minimum_payout: 100,
    custom_branding: false,
    api_access: false
  })
  
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Check admin access
  const isAdmin = true // In real app would check user.user_metadata?.is_admin

  // Load partner data into form when partner loads
  useEffect(() => {
    if (partner) {
      const contactInfo = partner.contact_info || {}
      const settings = partner.settings || {}
      
      setFormData({
        name: partner.name || '',
        email: partner.email || '',
        phone: partner.phone || '',
        commission_percent: partner.commission_percent || 0,
        tier: partner.tier || 'basic',
        status: partner.status || 'active',
        contact_info: contactInfo,
        settings: settings,
        // Contact info
        linkedin: contactInfo.linkedin || '',
        company_website: contactInfo.company_website || '',
        preferred_contact_method: contactInfo.preferred_contact_method || 'email',
        timezone: contactInfo.timezone || 'Europe/Helsinki',
        language_preference: contactInfo.language_preference || 'fi',
        // Settings
        email_notifications: settings.email_notifications ?? true,
        commission_reporting: settings.commission_reporting || 'monthly',
        payment_method: settings.payment_method || 'bank_transfer',
        minimum_payout: settings.minimum_payout || 100,
        custom_branding: settings.custom_branding ?? false,
        api_access: settings.api_access ?? false
      })
    }
  }, [partner])

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

  const handleInputChange = (field: keyof ExtendedPartnerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsFormDirty(true)
  }

  const handleSave = async () => {
    try {
      // Prepare data for API
      const updateData: UpdatePartnerRequest = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        commission_percent: formData.commission_percent,
        tier: formData.tier,
        status: formData.status,
        contact_info: {
          linkedin: formData.linkedin,
          company_website: formData.company_website,
          preferred_contact_method: formData.preferred_contact_method,
          timezone: formData.timezone,
          language_preference: formData.language_preference
        },
        settings: {
          email_notifications: formData.email_notifications,
          commission_reporting: formData.commission_reporting,
          payment_method: formData.payment_method,
          minimum_payout: formData.minimum_payout,
          custom_branding: formData.custom_branding,
          api_access: formData.api_access
        }
      }
      
      const updated = await updatePartner(partnerId, updateData)
      if (updated) {
        setSaveSuccess(true)
        setIsFormDirty(false)
        setTimeout(() => setSaveSuccess(false), 3000)
        refetch()
      }
    } catch (err) {
      console.error('Error updating partner:', err)
    }
  }

  const handleGenerateCode = async () => {
    try {
      const result = await generateSignupCode(partnerId)
      if (result) {
        await navigator.clipboard.writeText(result.signup_url)
        alert(`Uusi rekisteröitymiskoodi luotu!\n\nKoodi: ${result.partner.signup_code}\nLinkki kopioitu leikepöydälle.`)
        refetch()
      }
    } catch (err) {
      console.error('Error generating code:', err)
    }
  }

  const currentTier = TIER_CONFIG[formData.tier as keyof typeof TIER_CONFIG]
  const TierIcon = currentTier.icon

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/admin/partners/${partnerId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('edit.backToList')}
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">{t('edit.title')}</h1>
              <Badge className={`${currentTier.badgeColor} text-white`}>
                <TierIcon className="h-3 w-3 mr-1" />
                {currentTier.name}
              </Badge>
            </div>
            <p className="text-muted-foreground">{partner.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleSave} 
            disabled={!isFormDirty || mutationLoading}
            className="flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {mutationLoading ? t('edit.saving') : t('edit.save')}
          </Button>
        </div>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('edit.saveSuccess')}</AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {mutationError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Perustiedot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('form.name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('form.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('form.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('form.emailPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('form.phone')}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder={t('form.phonePlaceholder')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Settings with Tier Visualization */}
        <Card className={`${currentTier.color} border-2`}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TierIcon className="h-5 w-5 mr-2" />
              Liiketoiminta-asetukset
              <Badge className={`ml-2 ${currentTier.badgeColor} text-white`}>
                {currentTier.name}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commission">
                {t('form.commission')} 
                <span className="text-sm text-muted-foreground ml-1">
                  (Max: {currentTier.maxCommission}%)
                </span>
              </Label>
              <Input
                id="commission"
                type="number"
                min="0"
                max={currentTier.maxCommission}
                step="0.1"
                value={formData.commission_percent}
                onChange={(e) => handleInputChange('commission_percent', parseFloat(e.target.value) || 0)}
                placeholder={t('form.commissionPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier">{t('form.tier')}</Label>
              <Select
                value={formData.tier}
                onValueChange={(value) => handleInputChange('tier', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      {t('tier.basic')} - Perustaso
                    </div>
                  </SelectItem>
                  <SelectItem value="premium">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      {t('tier.premium')} - Premium
                    </div>
                  </SelectItem>
                  <SelectItem value="enterprise">
                    <div className="flex items-center">
                      <Crown className="h-4 w-4 mr-2" />
                      {t('tier.enterprise')} - Yritystaso
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Tila</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                  <SelectItem value="suspended">{t('status.suspended')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tier Features Display */}
            <div className="mt-4 p-3 rounded-lg bg-white/70">
              <Label className="text-sm font-semibold">Tason ominaisuudet:</Label>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                {currentTier.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Zap className="h-3 w-3 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Yhteystiedot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn profiili</Label>
              <Input
                id="linkedin"
                type="url"
                value={formData.linkedin}
                onChange={(e) => handleInputChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/kumppani"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_website">Yrityksen verkkosivut</Label>
              <Input
                id="company_website"
                type="url"
                value={formData.company_website}
                onChange={(e) => handleInputChange('company_website', e.target.value)}
                placeholder="https://yritys.fi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_contact_method">Ensisijainen yhteystapa</Label>
              <Select
                value={formData.preferred_contact_method}
                onValueChange={(value) => handleInputChange('preferred_contact_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Sähköposti</SelectItem>
                  <SelectItem value="phone">Puhelin</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Aikavyöhyke</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => handleInputChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Helsinki">Helsinki (UTC+2)</SelectItem>
                  <SelectItem value="Europe/Stockholm">Tukholma (UTC+1)</SelectItem>
                  <SelectItem value="Europe/London">Lontoo (UTC+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language_preference">Kieliasetus</Label>
              <Select
                value={formData.language_preference}
                onValueChange={(value) => handleInputChange('language_preference', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fi">Suomi</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sv">Svenska</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Partner Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Kumppaniasetukset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sähköposti-ilmoitukset</Label>
                <p className="text-sm text-muted-foreground">
                  Lähetä komissio- ja tilapäivitykset sähköpostiin
                </p>
              </div>
              <CustomSwitch
                checked={formData.email_notifications}
                onChange={(checked) => handleInputChange('email_notifications', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_reporting">Komissioraportointi</Label>
              <Select
                value={formData.commission_reporting}
                onValueChange={(value) => handleInputChange('commission_reporting', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Viikoittain</SelectItem>
                  <SelectItem value="monthly">Kuukausittain</SelectItem>
                  <SelectItem value="quarterly">Neljännesvuosittain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Maksutapa</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => handleInputChange('payment_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Pankkisiirto</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimum_payout">Minimikotiutus (€)</Label>
              <Input
                id="minimum_payout"
                type="number"
                min="0"
                value={formData.minimum_payout}
                onChange={(e) => handleInputChange('minimum_payout', parseInt(e.target.value) || 0)}
                placeholder="100"
              />
            </div>

            {/* Premium/Enterprise only features */}
            {formData.tier !== 'basic' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>API-käyttöoikeus</Label>
                    <p className="text-sm text-muted-foreground">
                      Salli API-käyttö omaan järjestelmään
                    </p>
                  </div>
                  <CustomSwitch
                    checked={formData.api_access}
                    onChange={(checked) => handleInputChange('api_access', checked)}
                  />
                </div>

                {formData.tier === 'enterprise' && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mukautettu brändäys</Label>
                      <p className="text-sm text-muted-foreground">
                        Näytä oma logo ja värit signup-sivuilla
                      </p>
                    </div>
                    <CustomSwitch
                      checked={formData.custom_branding}
                      onChange={(checked) => handleInputChange('custom_branding', checked)}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Signup Code Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              Rekisteröitymiskoodi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nykyinen koodi</Label>
              <div className="flex items-center space-x-2 mt-1">
                <code className="px-3 py-2 bg-muted rounded-md text-sm font-mono flex-1">
                  {partner.signup_code || 'Ei koodia'}
                </code>
                <Button 
                  onClick={handleGenerateCode} 
                  variant="outline" 
                  size="sm"
                  disabled={mutationLoading}
                >
                  Uusi koodi
                </Button>
              </div>
            </div>
            
            {partner.signup_code_expires_at && (
              <div className="text-sm text-muted-foreground">
                Vanhenee: {new Date(partner.signup_code_expires_at).toLocaleDateString('fi-FI')}
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              Uuden koodin luominen mitätöi vanhan koodin. Linkki kopioidaan automaattisesti leikepöydälle.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button at Bottom */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={!isFormDirty || mutationLoading}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {mutationLoading ? t('edit.saving') : t('edit.save')}
        </Button>
      </div>
    </div>
  )
} 