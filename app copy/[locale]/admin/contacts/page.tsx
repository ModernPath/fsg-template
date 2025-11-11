'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
// Removed createClient import as we now use API routes
import { Database } from '@/types/database'
import { format } from 'date-fns'
import { useAdminAuth } from '@/app/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useLoadingWithTimeout } from '@/hooks/useLoadingWithTimeout'
import { useConfirm } from '@/hooks/useConfirm'

type Contact = Database['public']['Tables']['contacts']['Row']

export default function ContactsPage() {
  const t = useTranslations('Admin.contacts')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [error, setError] = useState<string | null>(null)
  const { session, loading: authLoading, isAuthorized } = useAdminAuth({
    redirectOnUnauthorized: true,
    allowInDevelopment: true
  })
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const { loading, startLoading, stopLoading } = useLoadingWithTimeout({
    timeout: 10000,
    onTimeout: () => setError('Request timed out. Please try again.')
  })
  const { confirm, ConfirmComponent } = useConfirm()

  // Removed refs as we now use direct values in API calls

  const fetchContacts = useCallback(async () => {
    if (!session?.access_token) {
      console.log("No access token found, cannot fetch contacts.")
      setError("Authentication token not found.")
      return
    }
    
    try {
      startLoading()
      setError(null)
      
      const response = await fetch('/api/admin/contacts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API Error: ${response.statusText}`)
      }

      const { data } = await response.json()
      setContacts(data || [])
    } catch (err) {
      console.error('Error fetching contacts:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      stopLoading()
    }
  }, [session?.access_token, startLoading, stopLoading])

  useEffect(() => {
    // Only fetch contacts if we're authenticated and authorized
    if (!authLoading && isAuthorized && session?.access_token) {
      fetchContacts()
    }
  }, [authLoading, isAuthorized, session?.access_token]) // Removed fetchContacts from dependencies

  const updateContactStatus = async (id: string, status: string) => {
    if (!session?.access_token) {
      setError("Authentication token not found.")
      return
    }

    try {
      setError(null)
      
      const response = await fetch(`/api/admin/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API Error: ${response.statusText}`)
      }

      // Update local state
      setContacts(prev => prev.map(contact => 
        contact.id === id ? { ...contact, status } : contact
      ))
    } catch (err) {
      console.error('Error updating contact status:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleDelete = async (contactId: string) => {
    const shouldDelete = await confirm({
      title: t('deleteConfirmationTitle', { default: 'Poista yhteydenotto' }),
      message: t('deleteConfirmation', { default: 'Haluatko varmasti poistaa tämän yhteydenoton?' }),
      confirmText: t('delete', { default: 'Poista' }),
      cancelText: t('cancel', { default: 'Peruuta' }),
      variant: 'danger'
    });

    if (!shouldDelete) return;

    try {
      setError(null)
      
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API Error: ${response.statusText}`)
      }

      // Update local state
      setContacts(prev => prev.filter(contact => contact.id !== contactId))
    } catch (err) {
      console.error('Error deleting contact:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  // Show loading while checking auth or fetching contacts
  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner size="lg" text={t('loading')} className="mt-8" />
      </div>
    )
  }

  // Don't render anything while redirecting
  if (!isAuthorized) {
    return null
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={() => fetchContacts()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('table.date')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('table.name')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('table.company')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('table.email')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('table.description')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('table.status')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(contact.created_at), 'PPP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {contact.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {contact.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <a href={`mailto:${contact.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {contact.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="max-w-xs overflow-hidden text-ellipsis">
                        {contact.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <select
                        value={contact.status}
                        onChange={(e) => updateContactStatus(contact.id, e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white text-sm"
                      >
                        <option value="new">{t('status.new')}</option>
                        <option value="in_progress">{t('status.in_progress')}</option>
                        <option value="completed">{t('status.completed')}</option>
                        <option value="archived">{t('status.archived')}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConfirmComponent />
    </div>
  )
} 