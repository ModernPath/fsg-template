'use client'

import React, { useState } from 'react'
import { Link } from '@/app/i18n/navigation'
import { useRouter, useParams } from 'next/navigation'
import { Database } from '@/types/supabase'
import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'
import { useAdminAuth } from '@/app/hooks/useAdminAuth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/use-toast'
import { useAdminCompanies, useDeleteCompany } from '@/hooks/useAdminQueries'
import { RefreshCw } from 'lucide-react'

// Update type to expect creator_email directly
type CompanyWithCreatorEmail = Database['public']['Tables']['companies']['Row'] & {
  creator_email: string | null
}

export default function AdminCompaniesPage() {
  const t = useTranslations('Admin.Companies')
  const { session, loading: authLoading, isAuthorized } = useAdminAuth({
    redirectOnUnauthorized: true,
    allowInDevelopment: false
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<CompanyWithCreatorEmail | null>(null)
  
  // Bulk actions state
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const { toast } = useToast()

  // React Query hooks
  const { 
    data: companiesData, 
    isLoading: loading, 
    error: queryError,
    refetch 
  } = useAdminCompanies(session?.access_token)
  
  const deleteCompanyMutation = useDeleteCompany()

  // Extract companies from query data
  const companies = companiesData?.data || []
  const error = queryError?.message || null

  // Refresh handler
  const handleRefresh = () => {
    refetch()
  }

  const handleDeleteClick = (company: CompanyWithCreatorEmail) => {
    setCompanyToDelete(company)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!companyToDelete || !session?.access_token) return

    try {
      await deleteCompanyMutation.mutateAsync({
        companyId: companyToDelete.id,
        accessToken: session.access_token
      })
      
      toast({
        title: t('deleteSuccess'),
        description: `${companyToDelete.name} has been deleted`,
      })
      
      setDeleteDialogOpen(false)
      setCompanyToDelete(null)
    } catch (err) {
      console.error('Error deleting company:', err)
      toast({
        title: t('deleteError'),
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive',
      })
    }
  }

  // Bulk actions handlers
  const toggleCompanySelection = (companyId: string) => {
    const newSelection = new Set(selectedCompanyIds)
    if (newSelection.has(companyId)) {
      newSelection.delete(companyId)
    } else {
      newSelection.add(companyId)
    }
    setSelectedCompanyIds(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedCompanyIds.size === companies.length) {
      setSelectedCompanyIds(new Set())
    } else {
      setSelectedCompanyIds(new Set(companies.map(c => c.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCompanyIds.size === 0 || !session?.access_token) return
    
    if (!confirm(`Are you sure you want to delete ${selectedCompanyIds.size} company(ies)?`)) {
      return
    }

    try {
      setIsBulkDeleting(true)
      let successCount = 0
      let errorCount = 0

      for (const companyId of selectedCompanyIds) {
        try {
          await deleteCompanyMutation.mutateAsync({
            companyId,
            accessToken: session.access_token
          })
          successCount++
        } catch (err) {
          errorCount++
          console.error(`Failed to delete company ${companyId}:`, err)
        }
      }

      toast({
        title: 'Bulk Delete Complete',
        description: `Deleted ${successCount} company(ies). Failed: ${errorCount}`,
        variant: errorCount > 0 ? 'destructive' : 'default'
      })
      
      setSelectedCompanyIds(new Set())
      await refetch()
    } catch (err) {
      console.error('Bulk delete error:', err)
      toast({
        title: 'Bulk Delete Error',
        description: 'Failed to delete companies',
        variant: 'destructive',
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const clearSelection = () => {
    setSelectedCompanyIds(new Set())
  }

  // React Query handles data fetching automatically

  if (authLoading || loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>
  }

  if (!isAuthorized) {
    return null;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading companies: {error}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-[#FFD700]">{t('title')}</h1>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedCompanyIds.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border-2 border-blue-500 rounded-lg flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-blue-900 dark:text-blue-100">
              ✓ {selectedCompanyIds.size} company(ies) selected
            </span>
            <Button
              onClick={clearSelection}
              variant="outline"
              size="sm"
            >
              Clear Selection
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              variant="destructive"
              size="sm"
            >
              {isBulkDeleting ? 'Deleting...' : '🗑️ Delete Selected'}
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableCaption className="text-[#A9A9A9]">{t('tableCaption')}</TableCaption>
        <TableHeader>
          <TableRow className="border-neutral-700">
            <TableHead className="w-12 text-[#FFD700]">
              <input
                type="checkbox"
                checked={selectedCompanyIds.size === companies.length && companies.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 cursor-pointer"
              />
            </TableHead>
            <TableHead className="text-[#FFD700]">{t('headers.name')}</TableHead>
            <TableHead className="text-[#FFD700]">{t('headers.creatorEmail')}</TableHead>
            <TableHead className="text-[#FFD700]">{t('headers.createdAt')}</TableHead>
            <TableHead className="text-right text-[#FFD700]">{t('headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.length === 0 && !loading ? (
             <TableRow>
                <TableCell colSpan={5} className="text-center text-neutral-400 py-4">
                  No companies found.
                </TableCell>
             </TableRow>
          ) : (
            companies.map((company) => (
              <TableRow key={company.id} className="border-neutral-800 hover:bg-[#111111]">
                <TableCell className="text-center">
                  <input
                    type="checkbox"
                    checked={selectedCompanyIds.has(company.id)}
                    onChange={() => toggleCompanySelection(company.id)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </TableCell>
                <TableCell className="font-medium text-[#F0E68C]">
                  <Link href={`/admin/companies/${company.id}`} className="text-[#FFD700] hover:text-[#FFFFE0]">
                    {company.name}
                  </Link>
                </TableCell>
                {/* Display creator_email directly */}
                <TableCell className="text-[#F0E68C]">{company.creator_email ?? t('creatorUnknown')}</TableCell>
                <TableCell className="text-[#F0E68C]">{company.created_at ? format(new Date(company.created_at), 'yyyy-MM-dd HH:mm') : 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/companies/${company.id}`} className="text-[#FFD700] hover:text-[#FFFFE0] hover:underline">
                      {t('viewDetails')}
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(company)}
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('deleteConfirmTitle')}
        description={t('deleteConfirmMessage')}
        confirmText={t('deleteConfirm')}
        cancelText={t('deleteCancel')}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteCompanyMutation.isPending}
        variant="destructive"
      />
    </div>
  )
} 