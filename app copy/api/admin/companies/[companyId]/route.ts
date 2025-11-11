import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/supabase'
import { NextRequest } from 'next/server'

// Define types matching the enhanced API response
// Use 'any' for related types temporarily due to potential Supabase type issues
type FinancingNeed = any // Database['public']['Tables']['financing_needs']['Row']
type FundingRecommendation = any // Database['public']['Tables']['funding_recommendations']['Row']
type FundingApplication = any // Database['public']['Tables']['funding_applications']['Row']
type LenderApplication = any // Database['public']['Tables']['lender_applications']['Row']
type FinancingOffer = any // Database['public']['Tables']['financing_offers']['Row']
type Document = any // Document type

// Type for the final combined data structure
type CompanyWithDetails = Database['public']['Tables']['companies']['Row'] & {
  creator_email: string | null // Expect email fetched via profiles
  financing_needs: FinancingNeed[] // Array of related needs
  funding_recommendations: FundingRecommendation[] // Array of related recommendations
  funding_applications: (FundingApplication & {
    lender_applications: (LenderApplication & {
      lender: any // Lender details
      financing_offers: FinancingOffer[] // Array of offers for this lender application
    })[]
  })[] // Array of related applications with nested lender applications and offers
  documents: Document[] // Array of company documents
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;

  try {
    // 1. Token Verification & Admin Check (identical to list route)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('API Route [companyId]: Missing or invalid authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.split(' ')[1])
    if (authError || !user) {
       console.error('API Route [companyId]: Auth error', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profileAdminCheck, error: profileError } = await authClient
      .from('profiles')
      .select('id, is_admin')
      .eq('id', user.id) // profiles.id links to auth.users.id
      .single()
    if (profileError) {
      console.error(`API Route [companyId]: Error fetching profile for admin check:`, profileError);
      // Allow continuing but log error, handle downstream if needed
    }
    if (!profileAdminCheck?.is_admin) {
      console.log(`API Route [companyId]: User ${user.id} is not admin. Denying access.`);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }
    console.log(`API Route [companyId]: User ${user.id} confirmed as admin for company ${companyId}.`);

    // 2. Service Role Operations Layer
    const supabase = await createClient(undefined, true)
    console.log(`Fetching company ${companyId} with details and service role...`);

    // Step 1: Fetch the specific company and its related data
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select(`
        *,
        financing_needs (*),
        funding_recommendations (*),
        funding_applications (
          *,
          lender_applications (
            *,
            financing_offers (*)
          )
        )
      `)
      .eq('id', companyId)
      .single(); // Expecting only one company

    if (companyError) {
      console.error(`Supabase error fetching company ${companyId}:`, companyError);
      if (companyError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      throw companyError;
    }

    if (!companyData) {
       console.log(`Company ${companyId} not found.`);
       return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Step 1.5: Fetch company documents using service role
    console.log(`Fetching documents for company ${companyId}...`);
    const { data: documentsData, error: documentsError } = await supabase
      .from('documents')
      .select(`
        *,
        document_types:document_type_id (
          id,
          name,
          description,
          is_system_generated,
          required_for_analysis
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (documentsError) {
      console.error(`Error fetching documents for company ${companyId}:`, documentsError);
      // Continue without documents rather than failing
    }

    console.log(`Found ${documentsData?.length || 0} documents for company ${companyId}`);

    // Step 2: Fetch lender details separately due to type mismatch
    const lenderIds = companyData.funding_applications
      ?.flatMap((app: any) => app.lender_applications || [])
      ?.map((la: any) => la.lender_id)
      ?.filter((id: any) => id) || [];

    let lendersMap: Record<string, any> = {};
    if (lenderIds.length > 0) {
      const { data: lendersData, error: lendersError } = await supabase
        .from('lenders')
        .select('*')
        .in('id', lenderIds.map((id: string) => id)); // Convert text IDs to match UUID

      if (lendersError) {
        console.error('Error fetching lenders:', lendersError);
        // Continue without lender data rather than failing
      } else if (lendersData) {
        lendersMap = lendersData.reduce((acc: Record<string, any>, lender: any) => {
          acc[lender.id] = lender;
          return acc;
        }, {});
      }
    }

    let creatorEmail: string | null = null;

    // Step 3: Fetch creator email from profiles table using company's created_by (links to profiles.id)
    if (companyData.created_by) {
      console.log(`Fetching profile for creator ID ${companyData.created_by}...`);
      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', companyData.created_by) // Filter by profiles.id
        .single();

      if (profileFetchError) {
        console.error(`Supabase error fetching creator profile ${companyData.created_by}:`, profileFetchError);
        // Continue without email if this step fails, but log it
      } else if (profileData) {
        creatorEmail = profileData.email;
        console.log(`Successfully fetched email for creator ${companyData.created_by}.`);
      } else {
        console.log(`No profile found for creator ID ${companyData.created_by}.`);
      }
    } else {
        console.log(`Company ${companyId} has no created_by ID.`);
    }

    // Step 4: Combine data into the final structure
    // Ensure related fields are arrays, even if null/undefined from the query
    const combinedData: CompanyWithDetails = {
      ...companyData,
      creator_email: creatorEmail,
      financing_needs: companyData.financing_needs ?? [],
      funding_recommendations: companyData.funding_recommendations ?? [],
      funding_applications: (companyData.funding_applications ?? []).map((app: any) => ({
        ...app,
        lender_applications: (app.lender_applications ?? []).map((lenderApp: any) => ({
          ...lenderApp,
          lender: lendersMap[lenderApp.lender_id] ?? null,
          financing_offers: lenderApp.financing_offers ?? []
        }))
      })),
      documents: documentsData ?? [], // Add documents to the response
    };

    console.log(`Successfully fetched details for company ${companyId}.`);
    return NextResponse.json({ data: combinedData })

  } catch (err: any) {
    console.error('Error in GET /api/admin/companies/[companyId]:', err);
    return NextResponse.json(
      { error: `Failed to fetch company details: ${err.message || 'Internal server error'}` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;

  try {
    // 1. Token Verification & Admin Check
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
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error(`API Route: Error fetching profile for admin check:`, profileError);
    }
    
    if (!profileAdminCheck?.is_admin) {
      console.log(`API Route: User ${user.id} is not admin. Denying access.`);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }
    
    console.log(`API Route: User ${user.id} confirmed as admin. Proceeding with company deletion.`);

    // 2. Service Role Operations Layer
    const supabase = await createClient(undefined, true)
    
    // First check if company exists
    const { data: existingCompany, error: checkError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()
    
    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      throw checkError;
    }

    console.log(`Deleting company: ${existingCompany.name} (${companyId})`);

    // 3. Delete related data in correct order (tables without CASCADE DELETE)
    // Note: Tables with CASCADE DELETE will be handled automatically
    
    // Delete partner_conversions (NO ACTION constraint) - KRIITTINEN: Täytyy poistaa ensin!
    const { error: conversionsError } = await supabase
      .from('partner_conversions')
      .delete()
      .eq('company_id', companyId)
    
    if (conversionsError) {
      console.error('Error deleting partner conversions:', conversionsError);
      throw new Error(`Failed to delete partner conversions: ${conversionsError.message}`);
    }

    // Delete documents (NO ACTION constraint)
    const { error: documentsError } = await supabase
      .from('documents')
      .delete()
      .eq('company_id', companyId)
    
    if (documentsError) {
      console.error('Error deleting documents:', documentsError);
      throw new Error(`Failed to delete documents: ${documentsError.message}`);
    }

    // Delete funding_applications (NO ACTION constraint)
    const { error: applicationsError } = await supabase
      .from('funding_applications')
      .delete()
      .eq('company_id', companyId)
    
    if (applicationsError) {
      console.error('Error deleting funding applications:', applicationsError);
      throw new Error(`Failed to delete funding applications: ${applicationsError.message}`);
    }

    // Delete funding_recommendations (NO ACTION constraint)
    const { error: recommendationsError } = await supabase
      .from('funding_recommendations')
      .delete()
      .eq('company_id', companyId)
    
    if (recommendationsError) {
      console.error('Error deleting funding recommendations:', recommendationsError);
      throw new Error(`Failed to delete funding recommendations: ${recommendationsError.message}`);
    }

    // Delete future_goals (NO ACTION constraint)
    const { error: goalsError } = await supabase
      .from('future_goals')
      .delete()
      .eq('company_id', companyId)
    
    if (goalsError) {
      console.error('Error deleting future goals:', goalsError);
      throw new Error(`Failed to delete future goals: ${goalsError.message}`);
    }

    // 4. Finally delete the company (this will CASCADE delete the remaining tables)
    const { error: companyError } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId)
    
    if (companyError) {
      console.error('Error deleting company:', companyError);
      throw new Error(`Failed to delete company: ${companyError.message}`);
    }

    console.log(`Successfully deleted company ${existingCompany.name} and all related data`);
    
    return NextResponse.json({ 
      message: 'Company and all related data deleted successfully',
      deletedCompany: existingCompany.name
    })

  } catch (err: any) {
    console.error('Error in DELETE /api/admin/companies/[companyId]:', err);
    return NextResponse.json(
      { error: `Failed to delete company: ${err.message || 'Internal server error'}` },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  
  // ... existing code using companyId ...
} 