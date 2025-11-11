import { NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Reverted: Using server client for token auth
// import { cookies } from 'next/headers'; // Reverted
import { createClient } from '@/utils/supabase/server'; // Reverted: Use server client
import sgMail from '@sendgrid/mail';
import crypto from 'crypto'; // Import crypto for token generation

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY is not set. Email sending will be disabled.');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// // Ensure the template ID is set - REMOVED as we use inline HTML now
// const templateId = process.env.SENDGRID_BOOKKEEPER_REQUEST_TEMPLATE_ID;
// if (!templateId) {
//   console.warn('SENDGRID_BOOKKEEPER_REQUEST_TEMPLATE_ID is not set. Email sending will be disabled.');
// }

export async function POST(request: Request) {
  // Check if SendGrid API key is configured
  if (!process.env.SENDGRID_API_KEY) { // Removed templateId check
    return NextResponse.json({ error: 'Email service API key is not configured.' }, { status: 503 }); // Service Unavailable
  }

  let userIdFromToken: string | null = null; // Variable to store the verified user ID
  let userEmailFromToken: string | null = null; // Store email from token user object

  try {
    // 1. Verify authentication using token in Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // 2. Create a temporary anon client just for token verification
    const anonSupabase = await createClient(); 
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser(token);

    if (authError || !user) {
      console.error('API Auth Error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userIdFromToken = user.id; // Store the verified user ID
    userEmailFromToken = user.email || null; // Store email from user object

    // --- User is verified via token, now proceed --- 

    // 3. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { bookkeeperEmail, personalMessage, companyId } = body;

    if (!bookkeeperEmail || typeof bookkeeperEmail !== 'string' || !bookkeeperEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid bookkeeper email is required' }, { status: 400 });
    }
    if (personalMessage && typeof personalMessage !== 'string') {
      return NextResponse.json({ error: 'Invalid personal message format' }, { status: 400 });
    }
     if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Get locale from body, default to 'en' if not provided
    const locale = body.locale || 'en'; 

    // 4. Create Service Role Client for Database Operations (Bypasses RLS)
    const serviceSupabase = await createClient(undefined, true); // Pass true to use service role

    // 5. Fetch user and company details using Service Role Client
    // Fetch user profile (using verified userIdFromToken)
    const { data: profileData, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('full_name, email') // Select email too
      .eq('id', userIdFromToken) // Use the verified ID
      .single();

    // Fetch company name (checking created_by against verified userIdFromToken)
    const { data: companyData, error: companyError } = await serviceSupabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .eq('created_by', userIdFromToken) // Check ownership against the verified ID
      .maybeSingle();

    // Error Handling for database queries
    if (profileError) {
      console.error('Error fetching user profile (Service Role):', profileError);
      // Don't expose detailed DB errors generally
      return NextResponse.json({ error: 'Could not retrieve user details.' }, { status: 500 }); 
    }

    if (companyError) {
      console.error('Error fetching company details (Service Role):', companyError);
      return NextResponse.json({ error: 'Could not retrieve company details.' }, { status: 500 });
    }
    
    // Check if the company was found *and* created by the verified user
    if (!companyData) { 
      console.error(`Company check failed: No company found with ID: ${companyId} for user: ${userIdFromToken} (using service role)`);
      // Return 403 as the user (verified by token) doesn't own this company OR it doesn't exist
      return NextResponse.json({ error: 'Access denied or company not found.' }, { status: 403 }); 
    }

    // Get details for email content
    const userName = profileData?.full_name || userEmailFromToken || 'User'; 
    const userEmail = profileData?.email || userEmailFromToken || 'N/A'; 
    const companyName = companyData.name;

    // 6. Generate Secure Token and Expiry
    const secureToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token valid for 7 days

    // 7. Store Document Request in Database
    const { error: insertError } = await serviceSupabase
      .from('document_requests')
      .insert({
        token: secureToken,
        company_id: companyId,
        requesting_user_id: userIdFromToken,
        bookkeeper_email: bookkeeperEmail,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });

    if (insertError) {
       console.error('Error saving document request token:', insertError);
       return NextResponse.json({ error: 'Could not create secure document request.' }, { status: 500 });
    }

    // 8. Construct the REAL Secure Upload Link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    // Ensure the URL does not end with a slash before appending locale
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const secureUploadLink = `${cleanBaseUrl}/${locale}/secure-upload/${secureToken}`; 

    // 9. Construct Email Subject and HTML Body
    const subject = `Document Request for ${companyName} from ${userName}`;
    const htmlBody = `
      <p>Hello,</p>
      <p>${userName} (${userEmail}) from ${companyName} has requested financial documents via TrustyFinance.</p>
      ${personalMessage ? 
        `<p>They included the following message:</p>
         <blockquote style="border-left: 4px solid #ccc; padding-left: 1em; margin-left: 1em;">${personalMessage}</blockquote>` 
        : ''
      }
      <p>Please use the secure link below to upload the requested documents (typically the latest Income Statement and Balance Sheet). This link is valid for 7 days:</p>
      <p><a href="${secureUploadLink}" style="color: #007bff; font-weight: bold;">Upload Documents Securely</a></p> 
      <p><i>Note: This link is unique to this request and will expire.</i></p>
      <p>If you have any questions, please reply to ${userName} directly at ${userEmail}.</p>
      <p>Thank you,<br>The TrustyFinance Team</p> 
    `;

    // 10. Prepare email data with inline content
    const msg = {
      to: bookkeeperEmail,
      from: {
         name: 'TrustyFinance',
         email: process.env.SENDER_EMAIL || 'info@trustyfinance.fi', // Use the specified verified sender email
      }, 
      subject: subject,
      html: htmlBody,
      // templateId: templateId, // REMOVED
      // dynamicTemplateData: { ... }, // REMOVED
    };

    // 11. Send email via SendGrid
    await sgMail.send(msg);

    console.log(`Document request email sent to ${bookkeeperEmail} for user ${userIdFromToken} / company ${companyId} with token ${secureToken}`);
    return NextResponse.json({ message: 'Email request sent successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error in document request API:', error.response?.body || error);
    // Generic error for unexpected issues
    return NextResponse.json({ error: 'Failed to process document request.' }, { status: 500 });
  }
} 