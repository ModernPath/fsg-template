'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/supabase'

type Json = Database['public']['Tables']['companies']['Row']['address']

interface AddressInfo {
  address: string | null;
  postal_code: string | null;
  city: string | null;
  [key: string]: string | null; // Add index signature for Json compatibility
}

interface ContactInfo {
  email: string | null;
  phone: string | null;
  [key: string]: string | null; // Add index signature for Json compatibility
}

type Company = Omit<Database['public']['Tables']['companies']['Row'], 'address' | 'contact_info'> & {
  address: AddressInfo | null;
  contact_info: ContactInfo | null;
}

export default function CompanyForm() {
  const t = useTranslations('Account.settings.company')
  const { session } = useAuth()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [companyData, setCompanyData] = useState<Company | null>(null)

  const addressInfo = companyData?.address
  const contactInfo = companyData?.contact_info

  // Fetch company data for the current user
  const fetchUserCompany = async () => {
    if (!session?.access_token) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/company', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch company data')
      }

      const company = await response.json()
      setCompanyData(company as Company)
    } catch (error) {
      console.error('Error in fetchUserCompany:', error)
      setError(t('error.fetchCompany'))
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!session?.access_token || !companyData) return

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch('/api/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: companyData.name,
          business_id: companyData.business_id,
          address: companyData.address,
          contact_info: companyData.contact_info
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update company data')
      }

      const updatedCompany = await response.json()
      setCompanyData(updatedCompany as Company)
      router.refresh()
      setSuccess(t('success.updateCompany'))
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      setError(t('error.updateCompany'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSuccess(null)
    setError(null)
    setCompanyData(prev => prev ? { ...prev, [name]: value } : null)
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSuccess(null)
    setError(null)
    setCompanyData(prev => {
      if (!prev) return null
      return {
        ...prev,
        address: {
          ...(prev.address || {}),
          [name]: value || null
        } as AddressInfo
      }
    })
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSuccess(null)
    setError(null)
    setCompanyData(prev => {
      if (!prev) return null
      return {
        ...prev,
        contact_info: {
          ...(prev.contact_info || {}),
          [name]: value || null
        } as ContactInfo
      }
    })
  }

  useEffect(() => {
    fetchUserCompany()
  }, [session?.access_token])

  if (isLoading) {
    return <div className="text-center">{t('loading')}</div>
  }

  if (!companyData) {
    return <div className="text-center">{t('noCompany')}</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {success && (
        <div className="text-green-500 mb-4">{success}</div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">{t('name')}</Label>
          <Input
            id="name"
            name="name"
            value={companyData.name || ''}
            onChange={handleInputChange}
            placeholder={t('namePlaceholder')}
            required
          />
        </div>

        <div>
          <Label htmlFor="business_id">{t('businessId')}</Label>
          <Input
            id="business_id"
            name="business_id"
            value={companyData.business_id || ''}
            onChange={handleInputChange}
            placeholder={t('businessIdPlaceholder')}
            required
          />
        </div>

        <div>
          <Label htmlFor="address">{t('address')}</Label>
          <Input
            id="address"
            name="address"
            value={addressInfo?.address || ''}
            onChange={handleAddressChange}
            placeholder={t('addressPlaceholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postal_code">{t('postalCode')}</Label>
            <Input
              id="postal_code"
              name="postal_code"
              value={addressInfo?.postal_code || ''}
              onChange={handleAddressChange}
              placeholder={t('postalCodePlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="city">{t('city')}</Label>
            <Input
              id="city"
              name="city"
              value={addressInfo?.city || ''}
              onChange={handleAddressChange}
              placeholder={t('cityPlaceholder')}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={contactInfo?.email || ''}
            onChange={handleContactChange}
            placeholder={t('emailPlaceholder')}
          />
        </div>

        <div>
          <Label htmlFor="phone">{t('phone')}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={contactInfo?.phone || ''}
            onChange={handleContactChange}
            placeholder={t('phonePlaceholder')}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? t('saving') : t('save')}
      </Button>
    </form>
  )
} 