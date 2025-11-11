import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const authClient = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
)

const admin = createClient(
  supabaseUrl,
  serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      result
    } = body || {}

    if (!email || !calculatorType) {
      return NextResponse.json({ error: 'email and calculatorType are required' }, { status: 400 })
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
        status: 'new'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


