'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Calendar,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Eye,
  TrendingUp,
  Building2,
  Euro
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { format } from 'date-fns'
import { fi, sv, enUS } from 'date-fns/locale'

interface FundingApplication {
  id: string
  type: string
  status: string
  amount_requested: number
  created_at: string
  updated_at: string
  metadata?: any
  purpose?: string
  term_months?: number
  company_id?: string
}

export default function ApplicationsPage() {
  const t = useTranslations('Dashboard')
  const { session } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const supabase = createClient()

  const [applications, setApplications] = useState<FundingApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<FundingApplication | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Get locale for date-fns
  const dateLocale = locale === 'fi' ? fi : locale === 'sv' ? sv : enUS

  // Handle application click
  const handleApplicationClick = (app: FundingApplication) => {
    setSelectedApplication(app)
    setIsDetailModalOpen(true)
  }

  // Close modal
  const closeModal = () => {
    setIsDetailModalOpen(false)
    setTimeout(() => setSelectedApplication(null), 200)
  }

  // Fetch applications
  useEffect(() => {
    if (!session?.user) return

    const fetchApplications = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user's company
        const { data: companies, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('created_by', session.user.id)
          .limit(1)

        if (companyError) throw companyError
        if (!companies || companies.length === 0) {
          setApplications([])
          setLoading(false)
          return
        }

        const companyId = companies[0].id

        // Fetch applications
        const { data, error: appsError } = await supabase
          .from('funding_applications')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })

        if (appsError) throw appsError
        setApplications(data || [])
      } catch (err) {
        console.error('Error fetching applications:', err)
        setError(err instanceof Error ? err.message : 'Failed to load applications')
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [session?.user, supabase])

  // Get status badge variant
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'approved':
        return 'default'
      case 'submitted':
      case 'processing':
        return 'secondary'
      case 'rejected':
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'submitted':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    // Handle null, undefined, or NaN values
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '-'
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Get funding type localized name
  const getFundingTypeName = (type: string) => {
    const snakeToCamel = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
    const typeKey = type ? `fundingTypes.${snakeToCamel(type)}` : 'fundingTypes.businessLoan'
    return t(typeKey, { 
      default: type 
        ? type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : 'Rahoitushakemus'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('back', { default: 'Back to Dashboard' })}
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('applications.title', { default: 'Funding Applications' })}
          </h1>
          <p className="text-muted-foreground">
            {t('applications.description', { default: 'View and manage your funding applications' })}
          </p>
        </div>
        <Button onClick={() => router.push(`/${locale}/finance-application`)}>
          {t('applications.newApplication', { default: 'New Application' })}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Applications Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('applications.allApplications', { default: 'All Applications' })}
            <Badge variant="secondary" className="ml-2">
              {applications.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            {t('applications.allApplicationsDesc', { default: 'Track the status of your funding applications' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('applications.type', { default: 'Type' })}</TableHead>
                    <TableHead>{t('applications.amount', { default: 'Amount' })}</TableHead>
                    <TableHead>{t('applications.status', { default: 'Status' })}</TableHead>
                    <TableHead>{t('applications.submitted', { default: 'Submitted' })}</TableHead>
                    <TableHead>{t('applications.updated', { default: 'Updated' })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow 
                      key={app.id} 
                      className="hover:bg-accent/50 cursor-pointer transition-colors group"
                      onClick={() => handleApplicationClick(app)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          {getFundingTypeName(app.type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-semibold">
                          <Euro className="h-3 w-3 text-muted-foreground" />
                          {formatCurrency(app.amount_requested)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(app.status)}
                          <Badge variant={getStatusVariant(app.status)}>
                            {t(`applications.statuses.${app.status}`, { default: app.status })}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(app.created_at), 'dd.MM.yyyy', { locale: dateLocale })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <RefreshCw className="h-3 w-3" />
                            {format(new Date(app.updated_at), 'dd.MM.yyyy HH:mm', { locale: dateLocale })}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApplicationClick(app)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {t('applications.noApplications', { default: 'No Applications Yet' })}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('applications.noApplicationsDesc', { default: 'Start your first funding application to see it here' })}
              </p>
              <Button onClick={() => router.push(`/${locale}/finance-application`)}>
                {t('applications.startApplication', { default: 'Start Application' })}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('applications.details', { default: 'Application Details' })}
            </DialogTitle>
            <DialogDescription>
              {selectedApplication && getFundingTypeName(selectedApplication.type)}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6 mt-4">
              {/* Status Section */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {getStatusIcon(selectedApplication.status)}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('applications.currentStatus', { default: 'Current Status' })}
                    </p>
                    <Badge variant={getStatusVariant(selectedApplication.status)} className="mt-1">
                      {t(`applications.statuses.${selectedApplication.status}`, { default: selectedApplication.status })}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {t('applications.applicationId', { default: 'Application ID' })}
                  </p>
                  <p className="text-xs font-mono mt-1">{selectedApplication.id.substring(0, 8)}</p>
                </div>
              </div>

              {/* Amount & Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Euro className="h-4 w-4" />
                    <p className="text-sm">{t('applications.requestedAmount', { default: 'Requested Amount' })}</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(selectedApplication.amount_requested)}</p>
                </div>

                {selectedApplication.term_months && (
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <p className="text-sm">{t('applications.term', { default: 'Term' })}</p>
                    </div>
                    <p className="text-2xl font-bold">{selectedApplication.term_months} {t('applications.months', { default: 'months' })}</p>
                  </div>
                )}
              </div>

              {/* Purpose */}
              {selectedApplication.purpose && (
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <p className="text-sm font-medium">{t('applications.purpose', { default: 'Purpose' })}</p>
                  </div>
                  <p className="text-sm">{selectedApplication.purpose}</p>
                </div>
              )}

              {/* Timeline */}
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('applications.timeline', { default: 'Timeline' })}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('applications.submitted', { default: 'Submitted' })}</span>
                    <span className="font-medium">
                      {format(new Date(selectedApplication.created_at), 'dd.MM.yyyy HH:mm', { locale: dateLocale })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('applications.lastUpdate', { default: 'Last Update' })}</span>
                    <span className="font-medium">
                      {format(new Date(selectedApplication.updated_at), 'dd.MM.yyyy HH:mm', { locale: dateLocale })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {selectedApplication.metadata && Object.keys(selectedApplication.metadata).length > 0 && (
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t('applications.additionalInfo', { default: 'Additional Information' })}
                  </h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(selectedApplication.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={closeModal}
                >
                  {t('applications.close', { default: 'Close' })}
                </Button>
                {selectedApplication.status === 'approved' && (
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      closeModal()
                      router.push(`/${locale}/finance-application?id=${selectedApplication.id}`)
                    }}
                  >
                    {t('applications.viewOffer', { default: 'View Offer' })}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

