'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { usePartnerCommissions } from '@/hooks/usePartnerQueries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Download,
  Calendar,
  Building2,
  DollarSign,
  AlertCircle,
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { fi } from 'date-fns/locale'

export default function PartnerCommissionsPage() {
  const t = useTranslations('partner.commissions')
  const tCommon = useTranslations('partner.common')
  const tLayout = useTranslations('partner.layout')
  const { user, isPartner, partnerId } = useAuth()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  // Get partner ID from AuthProvider
  const partnerIdToUse = partnerId || user?.user_metadata?.partner_id || null

  console.log('🔍 [Partner Commissions] Debug info:', {
    isPartner,
    partnerId,
    userMetadataPartnerId: user?.user_metadata?.partner_id,
    partnerIdToUse,
    userId: user?.id
  })

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

  const { 
    data: commissionsData, 
    isLoading: loading, 
    error,
    refetch
  } = usePartnerCommissions(partnerIdToUse, { 
    page, 
    limit,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchTerm || undefined
  })

  // Extract data from React Query response
  const commissions = commissionsData?.data || []
  const pagination = commissionsData?.pagination || { page: 1, limit: 20, total: 0, pages: 0 }
  const summary = commissionsData?.summary || { total_amount: 0, paid_amount: 0, pending_amount: 0, total_count: 0 }

  // Filter commissions locally if needed
  const filteredCommissions = useMemo(() => {
    return commissions.filter(commission => {
      const matchesSearch = 
        commission.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commission.business_id.includes(searchTerm) ||
        commission.contract_id.toString().includes(searchTerm)
      
      const matchesStatus = statusFilter === 'all' || commission.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [commissions, searchTerm, statusFilter])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: t('status.pending'), variant: 'secondary' as const, icon: Clock },
      approved: { label: t('status.approved'), variant: 'default' as const, icon: CheckCircle },
      paid: { label: t('status.paid'), variant: 'success' as const, icon: CheckCircle },
      rejected: { label: t('status.rejected'), variant: 'error' as const, icon: XCircle }
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

  const getContractTypeBadge = (type: string) => {
    const typeConfig = {
      'accounting': { label: t('contractType.accounting'), variant: 'default' as const },
      'payroll': { label: t('contractType.payroll'), variant: 'secondary' as const },
      'tax': { label: t('contractType.tax'), variant: 'warning' as const },
      'consulting': { label: t('contractType.consulting'), variant: 'success' as const }
    }
    const config = typeConfig[type as keyof typeof typeConfig] || { label: type, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {tCommon('refresh')}
          </Button>
          <Button variant="outline" onClick={() => exportCsv()} disabled={commissions.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            {t('export.button')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalAmount')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_amount?.toFixed(2) || '0.00'} €</div>
            <p className="text-xs text-muted-foreground">
              {summary.total_count || 0} {t('stats.totalCount')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.paidAmount')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.paid_amount?.toFixed(2) || '0.00'} €</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.paidCommissions')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.pendingAmount')}</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.pending_amount?.toFixed(2) || '0.00'} €</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.pendingPayments')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.averageAmount')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.total_count > 0 ? (summary.total_amount / summary.total_count).toFixed(2) : '0.00'} €
            </div>
            <p className="text-xs text-muted-foreground">
              {t('stats.avgPerCommission')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filter.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('filter.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1) // Reset page when searching
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('filter.pending')}</SelectItem>
                  <SelectItem value="approved">{t('filter.approved')}</SelectItem>
                  <SelectItem value="paid">{t('filter.paid')}</SelectItem>
                  <SelectItem value="rejected">{t('filter.rejected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {t('title')} ({pagination.total || filteredCommissions.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{t('loadingCommissions')}</div>
          ) : filteredCommissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? t('noCommissionsFiltered')
                : t('noCommissions')}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.company')}</TableHead>
                    <TableHead>{t('table.contract')}</TableHead>
                    <TableHead>{t('table.amount')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead>{t('table.generated')}</TableHead>
                    <TableHead>{t('table.updated')}</TableHead>
                    <TableHead>{t('table.notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{commission.company_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('table.businessId')}: {commission.business_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">#{commission.contract_id}</div>
                          {getContractTypeBadge(commission.contract_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-right">
                          <div className="font-semibold text-lg">{commission.amount.toFixed(2)} €</div>
                          {commission.percentage && (
                            <div className="text-sm text-muted-foreground">
                              {commission.percentage}% {t('table.commission')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(commission.status)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(commission.created_at), 'dd.MM.yyyy', { locale: fi })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(commission.created_at), 'HH:mm', { locale: fi })}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(commission.updated_at), 'dd.MM.yyyy', { locale: fi })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(commission.updated_at), 'HH:mm', { locale: fi })}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs">
                        {commission.notes ? (
                          <div className="truncate" title={commission.notes}>
                            {commission.notes}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    {t('pagination.previous')}
                  </Button>
                  
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(pagination.pages - 4, page - 2)) + i
                    if (pageNum <= pagination.pages) {
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    }
                    return null
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                    disabled={page === pagination.pages}
                  >
                    {t('pagination.next')}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

             {/* Status Breakdown */}
       <Card>
         <CardHeader>
           <CardTitle>{t('paymentStatus.title')}</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="text-center p-4 border rounded-lg">
               <div className="text-2xl font-bold text-orange-600">{summary.pending_amount?.toFixed(2) || '0.00'} €</div>
               <div className="text-sm text-muted-foreground">{t('paymentStatus.pending')}</div>
               <div className="text-xs text-muted-foreground mt-1">
                 {summary.total_amount > 0 ? ((summary.pending_amount / summary.total_amount) * 100).toFixed(1) : '0'}% {t('paymentStatus.ofTotal')}
               </div>
             </div>
             
             <div className="text-center p-4 border rounded-lg">
               <div className="text-2xl font-bold text-green-600">{summary.paid_amount?.toFixed(2) || '0.00'} €</div>
               <div className="text-sm text-muted-foreground">{tCommon('paid')}</div>
               <div className="text-xs text-muted-foreground mt-1">
                 {summary.total_amount > 0 ? ((summary.paid_amount / summary.total_amount) * 100).toFixed(1) : '0'}% {t('paymentStatus.ofTotal')}
               </div>
             </div>
           </div>
         </CardContent>
       </Card>
    </div>
  )
} 