import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { inngest } from '@/lib/inngest/inngest.client';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fiscalYear = formData.get('fiscalYear') as string;
    const fiscalPeriod = formData.get('fiscalPeriod') as string;
    const documentTypeId = formData.get('documentTypeId') as string || '1'; // Default to a general document type
    
    // Get locale from formData, URL, or default to 'fi'
    let locale = formData.get('locale') as string || 'fi';
    if (!['en', 'fi', 'sv'].includes(locale)) {
      // Try to extract from URL path
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const pathLocale = pathParts[1]; // e.g., /fi/api/...
      if (['en', 'fi', 'sv'].includes(pathLocale)) {
        locale = pathLocale;
      } else {
        locale = 'fi'; // Default fallback
      }
    }
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Get or create company for the user
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .eq('created_by', user.id)
      .limit(1);
      
    let companyId: string;
    
    if (companiesError || !companies || companies.length === 0) {
      // Create a new company for the user
      const { data: newCompany, error: createCompanyError } = await supabase
        .from('companies')
        .insert({
          name: user.user_metadata.full_name || 'My Company',
          created_by: user.id,
          business_id: randomUUID().substring(0, 8)
        })
        .select('id')
        .single();
        
      if (createCompanyError || !newCompany) {
        console.error('Error creating company:', createCompanyError);
        return NextResponse.json({ error: 'Could not create company' }, { status: 500 });
      }
      
      companyId = newCompany.id;
    } else {
      companyId = companies[0].id;
    }
    
    // Upload file to storage
    const fileName = `${Math.random().toString(36).substring(2)}_${file.name}`;
    const filePath = `${companyId}/${fileName}`;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('financial_documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });
      
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
    }
    
    // Create document record
    const currentDate = new Date().toISOString();
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        company_id: companyId,
        document_type_id: documentTypeId,
        name: file.name,
        description: `Uploaded during onboarding on ${new Date().toLocaleDateString()}`,
        file_path: filePath,
        mime_type: file.type,
        file_size: file.size,
        fiscal_year: fiscalYear || new Date().getFullYear() - 1,
        fiscal_period: fiscalPeriod || 'annual',
        uploaded_by: user.id,
        created_by: user.id,
        processed: false,
        processing_status: 'pending',
        uploaded_at: currentDate,
        created_at: currentDate,
        metadata: JSON.stringify({
          upload_method: 'onboarding',
          original_filename: file.name,
          content_type: file.type
        })
      })
      .select('*')
      .single();
      
    if (docError) {
      console.error('Error creating document record:', docError);
      return NextResponse.json({ error: 'Error recording document' }, { status: 500 });
    }

    // Send document upload confirmation email
    try {
      // Get user's profile for name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
        
      // Get company name
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      if (!profileError && !companyError && profile && companyData) {
        const { EmailTemplateService } = await import('@/lib/services/emailTemplateService');
        const emailService = new EmailTemplateService();
        
        await emailService.sendDocumentUploadConfirmation(
          companyId,
          companyData.name,
          profile.email,
          profile.full_name || 'Asiakas'
        );
        
        console.log(`✅ Document upload confirmation email sent to ${profile.email}`);
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send document upload confirmation email:', emailError);
      // Don't fail the upload if email fails
    }

    // Trigger document analysis
    try {
      await inngest.send({
        name: 'document/uploaded',
        data: {
          documentId: document.id,
          companyId: companyId,
          userId: user.id,
          locale: locale // ✅ Fixed: Pass locale for correct language in AI analysis
        }
      });
      console.log(`Document analysis triggered successfully for onboarding upload (locale: ${locale})`);
    } catch (inngestError) {
      console.error('Error sending Inngest event for onboarding upload:', inngestError);
      // Don't fail the upload if analysis trigger fails
    }
    
    return NextResponse.json({ 
      success: true, 
      document,
      company_id: companyId
    });
    
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 