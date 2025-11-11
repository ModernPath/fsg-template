'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/utils/supabase/client'

export default function AdminTestPage() {
  const { user } = useAuth()
  const [partnersData, setPartnersData] = useState<any>(null)
  const [partnersError, setPartnersError] = useState<string | null>(null)
  const [apiTest, setApiTest] = useState<any>(null)

  useEffect(() => {
    // Test Partners API
    const testPartnersAPI = async () => {
      try {
        const supabase = createClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.access_token) {
          setPartnersError('No valid session found')
          return
        }

        const response = await fetch('/api/partners', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          setPartnersError(`${response.status}: ${errorData.error}`)
          return
        }
        
        const data = await response.json()
        setPartnersData(data)
      } catch (error) {
        setPartnersError(`Network error: ${error}`)
      }
    }

    // Test general API endpoint
    const testAPI = async () => {
      try {
        const supabase = createClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.access_token) {
          console.log('No valid session for debug API test')
          return
        }

        const response = await fetch('/api/debug-auth', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setApiTest(data)
        }
      } catch (error) {
        console.log('Debug auth API not available')
      }
    }

    if (user) {
      testPartnersAPI()
      testAPI()
    }
  }, [user])

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">Admin Test & Debug</h1>
      
      <div className="grid gap-6">
        {/* User Info */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">User Authentication</h2>
          {user ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Role:</strong> {user.role || 'No role'}</p>
              <p><strong>Is Admin:</strong> {user.user_metadata?.is_admin ? 'Yes' : 'No'}</p>
              <p><strong>Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
              <details className="mt-4">
                <summary>Raw User Data</summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-red-600">Not authenticated</p>
          )}
        </div>

        {/* API Test */}
        {apiTest && (
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">API Test Results</h2>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(apiTest, null, 2)}
            </pre>
          </div>
        )}

        {/* Partners API */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Partners API Test</h2>
          {partnersError ? (
            <div className="text-red-600">
              <p><strong>Error:</strong> {partnersError}</p>
            </div>
          ) : partnersData ? (
            <div className="space-y-2">
              <p><strong>Status:</strong> Success</p>
              <p><strong>Partners Count:</strong> {partnersData.partners?.length || 0}</p>
              <p><strong>Pagination:</strong> Page {partnersData.pagination?.page} of {partnersData.pagination?.pages}</p>
              <details className="mt-4">
                <summary>Raw API Response</summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-96">
                  {JSON.stringify(partnersData, null, 2)}
                </pre>
              </details>
            </div>
          ) : user ? (
            <p>Loading...</p>
          ) : (
            <p className="text-gray-600">Please authenticate to test API</p>
          )}
        </div>

        {/* Translation Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Translation Test</h2>
          <div className="space-y-2">
            <p><strong>Current Locale:</strong> {typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'Unknown'}</p>
            {/* <p><strong>Admin Partners Title:</strong> {t('admin.partners.title')}</p> */}
          </div>
        </div>
      </div>
    </div>
  )
} 