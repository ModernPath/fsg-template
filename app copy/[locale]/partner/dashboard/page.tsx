'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { usePartner, usePartnerCommissions, useReferralLinks, useCreateReferralLink } from '@/hooks/usePartnerQueries'
import { useToast } from '@/components/ui/use-toast'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { fi } from 'date-fns/locale'
import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Copy,
  FileText,
  TrendingUp,
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  BarChart3,
  RefreshCcw
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/utils/supabase/client'

// Types for referral links
interface PartnerReferralLink {
  id: string
  link_code: string
  source_page: string
  campaign_name?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  is_active: boolean
  click_count: number
  conversion_count: number
  total_revenue: number
  created_at: string
  expires_at?: string
  full_url?: string
}

interface CreateReferralLinkData {
  source_page: string
  campaign_name?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  expires_at?: string
}

export default function PartnerDashboardPage() {
  const t = useTranslations('partner.dashboard')
  const tCommon = useTranslations('partner.common')
  const tLayout = useTranslations('partner.layout')
  const { user, isPartner, partnerId } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  // Use partner ID from auth or force admin partner ID for testing
  const partnerIdToUse = partnerId || (user?.email === 'admin@trustyfinance.fi' ? 'd056cadd-0397-470c-b987-4c511d720a5d' : null)

  console.log('🔍 [Partner Dashboard] Debug info:', {
    isPartner,
    partnerId,
    userMetadataPartnerId: user?.user_metadata?.partner_id,
    partnerIdToUse,
    userId: user?.id,
    userEmail: user?.email,
    hasUser: !!user
  })

  // React Query Hooks
  const { 
    data: partner, 
    isLoading: partnerLoading, 
    error: partnerError, 
    refetch: refetchPartner 
  } = usePartner(partnerIdToUse)
  
  const { 
    data: commissionsData, 
    isLoading: commissionsLoading, 
    error: commissionsError,
    refetch: refetchCommissions 
  } = usePartnerCommissions(partnerIdToUse)

  const { 
    data: referralLinksData, 
    isLoading: referralLinksLoading, 
    error: referralLinksError,
    refetch: refetchReferralLinks 
  } = useReferralLinks(partnerIdToUse)

  const createReferralLinkMutation = useCreateReferralLink(partnerIdToUse || '')

  // Extract data from React Query responses
  const commissions = commissionsData?.data || []
  const summary = commissionsData?.summary || { total_amount: 0, paid_amount: 0, pending_amount: 0, total_count: 0 }
  const referralLinks = referralLinksData || []

  // UI state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createFormData, setCreateFormData] = useState<CreateReferralLinkData>({
    source_page: 'home',
    utm_source: 'partner',
    utm_medium: 'referral'
  })

  // Create referral link handler using React Query mutation
  const handleCreateReferralLink = async () => {
    try {
      await createReferralLinkMutation.mutateAsync(createFormData)
      
      toast({
        title: 'Onnistui!',
        description: 'Referral linkki luotu onnistuneesti',
      })
      
      setShowCreateDialog(false)
      setCreateFormData({
        source_page: 'home',
        utm_source: 'partner',
        utm_medium: 'referral'
      })
    } catch (error) {
      console.error('❌ [handleCreateReferralLink] Error:', error)
      toast({
        title: 'Virhe',
        description: 'Referral linkin luominen epäonnistui',
        variant: 'destructive'
      })
    }
  }

  // Copy link to clipboard
  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Kopioitu',
        description: 'Linkki kopioitu leikepöydälle'
      })
    } catch (error) {
      toast({
        title: 'Virhe',
        description: 'Kopiointi epäonnistui',
        variant: 'destructive'
      })
    }
  }

  // Create default referral link using React Query mutation
  const createDefaultReferralLink = async () => {
    try {
      await createReferralLinkMutation.mutateAsync({
        source_page: 'home',
        campaign_name: 'default',
        utm_source: 'partner',
        utm_medium: 'referral'
      })
      
      toast({
        title: 'Onnistui',
        description: 'Oletusreferral linkki luotu'
      })
    } catch (error) {
      console.error('❌ [createDefaultReferralLink] Error:', error)
      toast({
        title: 'Virhe',
        description: 'Referral linkin luominen epäonnistui',
        variant: 'destructive'
      })
    }
  }

  // React Query handles data loading automatically

  // Check if user is a partner
  if (!isPartner && !partnerIdToUse) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {tLayout('accessDenied')}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (partnerLoading || commissionsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">{tCommon('loading')}</div>
      </div>
    )
  }

  if (!partner || partnerError) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {tLayout('partnerNotFound')}
            {partnerError && <div className="mt-2 text-sm">{tCommon('error')}: {partnerError}</div>}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const getCommissionStatusBadge = (status: string) => {
    const tStatus = useTranslations('partner.commissions.status')
    const statusConfig = {
      pending: { label: tStatus('pending'), variant: 'secondary' as const, icon: Clock },
      approved: { label: tStatus('approved'), variant: 'default' as const, icon: CheckCircle },
      paid: { label: tStatus('paid'), variant: 'success' as const, icon: CheckCircle },
      rejected: { label: tStatus('rejected'), variant: 'error' as const, icon: AlertCircle }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleExportCommissions = () => {
    exportCsv()
  }

  const handleCopySignupCode = async () => {
    if (partner.signup_code) {
      try {
        const signupUrl = `${window.location.origin}/${locale}/partner-signup?partner=${partner.signup_code}`
        await navigator.clipboard.writeText(signupUrl)
        toast({
          title: t('signupCode.copied'),
          description: t('signupCode.copySuccess'),
          duration: 3000,
        })
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        toast({
          title: t('signupCode.copyFailed'),
          description: t('signupCode.copyError'),
          variant: 'destructive',
          duration: 5000,
        })
      }
    }
  }

  // Navigation handlers for quick actions
  const handleNavigateToCustomers = () => {
    router.push(`/${locale}/partner/customers`)
  }

  const handleNavigateToReports = () => {
    router.push(`/${locale}/partner/reports`)
  }

  const handleNavigateToStatistics = () => {
    router.push(`/${locale}/partner/commissions`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: fi })
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
      {/* Mobile-optimized header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          <span className="hidden sm:inline">Partner Dashboard</span>
          <span className="sm:hidden">Dashboard</span>
        </h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          <span className="hidden sm:inline">Tervetuloa takaisin, {partner.name}</span>
          <span className="sm:hidden">{partner.name}</span>
        </p>
      </div>

      {/* Mobile-optimized Stats Overview */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              <span className="hidden sm:inline">Kokonaispalkkiot</span>
              <span className="sm:hidden">Palkkiot</span>
            </CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(summary?.total_amount || 0)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Maksetut: {formatCurrency(summary?.paid_amount || 0)}</span>
              <span className="sm:hidden">{formatCurrency(summary?.paid_amount || 0)} maksettu</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              <span className="hidden sm:inline">Referraalit yhteensä</span>
              <span className="sm:hidden">Referraalit</span>
            </CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold">{summary?.total_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Käsittelyssä: {(summary?.total_count || 0) - (summary?.paid_amount ? 1 : 0)}</span>
              <span className="sm:hidden">{(summary?.total_count || 0) - (summary?.paid_amount ? 1 : 0)} käsittelyssä</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              <span className="hidden sm:inline">Aktiiviset linkit</span>
              <span className="sm:hidden">Linkit</span>
            </CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold">
              {referralLinks.filter(link => link.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Yhteensä: {referralLinks.length} linkkiä</span>
              <span className="sm:hidden">{referralLinks.length} yhteensä</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              <span className="hidden sm:inline">Klikkaukset</span>
              <span className="sm:hidden">Klikkaukset</span>
            </CardTitle>
            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold">
              {referralLinks.reduce((sum, link) => sum + link.click_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Konversiot: {referralLinks.reduce((sum, link) => sum + link.conversion_count, 0)}</span>
              <span className="sm:hidden">{referralLinks.reduce((sum, link) => sum + link.conversion_count, 0)} konversiot</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile-optimized Customer Referral Links Section */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                <span className="hidden sm:inline">Asiakkaiden referral linkit</span>
                <span className="sm:hidden">Referral linkit</span>
              </CardTitle>
              <CardDescription className="text-sm">
                <span className="hidden sm:inline">
                  Jaa nämä linkit asiakkaillesi. Kun he rekisteröityvät näiden linkkien kautta, saat palkkion.
                </span>
                <span className="sm:hidden">
                  Jaa linkit asiakkaille ja ansaitse palkkioita.
                </span>
              </CardDescription>
            </div>
            <Button 
              onClick={createDefaultReferralLink} 
              disabled={referralLinksLoading || createReferralLinkMutation.isPending}
              className="w-full sm:w-auto"
              size="sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="hidden sm:inline">Luo uusi linkki</span>
              <span className="sm:hidden">Luo linkki</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {referralLinksLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : referralLinks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Et ole vielä luonut asiakkaiden referral linkkejä.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Kun luot referral linkin, asiakkaat voivat rekisteröityä sen kautta ja linkittyä sinuun kumppanina.
              </p>
              <Button 
                onClick={createDefaultReferralLink}
                disabled={createReferralLinkMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createReferralLinkMutation.isPending ? 'Luodaan...' : 'Luo ensimmäinen linkki'}
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Koodi</TableHead>
                      <TableHead>Sivu</TableHead>
                      <TableHead>Kampanja</TableHead>
                      <TableHead>Klikkaukset</TableHead>
                      <TableHead>Konversiot</TableHead>
                      <TableHead>Tila</TableHead>
                      <TableHead className="text-right">Toiminnot</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referralLinks.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-mono text-sm">
                          {link.link_code}
                        </TableCell>
                        <TableCell>{link.source_page}</TableCell>
                        <TableCell>{link.campaign_name || '-'}</TableCell>
                        <TableCell>{link.click_count}</TableCell>
                        <TableCell>{link.conversion_count}</TableCell>
                        <TableCell>
                          <Badge variant={link.is_active ? 'default' : 'secondary'}>
                            {link.is_active ? 'Aktiivinen' : 'Ei aktiivinen'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(link.full_url || '')}
                              title="Kopioi linkki"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(link.full_url, '_blank')}
                              title="Avaa linkki"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {referralLinks.map((link) => (
                  <Card key={link.id} className="p-4">
                    <div className="space-y-3">
                      {/* Header with code and status */}
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm font-medium">
                          {link.link_code}
                        </div>
                        <Badge variant={link.is_active ? 'default' : 'secondary'} className="text-xs">
                          {link.is_active ? 'Aktiivinen' : 'Ei aktiivinen'}
                        </Badge>
                      </div>
                      
                      {/* Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sivu:</span>
                          <div className="font-medium">{link.source_page}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kampanja:</span>
                          <div className="font-medium">{link.campaign_name || '-'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Klikkaukset:</span>
                          <div className="font-medium">{link.click_count}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Konversiot:</span>
                          <div className="font-medium">{link.conversion_count}</div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(link.full_url || '')}
                          className="flex-1"
                        >
                          <Copy className="w-3 h-3 mr-2" />
                          Kopioi
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(link.full_url, '_blank')}
                          className="flex-1"
                        >
                          <ExternalLink className="w-3 h-3 mr-2" />
                          Avaa
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Mobile-optimized Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            <span className="hidden sm:inline">Viimeisimmät palkkiot</span>
            <span className="sm:hidden">Palkkiot</span>
          </CardTitle>
          <CardDescription className="text-sm">
            <span className="hidden sm:inline">Viimeisimpien 30 päivän palkkiot</span>
            <span className="sm:hidden">Viimeiset 30 päivää</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions && commissions.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Päivämäärä</TableHead>
                      <TableHead>Yritys</TableHead>
                      <TableHead>Tyyppi</TableHead>
                      <TableHead>Tila</TableHead>
                      <TableHead className="text-right">Summa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.slice(0, 10).map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>{formatDate(commission.created_at)}</TableCell>
                        <TableCell>{commission.company_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {commission.commission_type || 'Referral'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                            {commission.status === 'paid' ? 'Maksettu' : 'Käsittelyssä'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(commission.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {commissions.slice(0, 10).map((commission) => (
                  <Card key={commission.id} className="p-4">
                    <div className="space-y-2">
                      {/* Header with amount and status */}
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-lg">
                          {formatCurrency(commission.amount)}
                        </div>
                        <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                          {commission.status === 'paid' ? 'Maksettu' : 'Käsittelyssä'}
                        </Badge>
                      </div>
                      
                      {/* Details */}
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Päivämäärä:</span>
                          <span className="font-medium">{formatDate(commission.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Yritys:</span>
                          <span className="font-medium">{commission.company_name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tyyppi:</span>
                          <Badge variant="secondary" className="text-xs">
                            {commission.commission_type || 'Referral'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                <span className="hidden sm:inline">Ei vielä palkkioita näytettäväksi</span>
                <span className="sm:hidden">Ei palkkioita</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile-optimized Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            <span className="hidden sm:inline">Pikavalinnat</span>
            <span className="sm:hidden">Toiminnot</span>
          </CardTitle>
          <CardDescription className="text-sm">
            <span className="hidden sm:inline">Pääset nopeasti tärkeimpiin toimintoihin</span>
            <span className="sm:hidden">Nopeat toiminnot</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              className="h-14 sm:h-16 flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm"
              onClick={() => router.push(`/${locale}/partner/customers`)}
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Asiakkaat</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-14 sm:h-16 flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm"
              onClick={() => router.push(`/${locale}/partner/reports`)}
            >
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Raportit</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-14 sm:h-16 flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm col-span-2 sm:col-span-1"
              onClick={() => router.push(`/${locale}/partner/commissions`)}
            >
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Tilastot</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 