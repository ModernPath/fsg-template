'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/supabase'
import { Plus, Building2, Check, X } from 'lucide-react'

type Json = Database['public']['Tables']['companies']['Row']['address']

interface AddressInfo {
  address: string | null;
  postal_code: string | null;
  city: string | null;
  [key: string]: string | null;
}

interface ContactInfo {
  email: string | null;
  phone: string | null;
  [key: string]: string | null;
}

type Company = Omit<Database['public']['Tables']['companies']['Row'], 'address' | 'contact_info'> & {
  address: AddressInfo | null;
  contact_info: ContactInfo | null;
  role: string;
}

export default function CompanyManager() {
  const t = useTranslations('Account.settings.company')
  const { session } = useAuth()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [activeCompany, setActiveCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newCompanyData, setNewCompanyData] = useState<Partial<Company>>({
    name: '',
    business_id: '',
    address: { address: '', postal_code: '', city: '' },
    contact_info: { email: '', phone: '' }
  })

  // Fetch all companies for the user
  const fetchCompanies = async () => {
    if (!session?.access_token) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/companies', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch companies')
      }

      const companiesData = await response.json()

      // Fetch current active company
      const activeResponse = await fetch('/api/company', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      let activeCompanyData = null
      if (activeResponse.ok) {
        activeCompanyData = await activeResponse.json()
        setActiveCompany(activeCompanyData)
      }

      // Ensure active company is in the companies list
      let finalCompanies = companiesData
      if (activeCompanyData && !companiesData.find((c: Company) => c.id === activeCompanyData.id)) {
        // Add active company to the list if it's not already there
        finalCompanies = [...companiesData, activeCompanyData]
      }

      setCompanies(finalCompanies)
    } catch (error) {
      console.error('Error fetching companies:', error)
      setError(t('error.fetchCompany'))
    } finally {
      setIsLoading(false)
    }
  }

  // Switch active company
  const switchCompany = async (companyId: string) => {
    if (!session?.access_token) return

    try {
      setIsSwitching(true)
      setError(null)

      const response = await fetch('/api/company/switch', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ company_id: companyId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to switch company')
      }

      const updatedCompany = await response.json()
      setActiveCompany(updatedCompany)
      router.refresh()
    } catch (error) {
      console.error('Error switching company:', error)
      setError(t('error.updateCompany'))
    } finally {
      setIsSwitching(false)
    }
  }

  // Create new company
  const createCompany = async () => {
    if (!session?.access_token || !newCompanyData.name || !newCompanyData.business_id) return

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(newCompanyData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create company')
      }

      const newCompany = await response.json()
      setCompanies(prev => [...prev, newCompany])
      setActiveCompany(newCompany)
      setIsCreateDialogOpen(false)
      setNewCompanyData({
        name: '',
        business_id: '',
        address: { address: '', postal_code: '', city: '' },
        contact_info: { email: '', phone: '' }
      })
      router.refresh()
    } catch (error) {
      console.error('Error creating company:', error)
      setError(t('error.updateCompany'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleNewCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewCompanyData(prev => ({ ...prev, [name]: value }))
  }

  const handleNewCompanyAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewCompanyData(prev => ({
      ...prev,
      address: {
        ...(prev.address || {}),
        [name]: value || null
      } as AddressInfo
    }))
  }

  const handleNewCompanyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewCompanyData(prev => ({
      ...prev,
      contact_info: {
        ...(prev.contact_info || {}),
        [name]: value || null
      } as ContactInfo
    }))
  }

  useEffect(() => {
    fetchCompanies()
  }, [session?.access_token])

  if (isLoading) {
    return <div className="text-center">{t('loading')}</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {/* Company Selector */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Valitse aktiivinen yritys</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Lisää yritys
          </Button>
        </div>

        {companies.length > 0 ? (
          <div className="space-y-3">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                  activeCompany?.id === company.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => company.id !== activeCompany?.id && switchCompany(company.id)}
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium">{company.name}</div>
                    <div className="text-sm text-gray-500">
                      Y-tunnus: {company.business_id} • Rooli: {company.role}
                    </div>
                  </div>
                </div>
                {activeCompany?.id === company.id && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Sinulla ei ole vielä yrityksiä</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Luo ensimmäinen yritys
            </Button>
          </div>
        )}

        {isSwitching && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">Vaihdetaan yritystä...</p>
          </div>
        )}
      </Card>

      {/* Create Company Modal */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Luo uusi yritys</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-name">{t('name')}</Label>
                <Input
                  id="new-name"
                  name="name"
                  value={newCompanyData.name || ''}
                  onChange={handleNewCompanyInputChange}
                  placeholder={t('namePlaceholder')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-business_id">{t('businessId')}</Label>
                <Input
                  id="new-business_id"
                  name="business_id"
                  value={newCompanyData.business_id || ''}
                  onChange={handleNewCompanyInputChange}
                  placeholder={t('businessIdPlaceholder')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-address">{t('address')}</Label>
                <Input
                  id="new-address"
                  name="address"
                  value={newCompanyData.address?.address || ''}
                  onChange={handleNewCompanyAddressChange}
                  placeholder={t('addressPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-postal_code">{t('postalCode')}</Label>
                  <Input
                    id="new-postal_code"
                    name="postal_code"
                    value={newCompanyData.address?.postal_code || ''}
                    onChange={handleNewCompanyAddressChange}
                    placeholder={t('postalCodePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="new-city">{t('city')}</Label>
                  <Input
                    id="new-city"
                    name="city"
                    value={newCompanyData.address?.city || ''}
                    onChange={handleNewCompanyAddressChange}
                    placeholder={t('cityPlaceholder')}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="new-email">{t('email')}</Label>
                <Input
                  id="new-email"
                  name="email"
                  type="email"
                  value={newCompanyData.contact_info?.email || ''}
                  onChange={handleNewCompanyContactChange}
                  placeholder={t('emailPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="new-phone">{t('phone')}</Label>
                <Input
                  id="new-phone"
                  name="phone"
                  type="tel"
                  value={newCompanyData.contact_info?.phone || ''}
                  onChange={handleNewCompanyContactChange}
                  placeholder={t('phonePlaceholder')}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Peruuta
                </Button>
                <Button 
                  onClick={createCompany}
                  disabled={isSaving || !newCompanyData.name || !newCompanyData.business_id}
                >
                  {isSaving ? t('saving') : 'Luo yritys'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Company Details */}
      {activeCompany && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Aktiivisen yrityksen tiedot</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="font-medium">Yrityksen nimi</Label>
              <p className="text-gray-700">{activeCompany.name}</p>
            </div>
            <div>
              <Label className="font-medium">Y-tunnus</Label>
              <p className="text-gray-700">{activeCompany.business_id}</p>
            </div>
            {activeCompany.address?.address && (
              <div>
                <Label className="font-medium">Osoite</Label>
                <p className="text-gray-700">
                  {activeCompany.address.address}
                  {activeCompany.address.postal_code && `, ${activeCompany.address.postal_code}`}
                  {activeCompany.address.city && ` ${activeCompany.address.city}`}
                </p>
              </div>
            )}
            {activeCompany.contact_info?.email && (
              <div>
                <Label className="font-medium">Sähköposti</Label>
                <p className="text-gray-700">{activeCompany.contact_info.email}</p>
              </div>
            )}
            {activeCompany.contact_info?.phone && (
              <div>
                <Label className="font-medium">Puhelinnumero</Label>
                <p className="text-gray-700">{activeCompany.contact_info.phone}</p>
              </div>
            )}
            <div>
              <Label className="font-medium">Roolisi</Label>
              <p className="text-gray-700">{activeCompany.role}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
} 