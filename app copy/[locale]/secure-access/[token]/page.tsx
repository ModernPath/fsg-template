'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Clock, 
  Download, 
  Building, 
  Euro,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

interface AccessInfo {
  id: string
  access_level: 'full' | 'basic' | 'teaser'
  expires_at: string
  downloads_remaining: number
  recipient_email: string
  lender_id?: string
  opportunity?: any
}

interface ApplicationData {
  application?: any
  documents?: any[]
  contact_details?: any
  company?: any
  opportunity?: any
  offers?: any[]
}

const offerSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  interest_rate: z.coerce.number().min(0, 'Interest rate cannot be negative'),
  term_months: z.coerce.number().positive('Term must be positive').int(),
  monthly_payment: z.coerce.number().positive('Monthly payment must be positive'),
  total_repayment: z.coerce.number().positive('Total repayment must be positive'),
  valid_until: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date"}),
  notes: z.string().optional(),
})

type OfferFormValues = z.infer<typeof offerSchema>

export default function SecureAccessPage() {
  const params = useParams()
  const token = params.token as string
  const locale = params.locale as string
  const t = useTranslations('SecureAccess')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null)
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null)
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [offerError, setOfferError] = useState<string | null>(null)
  const [offerSuccess, setOfferSuccess] = useState(false)

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      amount: 0,
      interest_rate: 0,
      term_months: 12,
      monthly_payment: 0,
      total_repayment: 0,
      notes: '',
    },
  })

  useEffect(() => {
    if (token) {
      fetchSecureData()
    }
  }, [token])

  const fetchSecureData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/secure-access/${token}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Access denied')
      }

      const data = await response.json()
      console.log('📊 Received data:', data)
      console.log('📄 Documents in data:', data.data?.documents)
      setAccessInfo(data.access)
      setApplicationData(data.data)
    } catch (error: any) {
      console.error('Error fetching secure data:', error)
      setError(error.message || 'Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const handleOfferSubmit = async (values: OfferFormValues) => {
    setOfferSubmitting(true)
    setOfferError(null)
    setOfferSuccess(false)

    try {
      const response = await fetch(`/api/secure-access/${token}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          valid_until: new Date(values.valid_until).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit offer')
      }

      setOfferSuccess(true)
      form.reset()
      await fetchSecureData()
    } catch (error: any) {
      setOfferError(error.message)
    } finally {
      setOfferSubmitting(false)
    }
  }

  const trackDownload = async () => {
    try {
      await fetch(`/api/secure-access/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download' })
      })
      await fetchSecureData()
    } catch (error) {
      console.error('Error tracking download:', error)
    }
  }

  const handleDocumentDownload = async (documentId: string, fileName: string) => {
    try {
      // Track the download
      await trackDownload()
      
      // Create download link for the document
      const downloadUrl = `/api/documents/${documentId}/download?token=${token}`
      
      // Create temporary link and trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading document:', error)
    }
  }

  const handleOfferAction = async (offerId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/secure-access/${token}/offer/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update offer')
      }

      // Refresh the data to show updated status
      await fetchSecureData()
    } catch (error: any) {
      console.error('Error updating offer:', error)
      // You could add a toast notification here
    }
  }

  const getAccessLevelBadge = (level: string) => {
    const labels = {
      full: locale === 'fi' ? 'Täydet tiedot' : 'Full Access',
      basic: locale === 'fi' ? 'Perustiedot' : 'Basic Access', 
      teaser: locale === 'fi' ? 'Markkinointi' : 'Marketing'
    }
    
    switch (level) {
      case 'full':
        return <Badge className="bg-[#FFD700] text-black font-medium">{labels.full}</Badge>
      case 'basic':
        return <Badge className="bg-[#F0E68C] text-black font-medium">{labels.basic}</Badge>
      case 'teaser':
        return <Badge className="bg-[#A9A9A9] text-black font-medium">{labels.teaser}</Badge>
      default:
        return <Badge variant="secondary">{level}</Badge>
    }
  }

  const formatExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt)
    const now = new Date()
    const diff = expiry.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diff <= 0) return locale === 'fi' ? 'Vanhentunut' : 'Expired'
    if (hours > 0) return `${hours}h ${minutes}min`
    return `${minutes}min`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-[#FFD700] mx-auto mb-4 animate-pulse" />
          <p className="text-[#F0E68C] text-lg">
            {locale === 'fi' ? 'Vahvistetaan pääsyä...' : 'Verifying access...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto bg-[#111111] border-[#A9A9A9]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#DC143C]">
              <AlertCircle className="h-5 w-5" />
              {locale === 'fi' ? 'Pääsy evätty' : 'Access Denied'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="bg-[#111111] border-[#DC143C]">
              <AlertDescription className="text-[#F0E68C]">{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  const labels = {
    title: locale === 'fi' ? 'Turvallinen Dokumenttialue' : 'Secure Document Area',
    subtitle: locale === 'fi' ? 'TrustyFinance - Rahoitushakemus' : 'TrustyFinance - Funding Application',
    accessInfo: {
      title: locale === 'fi' ? 'Pääsytiedot' : 'Access Information',
      validFor: locale === 'fi' ? 'Voimassa' : 'Valid for',
      downloadsRemaining: locale === 'fi' ? 'Latauksia jäljellä' : 'Downloads remaining',
      status: locale === 'fi' ? 'Tila' : 'Status',
      active: locale === 'fi' ? 'Aktiivinen' : 'Active'
    },
    application: {
      title: locale === 'fi' ? 'Rahoitushakemus' : 'Funding Application',
      companyInfo: locale === 'fi' ? 'Yritystiedot' : 'Company Information',
      financingInfo: locale === 'fi' ? 'Rahoitustiedot' : 'Financing Information',
      contactInfo: locale === 'fi' ? 'Yhteystiedot' : 'Contact Information',
      businessId: locale === 'fi' ? 'Y-tunnus' : 'Business ID',
      company: locale === 'fi' ? 'Yritys' : 'Company',
      email: locale === 'fi' ? 'Sähköposti' : 'Email',
      phone: locale === 'fi' ? 'Puhelin' : 'Phone',
      type: locale === 'fi' ? 'Tyyppi' : 'Type',
      months: locale === 'fi' ? 'kuukautta' : 'months',
      notSpecified: locale === 'fi' ? 'Ei määritetty' : 'Not specified'
    },
    documents: {
      title: locale === 'fi' ? 'Dokumentit' : 'Documents',
      download: locale === 'fi' ? 'Lataa' : 'Download'
    },
    offer: {
      title: locale === 'fi' ? 'Lähetä tarjous' : 'Submit Offer',
      amount: locale === 'fi' ? 'Lainamäärä (€)' : 'Loan Amount (€)',
      interestRate: locale === 'fi' ? 'Korko (%)' : 'Interest Rate (%)',
      termMonths: locale === 'fi' ? 'Laina-aika (kk)' : 'Term (Months)',
      monthlyPayment: locale === 'fi' ? 'Kuukausierä (€)' : 'Monthly Payment (€)',
      totalRepayment: locale === 'fi' ? 'Kokonaismaksu (€)' : 'Total Repayment (€)',
      validUntil: locale === 'fi' ? 'Voimassa' : 'Valid Until',
      notes: locale === 'fi' ? 'Huomautukset (valinnainen)' : 'Notes (Optional)',
      submit: locale === 'fi' ? 'Lähetä tarjous' : 'Submit Offer',
      submitting: locale === 'fi' ? 'Lähetetään...' : 'Submitting...',
      success: locale === 'fi' ? 'Tarjous lähetetty onnistuneesti!' : 'Offer submitted successfully!'
    },
    opportunity: {
      title: locale === 'fi' ? 'Rahoitusmahdollisuus' : 'Funding Opportunity',
      details: locale === 'fi' ? 'Mahdollisuuden tiedot' : 'Opportunity Details',
      industry: locale === 'fi' ? 'Toimiala' : 'Industry',
      fundingRange: locale === 'fi' ? 'Rahoitustarve' : 'Funding Range',
      location: locale === 'fi' ? 'Sijainti' : 'Location',
      fundingType: locale === 'fi' ? 'Rahoitustyyppi' : 'Funding Type',
      interested: locale === 'fi' ? 'Kiinnostuitko?' : 'Interested?',
      description: locale === 'fi' 
        ? 'Tämä on yleiskatsaus mahdollisuudesta. Lisätiedot ja asiakkaan yhteystiedot annetaan kiinnostuksen osoittamisen jälkeen.'
        : 'This is an overview of the opportunity. Additional details and client contact information will be provided after expressing interest.',
      contact: locale === 'fi' ? 'Ota yhteyttä' : 'Contact us'
    },
    security: {
      title: locale === 'fi' ? 'Tietoturva' : 'Security',
      description: locale === 'fi' 
        ? 'Tämä linkki on voimassa rajoitetun ajan ja kaikki käynnit lokitetaan tietoturvan vuoksi. Älä jaa tätä linkkiä eteenpäin.'
        : 'This link is valid for a limited time and all visits are logged for security purposes. Do not share this link.'
    }
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-[#FFD700]" />
            <h1 className="text-3xl font-bold text-[#FFD700]">{labels.title}</h1>
          </div>
          <p className="text-[#F0E68C] text-lg">{labels.subtitle}</p>
        </div>

        {/* Access Info */}
        <Card className="mb-8 bg-[#111111] border-[#A9A9A9]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[#FFD700]">
              <span>{labels.accessInfo.title}</span>
              {accessInfo && getAccessLevelBadge(accessInfo.access_level)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#A9A9A9]" />
                <div>
                  <p className="text-sm text-[#A9A9A9] mb-1">{labels.accessInfo.validFor}</p>
                  <p className="font-medium text-[#F0E68C] text-lg">
                    {accessInfo && formatExpiryTime(accessInfo.expires_at)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-[#A9A9A9]" />
                <div>
                  <p className="text-sm text-[#A9A9A9] mb-1">{labels.accessInfo.downloadsRemaining}</p>
                  <p className="font-medium text-[#F0E68C] text-lg">{accessInfo?.downloads_remaining}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-[#FFD700]" />
                <div>
                  <p className="text-sm text-[#A9A9A9] mb-1">{labels.accessInfo.status}</p>
                  <p className="font-medium text-[#FFD700] text-lg">{labels.accessInfo.active}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Data */}
        {applicationData && (
          <div className="space-y-8">
            {/* Full Access - Detailed Application */}
            {accessInfo?.access_level === 'full' && applicationData.application && (
              <Card className="bg-[#111111] border-[#A9A9A9]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-[#FFD700] text-xl">
                    <FileText className="h-6 w-6" />
                    {labels.application.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold mb-4 text-[#FFD700] text-lg">{labels.application.companyInfo}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-[#A9A9A9]" />
                          <span className="text-[#F0E68C] text-lg">
                            {applicationData.contact_details?.company_name || 
                             applicationData.application?.companies?.[0]?.name || 
                             labels.application.notSpecified}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[#A9A9A9]">{labels.application.businessId}:</span>
                          <span className="text-[#F0E68C]">
                            {applicationData.contact_details?.business_id || 
                             applicationData.application?.companies?.[0]?.business_id || 
                             labels.application.notSpecified}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-[#A9A9A9]" />
                          <span className="text-[#F0E68C]">
                            {applicationData.application?.companies?.[0]?.address?.city || 
                             labels.application.notSpecified}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-4 text-[#FFD700] text-lg">{labels.application.financingInfo}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Euro className="h-5 w-5 text-[#A9A9A9]" />
                          <span className="text-[#F0E68C] text-lg font-medium">
                            {applicationData.application?.amount?.toLocaleString(locale === 'fi' ? 'fi-FI' : 'en-US') || '0'} €
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-[#A9A9A9]" />
                          <span className="text-[#F0E68C]">
                            {applicationData.application?.term_months || 0} {labels.application.months}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[#A9A9A9]">{labels.application.type}:</span>
                          <span className="text-[#F0E68C]">
                            {applicationData.application?.type || labels.application.notSpecified}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {applicationData.contact_details && (
                    <div>
                      <h3 className="font-semibold mb-4 text-[#FFD700] text-lg">{labels.application.contactInfo}</h3>
                      <div className="bg-black p-6 rounded-lg border border-[#A9A9A9]">
                        <div className="space-y-2">
                          <p className="text-[#F0E68C]">
                            <strong className="text-[#FFD700]">{labels.application.company}:</strong> {applicationData.contact_details.company_name}
                          </p>
                          <p className="text-[#F0E68C]">
                            <strong className="text-[#FFD700]">{labels.application.businessId}:</strong> {applicationData.contact_details.business_id}
                          </p>
                          {applicationData.contact_details.contact_info?.email && (
                            <p className="text-[#F0E68C]">
                              <strong className="text-[#FFD700]">{labels.application.email}:</strong> {applicationData.contact_details.contact_info.email}
                            </p>
                          )}
                          {applicationData.contact_details.contact_info?.phone && (
                            <p className="text-[#F0E68C]">
                              <strong className="text-[#FFD700]">{labels.application.phone}:</strong> {applicationData.contact_details.contact_info.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Debug section - remove after fixing */}
                  <div className="mb-4 p-4 bg-red-900 border border-red-500 rounded">
                    <h4 className="text-red-300 font-bold mb-2">Debug Info:</h4>
                    <p className="text-red-200 text-sm">applicationData.documents exists: {applicationData.documents ? 'YES' : 'NO'}</p>
                    <p className="text-red-200 text-sm">documents length: {applicationData.documents?.length || 'undefined'}</p>
                    <p className="text-red-200 text-sm">documents data: {JSON.stringify(applicationData.documents)}</p>
                  </div>

                  {applicationData.documents && applicationData.documents.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4 text-[#FFD700] text-lg">{labels.documents.title}</h3>
                      <div className="space-y-3">
                        {applicationData.documents.map((doc: any, index: number) => (
                          <div key={doc.id || index} className="flex items-center justify-between p-4 bg-black rounded-lg border border-[#A9A9A9]">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-[#A9A9A9]" />
                              <div>
                                <span className="text-[#F0E68C] font-medium">{doc.name}</span>
                                {doc.size && (
                                  <p className="text-sm text-[#A9A9A9]">
                                    {(doc.size / 1024 / 1024).toFixed(1)} MB
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleDocumentDownload(doc.id, doc.name)}
                              disabled={accessInfo?.downloads_remaining === 0}
                              className="bg-[#FFD700] text-black hover:bg-[#FFFFE0] font-medium"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              {labels.documents.download}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show message if no documents */}
                  {(!applicationData.documents || applicationData.documents.length === 0) && (
                    <div>
                      <h3 className="font-semibold mb-4 text-[#FFD700] text-lg">{labels.documents.title}</h3>
                      <div className="p-4 bg-black rounded-lg border border-[#A9A9A9]">
                        <p className="text-[#A9A9A9] text-center">No documents available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Submitted Offers */}
            {accessInfo?.access_level === 'full' && applicationData.offers && applicationData.offers.length > 0 && (
              <Card className="bg-[#111111] border-[#A9A9A9]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-[#FFD700] text-xl">
                    <Euro className="h-6 w-6" />
                    {accessInfo?.lender_id 
                      ? (locale === 'fi' ? 'Lähetetyt tarjoukset' : 'Submitted Offers')
                      : (locale === 'fi' ? 'Rahoitustarjoukset' : 'Financing Offers')
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applicationData.offers.map((offer: any, index: number) => (
                      <div key={offer.id} className="p-6 bg-black rounded-lg border border-[#A9A9A9]">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FFD700] rounded-full flex items-center justify-center">
                              <span className="text-black font-bold text-lg">{index + 1}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#FFD700] text-lg">
                                {offer.lender?.name || 'Lender'}
                              </h4>
                              <p className="text-sm text-[#A9A9A9]">
                                {locale === 'fi' ? 'Tarjous jätetty' : 'Offer submitted'}: {new Date(offer.offer_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            className={
                              offer.status === 'offered' ? 'bg-[#FFD700] text-black' :
                              offer.status === 'accepted' ? 'bg-green-600 text-white' :
                              offer.status === 'rejected' ? 'bg-red-600 text-white' :
                              'bg-[#A9A9A9] text-black'
                            }
                          >
                            {offer.status === 'offered' && (locale === 'fi' ? 'Tarjous' : 'Offered')}
                            {offer.status === 'accepted' && (locale === 'fi' ? 'Hyväksytty' : 'Accepted')}
                            {offer.status === 'rejected' && (locale === 'fi' ? 'Hylätty' : 'Rejected')}
                            {!['offered', 'accepted', 'rejected'].includes(offer.status) && offer.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-[#A9A9A9] mb-1">{locale === 'fi' ? 'Lainamäärä' : 'Loan Amount'}</p>
                            <p className="font-semibold text-[#F0E68C] text-lg">
                              {Number(offer.amount_offered).toLocaleString()} €
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-[#A9A9A9] mb-1">{locale === 'fi' ? 'Korko' : 'Interest Rate'}</p>
                            <p className="font-semibold text-[#F0E68C] text-lg">{offer.interest_rate}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-[#A9A9A9] mb-1">{locale === 'fi' ? 'Laina-aika' : 'Term'}</p>
                            <p className="font-semibold text-[#F0E68C] text-lg">
                              {offer.loan_term_months} {locale === 'fi' ? 'kk' : 'months'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-[#A9A9A9] mb-1">{locale === 'fi' ? 'Kuukausierä' : 'Monthly Payment'}</p>
                            <p className="font-semibold text-[#F0E68C] text-lg">
                              {Number(offer.monthly_payment).toLocaleString()} €
                            </p>
                          </div>
                        </div>

                        {offer.raw_offer_data?.notes && (
                          <div className="mb-4">
                            <p className="text-sm text-[#A9A9A9] mb-1">{locale === 'fi' ? 'Huomautukset' : 'Notes'}</p>
                            <p className="text-[#F0E68C] bg-[#111111] p-3 rounded border border-[#A9A9A9]">
                              {offer.raw_offer_data.notes}
                            </p>
                          </div>
                        )}

                        {offer.raw_offer_data?.valid_until && (
                          <div className="mb-4">
                            <p className="text-sm text-[#A9A9A9] mb-1">{locale === 'fi' ? 'Voimassa' : 'Valid Until'}</p>
                            <p className="text-[#F0E68C]">
                              {new Date(offer.raw_offer_data.valid_until).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                                                 {/* Only show accept/reject buttons for applicants, not lenders */}
                         {offer.status === 'offered' && !accessInfo?.lender_id && (
                           <div className="flex gap-3 pt-4 border-t border-[#A9A9A9]">
                             <Button 
                               onClick={() => handleOfferAction(offer.id, 'accept')}
                               className="bg-green-600 hover:bg-green-700 text-white font-medium"
                             >
                               {locale === 'fi' ? 'Hyväksy tarjous' : 'Accept Offer'}
                             </Button>
                             <Button 
                               onClick={() => handleOfferAction(offer.id, 'reject')}
                               variant="outline"
                               className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-medium"
                             >
                               {locale === 'fi' ? 'Hylkää tarjous' : 'Reject Offer'}
                             </Button>
                           </div>
                         )}
                         
                         {/* Show status message for lenders */}
                         {offer.status === 'offered' && accessInfo?.lender_id && (
                           <div className="pt-4 border-t border-[#A9A9A9]">
                             <p className="text-[#F0E68C] text-sm">
                               {locale === 'fi' 
                                 ? 'Tarjous on lähetetty asiakkaalle. Odottaa vastausta.' 
                                 : 'Offer has been sent to the client. Awaiting response.'}
                             </p>
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Offer Submission Form - Only for lenders */}
            {accessInfo?.access_level === 'full' && accessInfo?.lender_id && (
              <Card className="bg-[#111111] border-[#A9A9A9]">
                <CardHeader>
                  <CardTitle className="text-[#FFD700] text-xl">{labels.offer.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleOfferSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#F0E68C] text-base">{labels.offer.amount}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  className="bg-[#111111] border-[#A9A9A9] text-[#FFD700] focus:border-[#FFD700] h-14 text-lg"
                                />
                              </FormControl>
                              <FormMessage className="text-[#DC143C]" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="interest_rate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#F0E68C] text-base">{labels.offer.interestRate}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  {...field} 
                                  className="bg-[#111111] border-[#A9A9A9] text-[#FFD700] focus:border-[#FFD700] h-14 text-lg"
                                />
                              </FormControl>
                              <FormMessage className="text-[#DC143C]" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="term_months"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#F0E68C] text-base">{labels.offer.termMonths}</FormLabel>
                                    <FormControl>
                                        <Input 
                                          type="number" 
                                          {...field} 
                                          className="bg-[#111111] border-[#A9A9A9] text-[#FFD700] focus:border-[#FFD700] h-14 text-lg"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[#DC143C]" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="monthly_payment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#F0E68C] text-base">{labels.offer.monthlyPayment}</FormLabel>
                                    <FormControl>
                                        <Input 
                                          type="number" 
                                          {...field} 
                                          className="bg-[#111111] border-[#A9A9A9] text-[#FFD700] focus:border-[#FFD700] h-14 text-lg"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[#DC143C]" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="total_repayment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#F0E68C] text-base">{labels.offer.totalRepayment}</FormLabel>
                                    <FormControl>
                                        <Input 
                                          type="number" 
                                          {...field} 
                                          className="bg-[#111111] border-[#A9A9A9] text-[#FFD700] focus:border-[#FFD700] h-14 text-lg"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[#DC143C]" />
                                </FormItem>
                            )}
                        />
                      </div>
                      <FormField
                          control={form.control}
                          name="valid_until"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel className="text-[#F0E68C] text-base">{labels.offer.validUntil}</FormLabel>
                                  <FormControl>
                                      <Input 
                                        type="date" 
                                        {...field} 
                                        className="bg-[#111111] border-[#A9A9A9] text-[#FFD700] focus:border-[#FFD700] h-14 text-lg"
                                      />
                                  </FormControl>
                                  <FormMessage className="text-[#DC143C]" />
                              </FormItem>
                          )}
                      />
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#F0E68C] text-base">{labels.offer.notes}</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="bg-[#111111] border-[#A9A9A9] text-[#FFD700] focus:border-[#FFD700] min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage className="text-[#DC143C]" />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={offerSubmitting}
                        className="bg-[#FFD700] text-black hover:bg-[#FFFFE0] font-medium h-14 text-lg px-8"
                      >
                        {offerSubmitting ? labels.offer.submitting : labels.offer.submit}
                      </Button>

                      {offerSuccess && (
                        <Alert className="bg-[#111111] border-[#FFD700]">
                          <AlertDescription className="text-[#FFD700]">{labels.offer.success}</AlertDescription>
                        </Alert>
                      )}
                      {offerError && (
                        <Alert className="bg-[#111111] border-[#DC143C]">
                          <AlertDescription className="text-[#DC143C]">{offerError}</AlertDescription>
                        </Alert>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Teaser Access - Marketing Info */}
            {accessInfo?.access_level === 'teaser' && applicationData.opportunity && (
              <Card className="bg-[#111111] border-[#A9A9A9]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-[#FFD700] text-xl">
                    <Building className="h-6 w-6" />
                    {labels.opportunity.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold mb-4 text-[#FFD700] text-lg">{labels.opportunity.details}</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="text-[#A9A9A9] min-w-[100px]">{labels.opportunity.industry}:</span>
                          <span className="text-[#F0E68C]">{applicationData.opportunity.industry || labels.application.notSpecified}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-[#A9A9A9] min-w-[100px]">{labels.opportunity.fundingRange}:</span>
                          <span className="text-[#F0E68C]">{applicationData.opportunity.funding_range}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-[#A9A9A9] min-w-[100px]">{labels.opportunity.location}:</span>
                          <span className="text-[#F0E68C]">{applicationData.opportunity.location_region}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-[#A9A9A9] min-w-[100px]">{labels.opportunity.fundingType}:</span>
                          <span className="text-[#F0E68C]">{applicationData.opportunity.funding_type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-black p-6 rounded-lg border border-[#FFD700]">
                      <h4 className="font-semibold text-[#FFD700] mb-3 text-lg">{labels.opportunity.interested}</h4>
                      <p className="text-[#F0E68C] mb-4 leading-relaxed">
                        {labels.opportunity.description}
                      </p>
                      <p className="text-[#F0E68C]">
                        {labels.opportunity.contact}: <strong className="text-[#FFD700]">info@trustyfinance.fi</strong>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Security Notice */}
        <Alert className="mt-8 bg-[#111111] border-[#A9A9A9]">
          <Shield className="h-5 w-5 text-[#FFD700]" />
          <AlertDescription className="text-[#F0E68C] leading-relaxed">
            <strong className="text-[#FFD700]">{labels.security.title}:</strong> {labels.security.description}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
} 