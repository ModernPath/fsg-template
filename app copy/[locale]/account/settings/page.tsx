'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import LocaleSwitcher from '@/app/components/LocaleSwitcher'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CompanyForm from '../../../components/account/CompanyForm'
import CompanyManager from '../../../components/account/CompanyManager'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    locale: string
  }>
}

export default function SettingsPage({ params }: Props) {
  const { locale } = use(params)
  const router = useRouter()
  const t = useTranslations('Account.settings')
  const { session, loading } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const supabase = createClientComponentClient()

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch profile data directly from the database
  useEffect(() => {
    async function loadProfileFromDatabase() {
      if (!session?.user?.id) return;
      
      try {
        setIsLoadingProfile(true);
        // Fetch profile data directly from the database
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone_number, email')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile from database:', error);
        } else if (data) {
          console.log('Successfully loaded profile from database:', data);
          // Use database values for form fields
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setPhoneNumber(data.phone_number || '');
          setEmail(data.email || '');
        }
      } catch (error) {
        console.error('Unexpected error loading profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    
    loadProfileFromDatabase();
  }, [session?.user?.id, supabase]);

  // Initialize user metadata as fallback
  useEffect(() => {
    // Only use metadata as fallback if database hasn't loaded yet
    if (isLoadingProfile) {
      if (session?.user?.user_metadata?.first_name) {
        setFirstName(session.user.user_metadata.first_name);
      }
      if (session?.user?.user_metadata?.last_name) {
        setLastName(session.user.user_metadata.last_name);
      }
      if (session?.user?.user_metadata?.phone_number) {
        setPhoneNumber(session.user.user_metadata.phone_number);
      }
      if (session?.user?.user_metadata?.email || session?.user?.email) {
        setEmail(session.user.user_metadata?.email || session.user.email || '');
      }
    }
  }, [session, isLoadingProfile])

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      router.replace(`/${locale}/auth/sign-in?next=${encodeURIComponent(`/${locale}/account/settings`)}`)
    }
  }, [session, loading, router, locale])

  /**
   * Handles form submission to update profile data
   * Uses a two-step approach:
   * 1. Server-side API updates both auth.users metadata and profiles table
   * 2. Page reload to refresh JWT/session with updated user metadata
   */
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving || !session?.user || !session.access_token) {
      if (!session?.access_token) {
        console.error('Access token not available for profile update.')
      }
      return
    }
    
    try {
      setIsSaving(true)
      const derivedFullName = `${firstName} ${lastName}`.trim()

      // Data to be sent to both metadata and profiles update      
      const commonProfileData = {
        full_name: derivedFullName,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        email: email
      }

      // 1. Update user metadata via server-side API
      const metadataResponse = await fetch('/api/auth/update-metadata', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ user_metadata: commonProfileData })
      })

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json()
        console.error('Error updating user metadata via API:', metadataResponse.status, errorData)
        setIsSaving(false)
        // TODO: Show user-facing error based on errorData
        return
      }

      const updatedUser = await metadataResponse.json()
      console.log('Successfully updated user metadata via API. Response:', updatedUser)
      
      // 2. Update profiles table via API
      const profilesResponse = await fetch('/api/profiles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(commonProfileData)
      })

      if (!profilesResponse.ok) {
        const errorData = await profilesResponse.json()
        console.error('Error updating profile via API:', profilesResponse.status, errorData)
        setIsSaving(false)
        // TODO: Show user-facing error based on errorData
        return
      }

      console.log('Profile table updated successfully via API.')
      
      // 3. Reload the page to get a fresh session with updated JWT containing new user_metadata
      // This is more reliable than trying to manually refresh the session client-side
      console.log('Profile data successfully updated. Scheduling page reload to refresh session data...');
      setTimeout(() => {
        // Force a complete hard reload with cache busting to ensure we get a fresh session
        const cacheBuster = new Date().getTime();
        window.location.href = `/${locale}/account/settings?t=${cacheBuster}`;
      }, 1000);
    } catch (error) {
      console.error('Unexpected error updating profile:', error)
      setIsSaving(false)
      // TODO: Show user-facing error
    }
  }

  // Show loading state while checking auth or before client-side hydration
  if (loading || !isClient || isLoadingProfile) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-6">
            <Card className="p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded w-1/4"></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
          <TabsTrigger value="company">{t('company.title')}</TabsTrigger>
          <TabsTrigger value="preferences">{t('preferences')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t('profile')}</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="firstName">{t('firstName')}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('firstNamePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="lastName">{t('lastName')}</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('lastNamePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">{t('phoneNumber')}</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t('phoneNumberPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {isSaving ? t('saving') : t('save')}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <CompanyManager />
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Muokkaa aktiivisen yrityksen tietoja</h2>
            <CompanyForm />
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t('preferences')}</h2>
            <div className="space-y-4">
              <div>
                <Label>{t('language')}</Label>
                <LocaleSwitcher />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 