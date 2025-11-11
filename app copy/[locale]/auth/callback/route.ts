import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin, pathname } = new URL(request.url)
  const locale = pathname.split('/')[1] || 'en' // Default locale if needed
  
  console.log('[Callback Route] Received Request (Exchange handled by middleware):', { url: request.url })

  // Check for pre-existing error parameters passed directly by Supabase (before middleware exchange attempt)
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')

  if (error || errorCode) {
    console.error('[Callback Route] Received Error Params:', { error, errorCode, errorDescription })
    // Redirect to the standard error page if Supabase indicated an error early
    const errorUrl = new URL(`/${locale}/auth/auth-code-error`, origin)
    if (error) errorUrl.searchParams.set('error', error)
    if (errorCode) errorUrl.searchParams.set('error_code', errorCode)
    if (errorDescription) errorUrl.searchParams.set('error_description', errorDescription)
    return NextResponse.redirect(errorUrl)
  }

  // If the route is reached without an error and without the middleware successfully redirecting,
  // it indicates an unexpected state. Redirect to a generic error page or home.
  console.warn('[Callback Route] Reached unexpectedly (should have been handled by middleware).')
  const fallbackErrorUrl = new URL(`/${locale}/auth/auth-code-error`, origin)
  fallbackErrorUrl.searchParams.set('error', 'unexpected_callback_state')
  fallbackErrorUrl.searchParams.set('error_description', 'Callback route reached in an unexpected state.')
  return NextResponse.redirect(fallbackErrorUrl)
}
