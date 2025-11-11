'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useSignupCodeValidation } from '@/hooks/usePartners'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import {
  CheckCircle,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  User
} from 'lucide-react'

export default function PartnerSignupPage() {
  const t = useTranslations('partner.signup')
  const searchParams = useSearchParams()
  const params = useParams()
  const locale = params.locale as string
  const partnerCode = searchParams.get('partner') || searchParams.get('code')

  const [step, setStep] = useState<'validate' | 'form' | 'success'>('validate')
  const [formData, setFormData] = useState({
    // Company info
    company_name: '',
    business_id: '',
    address: '',
    postal_code: '',
    city: '',
    company_email: '',
    company_phone: '',
    
    // Contact person
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    
    // Auth
    password: '',
    confirm_password: ''
  })

  const { validateCode, signup, validationResult, loading, error } = useSignupCodeValidation()

  useEffect(() => {
    console.log('🔍 Partner signup page loaded')
    console.log('🔍 Partner code from URL:', partnerCode)
    console.log('🔍 Current step:', step)
    
    if (partnerCode) {
      console.log('🔍 Validating partner code:', partnerCode)
      validateCode(partnerCode).then((result) => {
        console.log('🔍 Validation result:', result)
        if (result && result.valid) {
          console.log('✅ Code valid, moving to form step')
          setStep('form')
        } else {
          console.log('❌ Code invalid, staying on validate step')
          setStep('validate')
        }
      })
    } else {
      console.log('🔍 No partner code in URL, showing validate step')
      setStep('validate')
    }
  }, [partnerCode])

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const code = formData.get('code') as string
    
    const result = await validateCode(code)
    if (result && result.valid) {
      setStep('form')
      // Update URL with valid code
      window.history.replaceState({}, '', `/${locale}/partner-signup?code=${code}`)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirm_password) {
      alert(t('errors.passwordsDontMatch'))
      return
    }

    const signupData = {
      signup_code: partnerCode,
      company_name: formData.company_name,
      business_id: formData.business_id,
      address: formData.address,
      postal_code: formData.postal_code,
      city: formData.city,
      company_email: formData.company_email,
      company_phone: formData.company_phone,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      confirm_password: formData.confirm_password
    }

    const result = await signup(signupData)
    if (result && result.success) {
      setStep('success')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (step === 'validate') {
    return (
      <div className="container mx-auto py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('welcome')}</CardTitle>
            <p className="text-muted-foreground">
              {t('validatingCode')}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleValidateCode} className="space-y-4">
              <div>
                <Label htmlFor="code">{t('form.codeLabel')}</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder={t('form.codePlaceholder')}
                  defaultValue={partnerCode || ''}
                  required
                />
              </div>
              
              {error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('validatingCode') : t('form.continue')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="container mx-auto py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-600">{t('success.title')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t('success.message')}
            </p>
            
            {validationResult && (
              <div className="bg-muted p-4 rounded">
                <p className="text-sm">
                  <strong>{t('form.partnerLabel')}</strong> {validationResult.partner.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('form.linkedMessage')}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-semibold">{t('success.nextSteps')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. {t('success.step1')}</li>
                <li>2. {t('success.step2')}</li>
                <li>3. {t('success.step3')}</li>
              </ul>
            </div>
            
            <a href={`/${locale}/auth/sign-in?next=${encodeURIComponent(`/${locale}/partner/dashboard`)}`} className="w-full">
              <Button className="w-full">{t('success.loginButton')}</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
                      <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <CardTitle className="text-2xl">{t('form.title')}</CardTitle>
              <p className="text-muted-foreground">
                {t('form.partnerLabel')} {validationResult?.partner?.name}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('form.companyInfo')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="company_name">{t('form.companyName')} *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder={t('form.companyNamePlaceholder')}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="business_id">{t('form.businessId')} *</Label>
                  <Input
                    id="business_id"
                    value={formData.business_id}
                    onChange={(e) => handleInputChange('business_id', e.target.value)}
                    placeholder={t('form.businessIdPlaceholder')}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="company_phone">{t('form.companyPhone')}</Label>
                  <Input
                    id="company_phone"
                    value={formData.company_phone}
                    onChange={(e) => handleInputChange('company_phone', e.target.value)}
                    placeholder={t('form.companyPhonePlaceholder')}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="address">{t('form.address')}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder={t('form.addressPlaceholder')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="postal_code">{t('form.postalCode')}</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    placeholder={t('form.postalCodePlaceholder')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">{t('form.city')}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder={t('form.cityPlaceholder')}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="company_email">{t('form.companyEmail')}</Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={formData.company_email}
                    onChange={(e) => handleInputChange('company_email', e.target.value)}
                    placeholder={t('form.companyEmailPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Contact Person */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('form.contactPerson')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">{t('form.firstName')} *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder={t('form.firstNamePlaceholder')}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="last_name">{t('form.lastName')} *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder={t('form.lastNamePlaceholder')}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">{t('form.email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t('form.emailPlaceholder')}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">{t('form.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder={t('form.phonePlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('form.authentication')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">{t('form.password')} *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder={t('form.passwordPlaceholder')}
                    required
                    minLength={8}
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirm_password">{t('form.confirmPassword')} *</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                    placeholder={t('form.confirmPasswordPlaceholder')}
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </div>

            {error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('validate')}
                className="flex-1"
              >
                {t('form.back')}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? t('form.submitting') : t('form.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 