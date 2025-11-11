import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  console.log('\n📝 [GET /api/admin/users]', {
    headers: Object.fromEntries(request.headers),
    url: request.url
  })

  try {
    // 1. Verify authentication & admin role
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header')
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    console.log('🔑 Creating auth client...')
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )

    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('✅ User authenticated:', user.id)

    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      console.error('🚫 User is not an admin:', user.id)
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
    console.log('🔑 User verified as admin:', user.id)

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || '' // admin, partner, user
    const offset = (page - 1) * limit

    console.log('📊 Query params:', { page, limit, search, role, offset })

    // 3. Create service role client for database operations
    console.log('🔑 Creating service role client...')
    const supabase = await createClient(undefined, true)

    // 4. Build query for users with profiles
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone_number,
        is_admin,
        is_partner,
        partner_id,
        company_id,
        created_at,
        updated_at,
        partners:partner_id(id, name, email)
      `)
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    }

    // Apply role filter
    if (role === 'admin') {
      query = query.eq('is_admin', true)
    } else if (role === 'partner') {
      query = query.eq('is_partner', true)
    } else if (role === 'user') {
      query = query.eq('is_admin', false).eq('is_partner', false)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    console.log('📊 Executing users query...')
    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // 5. Prepare for enriching users with company and auth data

    // 6. Get total count for pagination
    let countQuery = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    }

    if (role === 'admin') {
      countQuery = countQuery.eq('is_admin', true)
    } else if (role === 'partner') {
      countQuery = countQuery.eq('is_partner', true)
    } else if (role === 'user') {
      countQuery = countQuery.eq('is_admin', false).eq('is_partner', false)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('❌ Error getting count:', countError)
    }

    // 6. Get auth user details for each profile
    const userIds = users?.map(u => u.id) || []
    const authUsers = []

    if (userIds.length > 0) {
      console.log('📊 Fetching auth user details...')
      for (const userId of userIds) {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(userId)
          if (authUser.user) {
            authUsers.push({
              id: authUser.user.id,
              email: authUser.user.email,
              created_at: authUser.user.created_at,
              last_sign_in_at: authUser.user.last_sign_in_at,
              email_confirmed_at: authUser.user.email_confirmed_at,
              phone_confirmed_at: authUser.user.phone_confirmed_at
            })
          }
        } catch (error) {
          console.error(`❌ Error fetching auth user ${userId}:`, error)
        }
      }
    }

    // 7. Merge profile, auth data, and company data
    const enrichedUsers = await Promise.all(
      (users || []).map(async (profile) => {
        const authUser = authUsers.find(au => au.id === profile.id)
        
        // Get company data if user has company_id
        let company = null
        if (profile.company_id) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('id, name, business_id')
            .eq('id', profile.company_id)
            .single()
          company = companyData
        }
        
        return {
          ...profile,
          company,
          auth: authUser || null
        }
      })
    )

    console.log('✅ Successfully fetched users:', enrichedUsers.length)

    return NextResponse.json({
      data: enrichedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: {
        search,
        role
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  console.log('\n📝 [POST /api/admin/users] Creating new user')

  try {
    // 1. Verify authentication & admin role
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // 2. Parse request body
    const {
      email,
      password,
      first_name,
      last_name,
      phone_number,
      is_admin = false,
      is_partner = false,
      send_email = true
    } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('👤 Creating user:', { email, is_admin, is_partner })

    // 3. Create service role client
    const supabase = await createClient(undefined, true)

    // 4. Create auth user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: !send_email, // Skip email confirmation if not sending email
      user_metadata: {
        first_name,
        last_name,
        is_admin,
        is_partner
      }
    })

    if (createError) {
      console.error('❌ Error creating user:', createError)
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      )
    }

    console.log('✅ User created successfully:', newUser.user?.id)

    // 5. The profile should be created automatically by the trigger
    // Wait a moment and then fetch the profile
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { data: createdProfile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone_number,
        is_admin,
        is_partner,
        created_at
      `)
      .eq('id', newUser.user!.id)
      .single()

    if (profileError) {
      console.error('❌ Error fetching created profile:', profileError)
    }

    return NextResponse.json({
      data: {
        ...createdProfile,
        auth: {
          id: newUser.user!.id,
          email: newUser.user!.email,
          created_at: newUser.user!.created_at,
          email_confirmed_at: newUser.user!.email_confirmed_at
        }
      },
      message: 'User created successfully'
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
