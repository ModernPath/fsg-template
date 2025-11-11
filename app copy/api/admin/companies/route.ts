import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/supabase'

// Type for the final combined data structure
type CompanyWithCreatorEmail = Database['public']['Tables']['companies']['Row'] & {
  creator_email: string | null // Expect email fetched via profiles
}

export async function GET(request: Request) {
  try {
    // 1. Token Verification & Admin Check (remains the same)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.split(' ')[1])
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profileAdminCheck, error: profileError } = await authClient
      .from('profiles')
      .select('id, is_admin')
      .eq('id', user.id) // Check profiles.id against auth.users.id
      .single()
    if (profileError) {
      console.error(`API Route: Error fetching profile for admin check:`, profileError);
    }
    if (!profileAdminCheck?.is_admin) {
      console.log(`API Route: User ${user.id} is not admin. Denying access.`);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }
    console.log(`API Route: User ${user.id} confirmed as admin.`);

    // 3. Service Role Operations Layer
    const supabase = await createClient(undefined, true)
    console.log('Fetching companies with service role...');

    // Step 1: Fetch companies with timeout protection
    const companiesResult = await Promise.race([
      supabase
        .from('companies')
        .select(`*`)
        .order('created_at', { ascending: false }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Companies query timeout after 15 seconds')), 15000)
      )
    ]);

    if (companiesResult.error) {
      console.error('Supabase error fetching companies:', companiesResult.error);
      throw companiesResult.error;
    }

    const companiesData = companiesResult.data;

    if (!companiesData || companiesData.length === 0) {
       console.log('No companies found.');
       return NextResponse.json({ data: [] });
    }

    // Step 2: Extract unique creator IDs (which are public.users IDs)
    const creatorUserIds = [...new Set(companiesData.map(c => c.created_by).filter(id => id !== null))] as string[];

    let userEmailMap: Record<string, string | null> = {};

    // Step 3: Fetch emails from profiles table using user_id
    if (creatorUserIds.length > 0) {
      console.log(`Fetching profiles for ${creatorUserIds.length} creator user IDs...`);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles') // Query the public.profiles table
        .select('id, email') // Select id (the FK to auth.users) and email
        .in('id', creatorUserIds); // Filter by profiles.id matching creatorUserIds (which are auth.users.id)

      if (profilesError) {
        console.error('Supabase error fetching creator profiles:', profilesError);
        // Continue without emails if this step fails
      } else if (profilesData) {
        userEmailMap = profilesData.reduce((acc, profile) => {
          if (profile.id) { // Ensure profile.id is not null
             acc[profile.id] = profile.email; // Map using profile.id
          }
          return acc;
        }, {} as Record<string, string | null>);
        console.log('Successfully fetched creator emails from profiles.');
      }
    }

    // Step 4: Combine data
    const combinedData: CompanyWithCreatorEmail[] = companiesData.map(company => ({
      ...company,
      // Use the map based on company.created_by (which links to profiles.id)
      creator_email: company.created_by ? (userEmailMap[company.created_by] ?? null) : null
    }));

    console.log(`Successfully processed ${combinedData.length} companies.`);
    return NextResponse.json({ data: combinedData })

  } catch (err: any) {
    console.error('Error in /api/admin/companies:', err);
    return NextResponse.json(
      { error: `Failed to fetch companies: ${err.message || 'Internal server error'}` },
      { status: 500 }
    )
  }
} 