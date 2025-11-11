'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { AdminApi } from '@/utils/adminApi' // Corrected import path assumption
import { Database } from '@/types/supabase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message' // Corrected import path assumption
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDistanceToNow } from 'date-fns'
import { Building2, Euro, Clock, Users, TrendingUp, Calendar } from 'lucide-react'

// Explicit type definition for a lender application row with enhanced data
type EnhancedLenderApplicationRow = {
  id: string
  application_id: string
  lender_id: string
  lender_reference: string
  status: string
  submitted_at: string
  created_at: string
  updated_at: string
  poll_count: number
  next_poll_at?: string
  last_polled_at?: string
  lenders: {
    id: string
    name: string
    type: string
  }
}

// Enhanced funding application type with comprehensive related data
type EnhancedFundingApplication = {
  id: string
  company_id: string
  user_id: string
  amount: string
  currency: string
  term_months: number | null
  status: string
  submitted_at: string | null
  created_at: string
  updated_at: string
  companies: {
    id: string
    name: string
    business_id: string | null
    type: string | null
    industry: string | null
    founded: string | null
    employees: number | null
    website: string | null
    address: any | null
    contact_info: any | null
    description: string | null
    products: string[] | null
    market: string | null
    key_competitors: string[] | null
    metadata: any | null
    created_at: string
    updated_at: string
  }
  lender_applications: EnhancedLenderApplicationRow[]
}

