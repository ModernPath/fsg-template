'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Link } from '@/app/i18n/navigation'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { useAdminAuth } from '@/app/hooks/useAdminAuth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert } from "@/components/ui/alert"
import { PlusCircle, AlertTriangle } from 'lucide-react'

// Temporary type, replace with actual type from regenerated supabase types
type FinancingProvider = any

export default function AdminFinancingProvidersPage() {
  const t = useTranslations('Admin.Lenders') // Use new Lenders namespace
  const { session, hasAdminAccess, loading: authLoading, isAuthorized } = useAdminAuth()
  const [providers, setProviders] = useState<FinancingProvider[]>([]) // Use provider naming
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const fetchProviders = useCallback(async () => { // Use provider naming
    if (!session?.access_token) {
      console.log("No access token found, cannot fetch admin data.");
      setError(t('errors.noToken'));
      setLoading(false);
      return;
    }

    setLoading(true)
    setError(null)
    try {
      console.log("Fetching financing providers from API...")
      // Revert API path
      const response = await fetch('/api/admin/financing-providers', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.statusText}`);
      }

      const { data } = await response.json();
      console.log("API Response Data:", data)
      setProviders((data as FinancingProvider[]) || []) // Use provider naming
    } catch (err) {
      console.error('Error fetching financing providers from API:', err) // Use provider naming
      setError(err instanceof Error ? err.message : t('errors.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, t])

  useEffect(() => {
    if (!authLoading && isAuthorized) {
      fetchProviders()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading, isAuthorized]) // Removed fetchProviders from dependencies

  if (authLoading || loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-white">{t('title')}</h1>
        {/* Revert route path */}
        <Link href="/admin/financing-providers/new" className="inline-flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" /> {t('actions.add')}
        </Link>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
           <AlertTriangle className="h-4 w-4" />
           <p className="font-semibold">{t('errors.title')}</p>
           <p>{error}</p>
        </Alert>
      )}

      <Table>
        <TableCaption>{t('tableCaption')}</TableCaption>
        <TableHeader>
          <TableRow className="border-neutral-700 hover:bg-secondary/10">
            <TableHead className="text-white">{t('headers.name')}</TableHead>
            <TableHead className="text-white">{t('headers.type')}</TableHead>
            <TableHead className="text-white">Kategoria</TableHead>
            <TableHead className="text-white">Prioriteetti</TableHead>
            <TableHead className="text-white">Aktiivinen</TableHead>
            <TableHead className="text-white">Tagit</TableHead>
            <TableHead className="text-white">{t('headers.createdAt')}</TableHead>
            <TableHead className="text-right text-white">{t('headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Use provider naming */}
          {providers.length === 0 && !loading ? (
             <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-4">
                  {/* Use key from Lenders namespace */}
                  {t('noLendersFound')}
                </TableCell>
             </TableRow>
          ) : (
            providers.map((provider) => (
              <TableRow key={provider.id} className="border-neutral-800 hover:bg-secondary/5">
                <TableCell className="font-medium text-foreground">
                    {/* Revert route path */}
                   <Link href={`/admin/financing-providers/${provider.id}`} className="hover:underline">
                     {provider.name}
                   </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {provider.type}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {provider.category || 'general'}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    provider.priority <= 3 ? 'bg-green-100 text-green-800' :
                    provider.priority <= 6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {provider.priority || 1}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    provider.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {provider.is_active !== false ? 'Aktiivinen' : 'Ei aktiivinen'}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {provider.tags && Array.isArray(provider.tags) && provider.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {provider.tags.slice(0, 2).map((tag: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {tag}
                        </span>
                      ))}
                      {provider.tags.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{provider.tags.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{provider.created_at ? format(new Date(provider.created_at), 'yyyy-MM-dd HH:mm') : 'N/A'}</TableCell>
                <TableCell className="text-right">
                  {/* Revert route path */}
                  <Link 
                    href={`/admin/financing-providers/${provider.id}`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  >
                    {t('actions.edit')}
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 