import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const authClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const body = await request.json()

    const {
      locale,
      sourcePage,
      businessId,
      companyName,
      email,
      phone,
      calculatorType,
      inputs,
      result,
      createCompany,
      companyPayload,
    } = body || {}

    if (!email || !calculatorType) {
      return NextResponse.json({ error: 'email and calculatorType are required' }, { status: 400 })
    }

    let userId: string | null = null

    // If token present, use it
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user } } = await authClient.auth.getUser(token)
      if (user?.id) userId = user.id
    }

    // If not authenticated, ensure user exists (create/invite if needed)
    if (!userId) {
      try {
        // Try inviting (creates user if not exists and sends email)
        const { data, error } = await admin.auth.admin.inviteUserByEmail(email)
        if (!error && data?.user?.id) {
          userId = data.user.id
        }
        // If error (likely already registered), we proceed without userId
      } catch {
        // ignore; user may already exist
      }
    }

    const { data, error } = await admin
      .from('calculator_leads')
      .insert({
        locale,
        source_page: sourcePage,
        business_id: businessId,
        company_name: companyName,
        email,
        phone,
        calculator_type: calculatorType,
        inputs: inputs ?? {},
        result: result ?? null,
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      console.error('calculator_leads insert failed', error)
      // Continue to upsert contact even if lead insert fails
    }

    // Upsert minimal contact record (customer registry)
    try {
      await admin
        .from('contacts')
        .upsert(
          {
            name: companyName || 'Yritys',
            company: companyName || null,
            email,
            description: 'Calculator submission',
            status: 'new',
            business_id: businessId || null,
            calculator_meta: { calculatorType, inputs, result },
          },
          { onConflict: 'email' }
        )
    } catch (e) {
      console.error('contacts upsert failed', e)
    }

    // If requested, also create a company record and link to user if available
    if (createCompany && companyPayload && (userId || email)) {
      try {
        if (userId) {
          // Authenticated company creation using service role
          const { data: company, error: companyError } = await admin
            .from('companies')
            .upsert(
              {
                name: companyPayload.name || companyName,
                business_id: companyPayload.business_id || businessId || null,
                created_by: userId,
                industry: companyPayload.mainBusinessLine || null,
                address: companyPayload.address || null,
                type: null,
              },
              { onConflict: 'business_id' }
            )
            .select()
            .maybeSingle()

          if (!companyError && company?.id) {
            await admin
              .from('user_companies')
              .upsert(
                { user_id: userId, company_id: company.id, role: 'owner' },
                { onConflict: 'user_id,company_id' }
              )
          }
        } else if (email) {
          // Guest path: create anonymous company (no created_by) with business_id uniqueness
          const { data: company, error: companyError } = await admin
            .from('companies')
            .upsert(
              {
                name: companyPayload.name || companyName,
                business_id: companyPayload.business_id || businessId || null,
                industry: companyPayload.mainBusinessLine || null,
                address: companyPayload.address || null,
                type: null,
              },
              { onConflict: 'business_id' }
            )
            .select()
            .maybeSingle()

          if (companyError) {
            console.error('guest company upsert failed', companyError)
          }
        }
      } catch (e) {
        console.error('company upsert failed', e)
      }
    }

    return NextResponse.json({ success: true, data, userId, invited: !authHeader, leadSaved: !error })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


