import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API endpoint to schedule a company analysis
 * Called after user registration to initiate the analysis process
 */
export async function POST(request: Request) {
  try {
    const { userId, company, companyCode } = await request.json();
    
    if (!userId || !company || !companyCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if company already exists in the database
    const { data: existingCompany, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('business_id', companyCode)
      .single();
    
    let companyId;
    
    if (companyError && companyError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      console.error('Error checking for existing company:', companyError);
      return NextResponse.json(
        { error: 'Failed to check for existing company' },
        { status: 500 }
      );
    }
    
    // If company doesn't exist, create it
    if (!existingCompany) {
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          name: company,
          business_id: companyCode,
          created_by: userId
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('Error creating company:', createError);
        return NextResponse.json(
          { error: 'Failed to create company' },
          { status: 500 }
        );
      }
      
      companyId = newCompany.id;
    } else {
      companyId = existingCompany.id;
    }
    
    // Update user profile with company ID
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ company_id: companyId })
      .eq('id', userId);
    
    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }
    
    // Create a financial analysis record to be processed by the cron job
    const { data: analysis, error: analysisError } = await supabase
      .from('financial_analysis')
      .insert({
        company_id: companyId,
        status: 'pending',
        created_by: userId
      })
      .select()
      .single();
    
    if (analysisError) {
      console.error('Error creating financial analysis:', analysisError);
      return NextResponse.json(
        { error: 'Failed to schedule financial analysis' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      companyId,
      analysisId: analysis.id
    });
  } catch (error) {
    console.error('Error scheduling company analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 