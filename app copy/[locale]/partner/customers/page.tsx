'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { usePartnerCustomers } from '@/hooks/usePartnerQueries'
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
  Users,
  TrendingUp,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { fi } from 'date-fns/locale'

interface PartnerCustomer {
  id: string
  company_name: string
  business_id: string
  email: string
  phone?: string
  status: 'pending' | 'approved' | 'paid' | 'cancelled' | 'disputed'
  created_at: string
  contract_count: number
  total_commission: number
  last_commission_date?: string
  last_commission_amount: number
}

export default function PartnerCustomersPage() {
  const t = useTranslations('partner.customers')
  const tCommon = useTranslations('partner.common')
  const tLayout = useTranslations('partner.layout')
  const { user, isPartner, partnerId } = useAuth()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  // Get partner ID from AuthProvider
  const partnerIdToUse = partnerId || user?.user_metadata?.partner_id || null

  // React Query hook for customers data
  const { 
    data: customersData, 
    isLoading: loading, 
    error: queryError,
    refetch
  } = usePartnerCustomers(partnerIdToUse, {
    page,
    limit,
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined
  })

  // Extract data from React Query response
  const customers = customersData?.data || []
  const stats = customersData?.stats || { total_customers: 0, paid_customers: 0, total_commissions: 0, average_per_customer: 0 }
  const error = queryError?.message || null

  // Demo data for testing when no real data
  const demoCustomers = [
    {
      id: 'demo-1',
      company_name: 'Demo Yritys Oy',
      business_id: '1234567-8',
      email: 'demo@yritys.fi',
      phone: '+358401234567',
      status: 'paid' as const,
      created_at: '2024-01-15T10:00:00Z',
      contract_count: 2,
      total_commission: 1250.50,
      last_commission_date: '2024-02-01T10:00:00Z',
      last_commission_amount: 625.25
    },
    {
      id: 'demo-2',
      company_name: 'Testi Firma Ab',
      business_id: '2345678-9',
      email: 'info@testifirma.fi',
      phone: '+358407654321',
      status: 'pending' as const,
      created_at: '2024-02-10T14:30:00Z',
      contract_count: 1,
      total_commission: 750.00,
      last_commission_date: '2024-02-10T14:30:00Z',
      last_commission_amount: 750.00
    }
  ]

  // Use demo data if no real customers and no error
  const displayCustomers = customers.length > 0 ? customers : (error ? [] : demoCustomers)
  const displayStats = customers.length > 0 ? stats : {
    total_customers: demoCustomers.length,
    paid_customers: demoCustomers.filter(c => c.status === 'paid').length,
    total_commissions: demoCustomers.reduce((sum, c) => sum + c.total_commission, 0),
    average_per_customer: demoCustomers.reduce((sum, c) => sum + c.total_commission, 0) / demoCustomers.length
  }

  console.log('🔍 [Partner Customers] Debug info:', {
    isPartner,
    partnerId,
    userMetadataPartnerId: user?.user_metadata?.partner_id,
    partnerIdToUse,
    userId: user?.id,
    customersCount: customers.length,
    loading,
    error,
    queryError
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

  // Filter customers locally if needed
  const filteredCustomers = useMemo(() => {
    return displayCustomers.filter(customer => {
      const matchesSearch = 
        customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.business_id.includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [displayCustomers, searchTerm, statusFilter])

  // Pagination
  const paginatedCustomers = useMemo(() => {
    const startIndex = (page - 1) * limit
    return filteredCustomers.slice(startIndex, startIndex + limit)
  }, [filteredCustomers, page, limit])

  const totalPages = Math.ceil(filteredCustomers.length / limit)

  // Export CSV
  const exportCsv = () => {
    const csvHeader = `${t('table.company')},${t('table.businessId')},${t('table.email')},${t('table.phone')},${t('table.status')},${t('table.created')},${t('table.contracts')},${t('table.totalCommission')},${t('table.lastCommission')}\n`
    const csvData = filteredCustomers.map(customer => 
      `"${customer.company_name}","${customer.business_id}","${customer.email}","${customer.phone || ''}","${customer.status}","${format(new Date(customer.created_at), 'dd.MM.yyyy', { locale: fi })}","${customer.contract_count}","${customer.total_commission.toFixed(2)} €","${customer.last_commission_date ? format(new Date(customer.last_commission_date), 'dd.MM.yyyy', { locale: fi }) : ''}"`
    ).join('\n')
    
    const csvContent = csvHeader + csvData
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = t('export.filename', { date: format(new Date(), 'yyyy-MM-dd') })
    link.click()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: t('filter.pending'), variant: 'secondary' as const },
      approved: { label: t('filter.approved'), variant: 'default' as const },
      paid: { label: t('filter.paid'), variant: 'default' as const },
      cancelled: { label: t('filter.cancelled'), variant: 'destructive' as const },
      disputed: { label: t('filter.disputed'), variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {tCommon('refresh')}
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={filteredCustomers.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              {t('export.button')}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.totalCustomers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.total_customers}</div>
            <p className="text-xs text-muted-foreground">
              {displayStats.paid_customers} {t('stats.paidCustomers')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.totalCommissions')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{displayStats.total_commissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.fromAllCustomers')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.averagePerCustomer')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{displayStats.average_per_customer.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.commissionPerCustomer')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('table.contracts')}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayCustomers.reduce((sum, customer) => sum + customer.contract_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {tCommon('total')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t('filter.title', { default: 'Filters' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('filter.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filter.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('filter.pending')}</SelectItem>
                  <SelectItem value="approved">{t('filter.approved')}</SelectItem>
                  <SelectItem value="paid">{t('filter.paid')}</SelectItem>
                  <SelectItem value="cancelled">{t('filter.cancelled')}</SelectItem>
                  <SelectItem value="disputed">{t('filter.disputed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            {t('loading')}
          </CardContent>
        </Card>
      )}

      {/* Customers Table */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('noCustomers')}</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Ei asiakkaita hakuehdoilla'
                    : 'Ei vielä asiakkaita'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('table.company')}</TableHead>
                        <TableHead>{t('table.businessId')}</TableHead>
                        <TableHead>{t('table.email')}</TableHead>
                        <TableHead>{t('table.status')}</TableHead>
                        <TableHead>{t('table.created')}</TableHead>
                        <TableHead className="text-right">{t('table.totalCommission')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">
                            {customer.company_name}
                          </TableCell>
                          <TableCell>{customer.business_id}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>
                            {getStatusBadge(customer.status)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(customer.created_at), 'dd.MM.yyyy', { locale: fi })}
                          </TableCell>
                          <TableCell className="text-right">
                            €{customer.total_commission.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      {t('pagination.showing', {
                        start: (page - 1) * limit + 1,
                        end: Math.min(page * limit, filteredCustomers.length),
                        total: filteredCustomers.length
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                      >
                        {t('pagination.previous')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= totalPages}
                      >
                        {t('pagination.next')}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}