'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { useAdminUserDetails } from '@/hooks/useAdminQueries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building, 
  FileText, 
  CreditCard,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react'

interface UserDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function UserDetailsModal({ open, onOpenChange, userId }: UserDetailsModalProps) {
  const t = useTranslations('AdminUsers')
  const { session } = useAuth()

  const { 
    data: userDetailsResponse, 
    isLoading, 
    error 
  } = useAdminUserDetails(userId)

  const userDetails = userDetailsResponse?.data

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" text={t('userDetails.loading')} />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !userDetails) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error?.message || t('userDetails.error')}</p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              {t('close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const { profile, auth, createdCompanies, partnerCommissions, recentDocuments, recentFundingApplications, stats } = userDetails

  const getRoleBadge = () => {
    if (profile.is_admin && profile.is_partner) {
      return <Badge variant="destructive">{t('roles.adminPartner')}</Badge>
    } else if (profile.is_admin) {
      return <Badge variant="destructive">{t('roles.admin')}</Badge>
    } else if (profile.is_partner) {
      return <Badge variant="secondary">{t('roles.partner')}</Badge>
    } else {
      return <Badge variant="outline">{t('roles.user')}</Badge>
    }
  }

  const getStatusBadge = () => {
    const isConfirmed = auth?.email_confirmed_at
    const hasSignedIn = auth?.last_sign_in_at
    
    if (isConfirmed && hasSignedIn) {
      return <Badge variant="default" className="bg-green-100 text-green-800">{t('status.active')}</Badge>
    } else if (isConfirmed) {
      return <Badge variant="secondary">{t('status.confirmed')}</Badge>
    } else {
      return <Badge variant="outline">{t('status.unconfirmed')}</Badge>
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('never')
    return new Date(dateString).toLocaleString('fi-FI')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('userDetails.title')}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('userDetails.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="companies">{t('userDetails.tabs.companies')}</TabsTrigger>
            <TabsTrigger value="activity">{t('userDetails.tabs.activity')}</TabsTrigger>
            {profile.is_partner && (
              <TabsTrigger value="commissions">{t('userDetails.tabs.commissions')}</TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('userDetails.basicInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {t('userDetails.fields.email')}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{profile.email}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {t('userDetails.fields.role')}
                    </label>
                    <div className="mt-1">
                      {getRoleBadge()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {t('userDetails.fields.firstName')}
                    </label>
                    <p className="mt-1">{profile.first_name || t('userDetails.noData')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {t('userDetails.fields.lastName')}
                    </label>
                    <p className="mt-1">{profile.last_name || t('userDetails.noData')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {t('userDetails.fields.phone')}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{profile.phone_number || t('userDetails.noData')}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {t('table.status')}
                    </label>
                    <div className="mt-1">
                      {getStatusBadge()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auth Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {t('userDetails.authInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {t('userDetails.fields.created')}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{formatDate(profile.created_at)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {t('userDetails.fields.lastSignIn')}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{formatDate(auth?.last_sign_in_at)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {t('userDetails.fields.emailConfirmed')}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {auth?.email_confirmed_at ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{formatDate(auth.email_confirmed_at)}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>{t('no')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {t('userDetails.fields.id')}
                    </label>
                    <p className="mt-1 font-mono text-sm">{profile.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('userDetails.stats')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Building className="h-4 w-4 text-blue-500" />
                      <span className="text-2xl font-bold">{stats.totalCompanies}</span>
                    </div>
                    <p className="text-sm text-gray-600">{t('userDetails.fields.totalCompanies')}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      <span className="text-2xl font-bold">{stats.totalDocuments}</span>
                    </div>
                    <p className="text-sm text-gray-600">{t('userDetails.fields.totalDocuments')}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-purple-500" />
                      <span className="text-2xl font-bold">{stats.totalFundingApplications}</span>
                    </div>
                    <p className="text-sm text-gray-600">{t('userDetails.fields.totalApplications')}</p>
                  </div>
                  {profile.is_partner && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-yellow-500" />
                        <span className="text-2xl font-bold">{stats.totalCommissions}</span>
                      </div>
                      <p className="text-sm text-gray-600">{t('userDetails.fields.totalCommissions')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {t('userDetails.companies')} ({createdCompanies.length})
                </CardTitle>
                <CardDescription>
                  {t('userDetails.companiesDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {createdCompanies.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">{t('userDetails.noData')}</p>
                ) : (
                  <div className="space-y-3">
                    {createdCompanies.map((company) => (
                      <div key={company.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{company.name}</h4>
                            <p className="text-sm text-gray-500">Y-tunnus: {company.business_id}</p>
                            <p className="text-sm text-gray-500">
                              {t('userDetails.fields.created')}: {formatDate(company.created_at)}
                            </p>
                            {company.partners && (
                              <p className="text-sm text-blue-600">
                                Partneri: {company.partners.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            {/* Recent Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('userDetails.recentDocuments')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentDocuments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">{t('userDetails.noData')}</p>
                ) : (
                  <div className="space-y-2">
                    {recentDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{doc.filename}</p>
                          <p className="text-sm text-gray-500">
                            {doc.document_type} • {doc.companies?.name}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(doc.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Funding Applications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t('userDetails.recentApplications')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentFundingApplications.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">{t('userDetails.noData')}</p>
                ) : (
                  <div className="space-y-2">
                    {recentFundingApplications.map((app) => (
                      <div key={app.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{app.companies?.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(app.amount_requested)} • 
                            <Badge variant="outline" className="ml-2">{app.status}</Badge>
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(app.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab (only for partners) */}
          {profile.is_partner && (
            <TabsContent value="commissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {t('userDetails.partnerCommissions')} ({partnerCommissions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {partnerCommissions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">{t('userDetails.noData')}</p>
                  ) : (
                    <div className="space-y-3">
                      {partnerCommissions.map((commission) => (
                        <div key={commission.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{commission.companies?.name}</p>
                              <p className="text-sm text-gray-500">
                                {formatDate(commission.commission_date)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {formatCurrency(commission.amount)}
                              </p>
                              <Badge 
                                variant={commission.status === 'paid' ? 'default' : 'outline'}
                                className={commission.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                              >
                                {commission.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