// Detailed tooltip component for showing comprehensive application and company data
const DetailedTooltip = ({ application }: { application: EnhancedFundingApplication }) => {
  const company = application.companies
  const t = useTranslations('Admin.FundingApplications')

  const formatCurrency = (amount: number | string | null, currency = 'EUR') => {
    if (!amount) return '-'
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: currency
    }).format(numAmount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return new Intl.DateTimeFormat('fi-FI', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString))
    } catch (e) {
      return dateString
    }
  }

  return (
    <div className="w-full space-y-4 text-sm p-4 bg-gray-900 border border-gray-700 rounded-lg">
      {/* Application Details */}
      <div>
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-gold-primary" />
          Rahoitushakemus
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><span className="font-medium text-gold-primary">ID:</span> <span className="text-gray-300">{application.id}</span></div>
          <div><span className="font-medium text-gold-primary">Käyttäjä ID:</span> <span className="text-gray-300">{application.user_id}</span></div>
          <div><span className="font-medium text-gold-primary">Määrä:</span> <span className="text-white font-semibold">{formatCurrency(application.amount, application.currency)}</span></div>
          <div><span className="font-medium text-gold-primary">Laina-aika:</span> <span className="text-gray-300">{application.term_months ? `${application.term_months} kk` : 'Ei määritelty'}</span></div>
          <div><span className="font-medium text-gold-primary">Tila:</span> <span className="text-white">{application.status}</span></div>
          <div><span className="font-medium text-gold-primary">Lähetetty:</span> <span className="text-gray-300">{formatDate(application.submitted_at)}</span></div>
          <div><span className="font-medium text-gold-primary">Luotu:</span> <span className="text-gray-300">{formatDate(application.created_at)}</span></div>
          <div><span className="font-medium text-gold-primary">Päivitetty:</span> <span className="text-gray-300">{formatDate(application.updated_at)}</span></div>
        </div>
      </div>

      {/* Company Details */}
      {company && (
        <div>
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-gold-primary" />
            Yrityksen tiedot
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><span className="font-medium text-gold-primary">Nimi:</span> <span className="text-white font-semibold">{company.name}</span></div>
            <div><span className="font-medium text-gold-primary">Y-tunnus:</span> <span className="text-gray-300">{company.business_id}</span></div>
            {company.type && <div><span className="font-medium text-gold-primary">Tyyppi:</span> <span className="text-gray-300">{company.type}</span></div>}
            {company.contact_info?.email && <div><span className="font-medium text-gold-primary">Sähköposti:</span> <span className="text-gray-300">{company.contact_info.email}</span></div>}
            {company.contact_info?.phone && <div><span className="font-medium text-gold-primary">Puhelin:</span> <span className="text-gray-300">{company.contact_info.phone}</span></div>}
            {company.website && <div><span className="font-medium text-gold-primary">Verkkosivut:</span> <span className="text-blue-400 hover:text-blue-300">{company.website}</span></div>}
            
            {/* Address */}
            {company.address && (
              <div className="md:col-span-2">
                <span className="font-medium text-gold-primary">Osoite:</span>{' '}
                <span className="text-gray-300">
                  {typeof company.address === 'object' && company.address
                    ? [company.address.street, company.address.city, company.address.postal_code, company.address.country]
                        .filter(Boolean)
                        .join(', ')
                    : String(company.address)}
                </span>
              </div>
            )}
            
            {/* Business Info */}
            {company.industry && <div><span className="font-medium text-gold-primary">Toimiala:</span> <span className="text-gray-300">{company.industry}</span></div>}
            {company.market && <div><span className="font-medium text-gold-primary">Markkina:</span> <span className="text-gray-300">{company.market}</span></div>}
            {company.founded && <div><span className="font-medium text-gold-primary">Perustettu:</span> <span className="text-gray-300">{new Date(company.founded).getFullYear()}</span></div>}
            {company.employees && <div><span className="font-medium text-gold-primary">Työntekijöitä:</span> <span className="text-gray-300">{company.employees}</span></div>}
             
             {/* Products */}
             {company.products && company.products.length > 0 && (
               <div className="md:col-span-2">
                 <span className="font-medium text-gold-primary">Tuotteet:</span>
                 <div className="mt-1 text-sm text-gray-300">
                   {company.products.join(', ')}
                 </div>
               </div>
             )}
             
             {/* Key Competitors */}
             {company.key_competitors && company.key_competitors.length > 0 && (
               <div className="md:col-span-2">
                 <span className="font-medium text-gold-primary">Kilpailijat:</span>
                 <div className="mt-1 text-sm text-gray-300">
                   {company.key_competitors.join(', ')}
                 </div>
               </div>
             )}
          </div>
             
          {/* Description */}
          {company.description && (
            <div className="mt-4">
              <span className="font-medium text-gold-primary">Kuvaus:</span>
              <div className="mt-2 p-3 bg-gray-800 rounded text-gray-300 text-sm max-h-32 overflow-y-auto border border-gray-600">
                {company.description}
              </div>
            </div>
          )}
            
          <div className="pt-3 border-t border-gray-600 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div><span className="font-medium text-gold-primary">Luotu:</span> <span className="text-gray-300">{formatDate(company.created_at)}</span></div>
              <div><span className="font-medium text-gold-primary">Päivitetty:</span> <span className="text-gray-300">{formatDate(company.updated_at)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Lender Applications Summary */}
      {application.lender_applications && application.lender_applications.length > 0 && (
        <div>
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-gold-primary" />
            Rahoittajat ({application.lender_applications.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {application.lender_applications.map((lenderApp) => (
              <div key={lenderApp.id} className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
                <div className="font-semibold text-white mb-2">{lenderApp.lenders?.name || 'Tuntematon'}</div>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium text-gold-primary">Tila:</span> <span className="text-gray-300">{lenderApp.status}</span></div>
                  <div><span className="font-medium text-gold-primary">Viite:</span> <span className="text-gray-300">{lenderApp.lender_reference}</span></div>
                  {lenderApp.poll_count > 0 && <div><span className="font-medium text-gold-primary">Kyselyitä:</span> <span className="text-gray-300">{lenderApp.poll_count}</span></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminFundingApplicationsPage() {
  const t = useTranslations('Admin.FundingApplications')
  const { session, isAdmin } = useAuth()
  const [applications, setApplications] = useState<EnhancedFundingApplication[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!session?.user || !isAdmin) return
    
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching funding applications from API...')
      // Use GET method for fetching data
      const data = await AdminApi.callAdminApi<EnhancedFundingApplication[]>('admin/funding-applications', 'GET')
      console.log('Received data:', data)
      setApplications(data)
    } catch (err) {
      console.error('Error fetching funding applications:', err)
      setError(err instanceof Error ? err.message : t('error.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }, [session, isAdmin, t])

  useEffect(() => {
    if (session?.user && isAdmin) {
      fetchData()
    }
  }, [session?.user?.id, isAdmin]) // Removed fetchData from dependencies

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      console.error('Error formatting date:', e)
      return dateString // Fallback
    }
  }

  const formatCurrency = (amount: number | string | null, currency = 'EUR') => {
    if (!amount) return '-'
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: currency
    }).format(numAmount)
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "error" | "success" | "warning" | undefined => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return 'default'
      case 'processing':
        return 'secondary'
      case 'approved':
        return 'success'
      case 'rejected':
        return 'error'
      case 'offered':
        return 'success'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return <ErrorMessage error={error} title={t('error.fetchFailedTitle')} />
  }

  if (!applications.length) {
    return (
      <div className="text-center py-10">
        <p>{t('noApplicationsFound')}</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="h-8 w-8 text-white" />
          <h1 className="text-2xl md:text-3xl font-bold">{t('title')}</h1>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
          <TableCaption>{t('tableCaption', { count: applications.length })}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">{t('header.company')}</TableHead>
              <TableHead className="min-w-[120px]">{t('header.amount')}</TableHead>
              <TableHead>{t('header.term')}</TableHead>
              <TableHead>{t('header.status')}</TableHead>
              <TableHead>{t('header.submittedAt')}</TableHead>
              <TableHead className="min-w-[250px]">{t('header.lenders')}</TableHead>

            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <Tooltip key={app.id}>
                <TooltipTrigger asChild>
                  <TableRow className="hover:bg-muted/50 cursor-help">
                    {/* Company Information */}
                    <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">
                      {app.companies?.name || 'Unknown Company'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Y-tunnus: {app.companies?.business_id || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      ID: {app.id.slice(0, 8)}...
                    </div>
                  </div>
                </TableCell>

                {/* Amount */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatCurrency(app.amount, app.currency)}
                    </span>
                  </div>
                </TableCell>

                {/* Term */}
                <TableCell>
                  {app.term_months ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{app.term_months} {t('months')}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(app.status)}>
                    {app.status}
                  </Badge>
                </TableCell>

                {/* Submitted At */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatRelativeTime(app.submitted_at)}
                    </span>
                  </div>
                </TableCell>

                {/* Lender Applications */}
                <TableCell>
                  {app.lender_applications && app.lender_applications.length > 0 ? (
                    <div className="space-y-2">
                      {app.lender_applications.map((lenderApp: EnhancedLenderApplicationRow) => (
                        <div key={lenderApp.id} className="text-xs border rounded-md p-2 bg-muted/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground">
                              {lenderApp.lenders?.name || lenderApp.lender_id}
                            </span>
                                                         <Badge variant={getStatusBadgeVariant(lenderApp.status)}>
                               {lenderApp.status}
                             </Badge>
                          </div>
                          <div className="text-muted-foreground">
                            Ref: {lenderApp.lender_reference || 'N/A'}
                          </div>
                          <div className="text-muted-foreground">
                            {formatRelativeTime(lenderApp.created_at)}
                          </div>
                          {lenderApp.poll_count > 0 && (
                            <div className="text-muted-foreground">
                              Polls: {lenderApp.poll_count}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground italic">
                      <Users className="h-4 w-4" />
                      <span className="text-xs">{t('noLenderApps')}</span>
                    </div>
                  )}
                </TableCell>

                  </TableRow>
                </TooltipTrigger>
                <TooltipContent 
                  className="p-0 z-50 w-[90vw] max-w-2xl min-w-[400px] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:max-w-3xl"
                  style={{
                    position: 'fixed',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxHeight: '80vh',
                    overflowY: 'auto'
                  }}
                >
                  <DetailedTooltip application={app} />
                </TooltipContent>
              </Tooltip>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>
    </TooltipProvider>
  )
} 