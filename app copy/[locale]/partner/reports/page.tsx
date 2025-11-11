'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  BarChart3,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { fi } from 'date-fns/locale'
import { createClient } from '@/utils/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CommissionData {
  month: string
  count: number
  amount: number
  paid_amount: number
  pending_amount: number
}

interface CustomerData {
  month: string
  new_customers: number
  total_customers: number
}

interface PerformanceMetrics {
  conversion_rate: number
  avg_commission_per_customer: number
  total_revenue: number
  growth_rate: number
}

export default function PartnerReportsPage() {
  const t = useTranslations('partner.reports')
  const tCommon = useTranslations('partner.common')
  const tLayout = useTranslations('partner.layout')
  const { user, isPartner, partnerId } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('last-12-months')
  
  // Custom date range states
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  
  // Data states
  const [commissionData, setCommissionData] = useState<CommissionData[]>([])
  const [customerData, setCustomerData] = useState<CustomerData[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    conversion_rate: 0,
    avg_commission_per_customer: 0,
    total_revenue: 0,
    growth_rate: 0
  })

  const supabase = createClient()

  // Get partner ID from AuthProvider
  const partnerIdToUse = partnerId || user?.user_metadata?.partner_id || null

  console.log('🔍 [Partner Reports] Debug info:', {
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

  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date()
    
    // Handle custom date range
    if (timeRange === 'custom' && customStartDate && customEndDate) {
      return { 
        start: new Date(customStartDate), 
        end: new Date(customEndDate) 
      }
    }
    
    switch (timeRange) {
      case 'current-month':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case 'last-month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }
      case 'last-3-months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
      case 'last-6-months':
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) }
      case 'last-12-months':
        return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) }
      case 'current-year':
        return { start: startOfYear(now), end: endOfYear(now) }
      default:
        return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) }
    }
  }

  // Initialize custom date range when switching to custom
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
    
    // Set default custom date range to last 3 months if custom is selected and dates are empty
    if (value === 'custom' && !customStartDate && !customEndDate) {
      const now = new Date()
      const threeMonthsAgo = subMonths(now, 3)
      setCustomStartDate(format(threeMonthsAgo, 'yyyy-MM-dd'))
      setCustomEndDate(format(now, 'yyyy-MM-dd'))
    }
  }

  // Validate custom date range
  const isCustomDateRangeValid = () => {
    if (timeRange !== 'custom') return true
    if (!customStartDate || !customEndDate) return false
    return new Date(customStartDate) <= new Date(customEndDate)
  }

  const fetchReportsData = async () => {
    if (!user || !partnerIdToUse) return

    try {
      setLoading(true)
      setError(null)

      console.log('📊 Fetching reports data for partner:', partnerIdToUse)

      const { start, end } = getDateRange()

      console.log('📅 Date range:', { start, end })

      // Fetch commission data grouped by month
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('partner_commissions')
        .select(`
          commission_amount,
          status,
          generated_at
        `)
        .eq('partner_id', partnerIdToUse)
        .gte('generated_at', start.toISOString())
        .lte('generated_at', end.toISOString())
        .order('generated_at', { ascending: true })

      if (commissionsError) {
        console.error('❌ Commission data error:', commissionsError)
        throw commissionsError
      }

      console.log('✅ Fetched commissions data:', commissionsData?.length || 0)

      // Fetch customer data grouped by month
      const { data: customersData, error: customersError } = await supabase
        .from('companies')
        .select('created_at')
        .eq('partner_id', partnerIdToUse)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true })

      if (customersError) {
        console.error('❌ Customer data error:', customersError)
        throw customersError
      }

      console.log('✅ Fetched customers data:', customersData?.length || 0)

      // Process commission data by month
      const monthlyCommissions: { [key: string]: CommissionData } = {}
      commissionsData.forEach((commission: any) => {
        const month = format(new Date(commission.generated_at), 'yyyy-MM')
        if (!monthlyCommissions[month]) {
          monthlyCommissions[month] = {
            month,
            count: 0,
            amount: 0,
            paid_amount: 0,
            pending_amount: 0
          }
        }
        monthlyCommissions[month].count += 1
        const amount = parseFloat(commission.commission_amount || '0')
        monthlyCommissions[month].amount += amount
        if (commission.status === 'paid') {
          monthlyCommissions[month].paid_amount += amount
        } else {
          monthlyCommissions[month].pending_amount += amount
        }
      })

      // Process customer data by month
      const monthlyCustomers: { [key: string]: CustomerData } = {}
      let cumulativeCustomers = 0
      
      // Initialize all months in range
      let current = new Date(start)
      while (current <= end) {
        const month = format(current, 'yyyy-MM')
        monthlyCustomers[month] = {
          month,
          new_customers: 0,
          total_customers: cumulativeCustomers
        }
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
      }

      customersData.forEach((customer: any) => {
        const month = format(new Date(customer.created_at), 'yyyy-MM')
        if (monthlyCustomers[month]) {
          monthlyCustomers[month].new_customers += 1
        }
        cumulativeCustomers += 1
      })

      // Update cumulative totals
      Object.keys(monthlyCustomers).sort().forEach(month => {
        if (monthlyCustomers[month]) {
          monthlyCustomers[month].total_customers = cumulativeCustomers
        }
      })

      // Calculate performance metrics
      const totalCommissions = commissionsData.reduce((sum: number, c: any) => sum + c.amount, 0)
      const totalCustomers = customersData.length
      const avgCommissionPerCustomer = totalCustomers > 0 ? totalCommissions / totalCustomers : 0
      
      // Calculate growth rate (comparing last month to previous month)
      const sortedMonths = Object.keys(monthlyCommissions).sort()
      const lastMonthData = sortedMonths.length > 0 ? monthlyCommissions[sortedMonths[sortedMonths.length - 1]] : null
      const prevMonthData = sortedMonths.length > 1 ? monthlyCommissions[sortedMonths[sortedMonths.length - 2]] : null
      const growthRate = prevMonthData && prevMonthData.amount > 0 
        ? ((lastMonthData?.amount || 0) - prevMonthData.amount) / prevMonthData.amount * 100
        : 0

      setCommissionData(Object.values(monthlyCommissions).sort((a, b) => a.month.localeCompare(b.month)))
      setCustomerData(Object.values(monthlyCustomers).sort((a, b) => a.month.localeCompare(b.month)))
      setPerformanceMetrics({
        conversion_rate: 0, // Would need more data to calculate proper conversion rate
        avg_commission_per_customer: avgCommissionPerCustomer,
        total_revenue: totalCommissions,
        growth_rate: growthRate
      })
      
    } catch (err) {
      console.error('Error fetching reports data:', err)
      setError(err instanceof Error ? err.message : 'Virhe ladattaessa raportteja')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchReportsData()
    }
  }, [user, timeRange])

  // Trigger data refresh when custom date range changes
  useEffect(() => {
    if (timeRange === 'custom' && user && isCustomDateRangeValid()) {
      fetchReportsData()
    }
  }, [customStartDate, customEndDate, timeRange, user])

  // Export data as CSV
  const exportCommissionReport = () => {
    const csvHeader = `${t('charts.commissionsOverTime')},${t('metrics.totalCommissions')} (kpl),${tCommon('amount')} (€),${tCommon('paid')} (€),${tCommon('pending')} (€)\n`
    const csvData = commissionData.map(data => 
      `"${format(new Date(data.month + '-01'), 'MMMM yyyy', { locale: fi })}","${data.count}","${data.amount.toFixed(2)}","${data.paid_amount.toFixed(2)}","${data.pending_amount.toFixed(2)}"`
    ).join('\n')
    
    const csvContent = csvHeader + csvData
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = t('export.filenameCommissions', { timeRange, date: format(new Date(), 'yyyy-MM-dd') })
    link.click()
  }

  const exportCustomerReport = () => {
    const csvHeader = `${t('charts.customersOverTime')},${t('metrics.newCustomers')},${t('metrics.totalCustomers')}\n`
    const csvData = customerData.map(data => 
      `"${format(new Date(data.month + '-01'), 'MMMM yyyy', { locale: fi })}","${data.new_customers}","${data.total_customers}"`
    ).join('\n')
    
    const csvContent = csvHeader + csvData
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = t('export.filenameCustomers', { timeRange, date: format(new Date(), 'yyyy-MM-dd') })
    link.click()
  }

  // Calculate totals for current period
  const totalCommissions = commissionData.reduce((sum, data) => sum + data.amount, 0)
  const totalCommissionCount = commissionData.reduce((sum, data) => sum + data.count, 0)
  const totalPaidAmount = commissionData.reduce((sum, data) => sum + data.paid_amount, 0)
  const totalPendingAmount = commissionData.reduce((sum, data) => sum + data.pending_amount, 0)
  const totalNewCustomers = customerData.reduce((sum, data) => sum + data.new_customers, 0)

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
          <Button variant="outline" onClick={fetchReportsData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {tCommon('refresh')}
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>{t('timeRange.label')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">{t('timeRange.currentMonth')}</SelectItem>
              <SelectItem value="last-month">{t('timeRange.lastMonth')}</SelectItem>
              <SelectItem value="last-3-months">{t('timeRange.last3Months')}</SelectItem>
              <SelectItem value="last-6-months">{t('timeRange.last6Months')}</SelectItem>
              <SelectItem value="last-12-months">{t('timeRange.last12Months')}</SelectItem>
              <SelectItem value="current-year">{t('timeRange.currentYear')}</SelectItem>
              <SelectItem value="custom">{t('timeRange.custom')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Range Fields */}
          {timeRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="start-date">{t('customDateRange.startDate')}</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">{t('customDateRange.endDate')}</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
              {!isCustomDateRangeValid() && (
                <div className="md:col-span-2">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('customDateRange.invalidRange')}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              {isCustomDateRangeValid() && customStartDate && customEndDate && (
                <div className="md:col-span-2 text-sm text-muted-foreground">
                  {t('customDateRange.preview', { 
                    start: format(new Date(customStartDate), 'dd.MM.yyyy', { locale: fi }),
                    end: format(new Date(customEndDate), 'dd.MM.yyyy', { locale: fi })
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-8">{t('loadingData')}</div>
      ) : (
        <>
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('metrics.totalCommissions')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCommissions.toFixed(2)} €</div>
                <p className="text-xs text-muted-foreground">
                  {totalCommissionCount} {tCommon('commissions')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('metrics.newCustomers')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalNewCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  {t('timeRange.selectedPeriod')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('metrics.averageCommission')}</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.avg_commission_per_customer.toFixed(2)} €</div>
                <p className="text-xs text-muted-foreground">
                  {t('metrics.perCustomer')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('metrics.growth')}</CardTitle>
                {performanceMetrics.growth_rate >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${performanceMetrics.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {performanceMetrics.growth_rate >= 0 ? '+' : ''}{performanceMetrics.growth_rate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('metrics.comparedToLastMonth')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Commission Trends */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('charts.commissionsOverTime')}</CardTitle>
                <Button variant="outline" size="sm" onClick={exportCommissionReport}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('export.commissions')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {commissionData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('noData')}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Simple table view for commission data */}
                  <div className="grid grid-cols-1 gap-4">
                    {commissionData.map((data, index) => (
                      <div key={data.month} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">
                            {format(new Date(data.month + '-01'), 'MMMM yyyy', { locale: fi })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {data.count} {tCommon('commissions')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{data.amount.toFixed(2)} €</div>
                          <div className="text-sm space-x-2">
                            <Badge variant="success">{data.paid_amount.toFixed(2)} € {tCommon('paid')}</Badge>
                            <Badge variant="secondary">{data.pending_amount.toFixed(2)} € {tCommon('pending')}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Growth */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('charts.customersOverTime')}</CardTitle>
                <Button variant="outline" size="sm" onClick={exportCustomerReport}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('export.customers')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customerData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('noData')}
                </div>
              ) : (
                <div className="space-y-4">
                  {customerData.map((data, index) => (
                    <div key={data.month} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">
                          {format(new Date(data.month + '-01'), 'MMMM yyyy', { locale: fi })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {data.new_customers} {t('metrics.newCustomers').toLowerCase()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{data.total_customers}</div>
                        <div className="text-sm text-muted-foreground">{t('metrics.totalCustomers').toLowerCase()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t('paymentStatus.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{totalPaidAmount.toFixed(2)} €</div>
                  <div className="text-sm text-muted-foreground">{tCommon('paid')}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {totalCommissions > 0 ? ((totalPaidAmount / totalCommissions) * 100).toFixed(1) : '0'}% {t('paymentStatus.ofTotal')}
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{totalPendingAmount.toFixed(2)} €</div>
                  <div className="text-sm text-muted-foreground">{t('paymentStatus.pending')}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {totalCommissions > 0 ? ((totalPendingAmount / totalCommissions) * 100).toFixed(1) : '0'}% {t('paymentStatus.ofTotal')}
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{totalCommissions.toFixed(2)} €</div>
                  <div className="text-sm text-muted-foreground">{t('paymentStatus.total')}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {totalCommissionCount} {tCommon('commissions')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 