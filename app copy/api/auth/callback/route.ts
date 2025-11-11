import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      try {
        // Get user profile to check partner status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_partner, partner_id, is_admin')
          .eq('id', data.user.id)
          .single()

        console.log('Auth callback - User profile:', { 
          userId: data.user.id,
          email: data.user.email,
          profileError: profileError?.message,
          profile: profile ? {
            isPartner: profile.is_partner,
            partnerId: profile.partner_id,
            isAdmin: profile.is_admin
          } : null,
          userMetadata: data.user.user_metadata
        })

        // Determine redirect URL based on user type
        let redirectUrl = next || `${requestUrl.origin}/fi/dashboard`

        // Check both profile data and user metadata for compatibility
        const isPartner = profile?.is_partner || data.user.user_metadata?.is_partner || false
        const partnerId = profile?.partner_id || data.user.user_metadata?.partner_id || null
        const isAdmin = profile?.is_admin || data.user.user_metadata?.is_admin || false

        if (isPartner && partnerId) {
          // Partner user - redirect to partner dashboard
          console.log(`✅ Partner user ${data.user.email || 'unknown'} redirecting to partner dashboard`)
          redirectUrl = `${requestUrl.origin}/fi/partner/dashboard`
        } else if (isAdmin) {
          // Admin user - redirect to admin dashboard  
          console.log(`✅ Admin user ${data.user.email || 'unknown'} redirecting to admin dashboard`)
          redirectUrl = next || `${requestUrl.origin}/fi/admin`
        } else {
          // Regular customer - redirect to main dashboard or onboarding
          console.log(`✅ Customer user ${data.user.email || 'unknown'} redirecting to customer dashboard`)
          redirectUrl = next || `${requestUrl.origin}/fi/dashboard`
        }

        // Send welcome email for new customers (only if not partner or admin)
        if (!isPartner && !isAdmin && data.user.email) {
          try {
            const welcomeResponse = await fetch(`${requestUrl.origin}/api/auth/webhook/customer-welcome`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
                company: data.user.user_metadata?.company || 'Yrityksesi'
              })
            })
            
            if (welcomeResponse.ok) {
              console.log(`✅ Customer welcome email queued for ${data.user.email}`)
            } else {
              console.error('⚠️ Failed to queue customer welcome email')
            }
          } catch (emailError) {
            console.error('⚠️ Error queuing customer welcome email:', emailError)
          }

          // Create auto survey invitation for new customers
          try {
            const surveyResponse = await fetch(`${requestUrl.origin}/api/surveys/invitations/auto`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: data.user.id,
                email: data.user.email,
                company_id: profile?.company_id
              })
            })
            
            if (surveyResponse.ok) {
              const surveyData = await surveyResponse.json()
              console.log(`✅ Auto survey invitation created for ${data.user.email}:`, surveyData.invitation.token)
            } else {
              console.error('⚠️ Failed to create auto survey invitation')
            }
          } catch (surveyError) {
            console.error('⚠️ Error creating auto survey invitation:', surveyError)
          }
        }

        console.log(`🔄 Redirecting to: ${redirectUrl}`)
        return NextResponse.redirect(redirectUrl)

      } catch (error) {
        console.error('Error in auth callback:', error)
        // Fallback redirect on error
        const fallbackUrl = next || `${requestUrl.origin}/fi/dashboard`
        console.log(`⚠️ Fallback redirect to: ${fallbackUrl}`)
        return NextResponse.redirect(fallbackUrl)
      }
    } else {
      console.error('Auth callback error:', error)
    }
  }

  // Default redirect if no code or auth failed
  const defaultUrl = next || `${requestUrl.origin}/fi`
  console.log(`🔄 Default redirect to: ${defaultUrl}`)
  return NextResponse.redirect(defaultUrl)
} 