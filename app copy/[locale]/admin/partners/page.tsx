'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAdminAuth } from '@/app/hooks/useAdminAuth'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { usePartners, usePartnerMutations } from '@/hooks/usePartners'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  QrCode,
  Copy,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  X
} from 'lucide-react'
import { Link } from '@/app/i18n/navigation'
import { format } from 'date-fns'
import { fi } from 'date-fns/locale'
import type { CreatePartnerRequest } from '@/types/partner'

export default function AdminPartnersPage() {
  const t = useTranslations('AdminPartners')
  const { session, loading: authLoading, isAuthorized } = useAdminAuth({
    redirectOnUnauthorized: true,
    allowInDevelopment: true
  })

  // Filters state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: 'all',
    tier: 'all'
  })

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState<CreatePartnerRequest>({
    name: '',
    email: '',
    phone: '',
    commission_percent: 0,
    tier: 'basic',
    contact_info: {},
    settings: {}
  })

  // Hooks
  const { partners, pagination, loading, error, refetch } = usePartners(filters)
  const { createPartner, deletePartner, generateSignupCode, loading: mutationLoading, error: mutationError } = usePartnerMutations()

  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  const handleCreatePartner = async () => {
    const partner = await createPartner(formData)
    if (partner) {
      setCreateDialogOpen(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        commission_percent: 0,
        tier: 'basic',
        contact_info: {},
        settings: {}
      })
      refetch()
    }
  }

  const handleDeletePartner = async () => {
    if (selectedPartner) {
      const success = await deletePartner(selectedPartner.id)
      if (success) {
        setDeleteDialogOpen(false)
        setSelectedPartner(null)
        refetch()
      }
    }
  }

  const handleGenerateCode = async (partnerId: string) => {
    const result = await generateSignupCode(partnerId)
    if (result) {
      // Copy signup URL to clipboard
      navigator.clipboard.writeText(result.signup_url)
      alert(`${t('messages.codeGenerated')}\n\nKoodi: ${result.partner.signup_code}\nURL: ${result.signup_url}`)
      
      // Refresh the partners list to show the new code
      refetch()
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: t('status.active'), variant: 'default' as const },
      inactive: { label: t('status.inactive'), variant: 'secondary' as const },
      suspended: { label: t('status.suspended'), variant: 'error' as const }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTierBadge = (tier: string) => {
    const tierConfig = {
      basic: { label: t('tier.basic'), variant: 'secondary' as const },
      premium: { label: t('tier.premium'), variant: 'secondary' as const },
      enterprise: { label: t('tier.enterprise'), variant: 'default' as const }
    }
    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.basic
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('description')}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('createPartner')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('filters.status')} ja {t('filters.tier')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                <SelectItem value="active">{t('status.active')}</SelectItem>
                <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                <SelectItem value="suspended">{t('status.suspended')}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.tier}
              onValueChange={(value) => setFilters(prev => ({ ...prev, tier: value, page: 1 }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('filters.tier')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allTiers')}</SelectItem>
                <SelectItem value="basic">{t('tier.basic')}</SelectItem>
                <SelectItem value="premium">{t('tier.premium')}</SelectItem>
                <SelectItem value="enterprise">{t('tier.enterprise')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('title')} ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{t('messages.loading')}</div>
          ) : partners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('messages.notFound')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.partner')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.tier')}</TableHead>
                  <TableHead>{t('table.commission')}</TableHead>
                  <TableHead>{t('table.signupCode')}</TableHead>
                  <TableHead>{t('table.created')}</TableHead>
                  <TableHead>{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{partner.name}</div>
                        <div className="text-sm text-muted-foreground">{partner.email}</div>
                        {partner.phone && (
                          <div className="text-sm text-muted-foreground">{partner.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(partner.status)}</TableCell>
                    <TableCell>{getTierBadge(partner.tier)}</TableCell>
                    <TableCell>{partner.commission_percent}%</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 bg-muted rounded text-sm">
                          {partner.signup_code || t('table.noCode')}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateCode(partner.id)}
                          title={partner.signup_code ? t('messages.codeGenerated') : t('form.tier')}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(partner.created_at), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link href={`/admin/partners/${partner.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/partners/${partner.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPartner(partner)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <Button
              key={i + 1}
              variant={pagination.page === i + 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, page: i + 1 }))}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}

      {/* Create Partner Dialog */}
      {createDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('createPartner')}</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCreateDialogOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Form Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Perustiedot</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('form.name')} *
                    </Label>
                    <Input
                      id="name"
                      placeholder={t('form.namePlaceholder')}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('form.email')} *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('form.emailPlaceholder')}
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('form.phone')}
                      </Label>
                      <Input
                        id="phone"
                        placeholder={t('form.phonePlaceholder')}
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Partnership Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Kumppanuuden tiedot</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="commission" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('form.commission')}
                      </Label>
                      <div className="relative">
                        <Input
                          id="commission"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder={t('form.commissionPlaceholder')}
                          value={formData.commission_percent}
                          onChange={(e) => setFormData(prev => ({ ...prev, commission_percent: parseFloat(e.target.value) || 0 }))}
                          className="w-full pr-8"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tier" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('form.tier')}
                      </Label>
                      <Select
                        value={formData.tier}
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, tier: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('form.tierPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">{t('tier.basic')}</SelectItem>
                          <SelectItem value="premium">{t('tier.premium')}</SelectItem>
                          <SelectItem value="enterprise">{t('tier.enterprise')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Language Preference */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Asetukset</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('form.language')}
                    </Label>
                    <Select
                      value={formData.contact_info?.language_preference || 'fi'}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        contact_info: { ...prev.contact_info, language_preference: value }
                      }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fi">🇫🇮 Suomi (Finnish)</SelectItem>
                        <SelectItem value="en">🇬🇧 English</SelectItem>
                        <SelectItem value="sv">🇸🇪 Svenska (Swedish)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Error Alert */}
            {mutationError && (
              <div className="px-6 pb-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{mutationError}</AlertDescription>
                </Alert>
              </div>
            )}
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <Button 
                variant="outline" 
                onClick={() => setCreateDialogOpen(false)} 
                disabled={mutationLoading}
                className="min-w-[100px]"
              >
                {t('form.cancel')}
              </Button>
              <Button 
                onClick={handleCreatePartner} 
                disabled={mutationLoading || !formData.name || !formData.email}
                className="min-w-[120px]"
              >
                {mutationLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('messages.loading')}
                  </div>
                ) : (
                  t('form.create')
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('dialog.deleteTitle')}
        description={t('dialog.deleteConfirm').replace('{partnerName}', selectedPartner?.name || '')}
        confirmText={t('dialog.deleteConfirm')}
        cancelText={t('form.cancel')}
        onConfirm={handleDeletePartner}
        isLoading={mutationLoading}
        variant="destructive"
      />
    </div>
  )
} 