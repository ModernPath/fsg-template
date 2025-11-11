import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with admin privileges to manage storage
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET() {
  try {
    console.log('Checking if financial_documents bucket exists...');
    
    // Check if the bucket exists using the storage API
    const { data: buckets, error: bucketsError } = await supabaseAdmin
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return NextResponse.json(
        { error: 'Failed to check storage buckets' },
        { status: 500 }
      );
    }
    
    // Check if financial_documents bucket exists
    const bucketExists = buckets?.some(bucket => bucket.name === 'financial_documents');
    
    if (!bucketExists) {
      console.log('Financial documents bucket does not exist, creating it...');
      
      // Create the bucket with appropriate settings
      const { data, error } = await supabaseAdmin.storage.createBucket(
        'financial_documents',
        {
          public: false,
          fileSizeLimit: 52428800, // 50MB limit
          allowedMimeTypes: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/msword',
            'text/csv',
            'application/json',
            'image/jpeg',
            'image/png',
            'image/webp'
          ]
        }
      );
      
      if (error) {
        console.error('Error creating financial_documents bucket:', error);
        return NextResponse.json(
          { error: 'Failed to create financial_documents bucket' },
          { status: 500 }
        );
      }
      
      console.log('Successfully created financial_documents bucket');
      return NextResponse.json({
        message: 'Financial documents bucket created successfully',
        created: true
      });
    }
    
    console.log('Financial documents bucket already exists');
    return NextResponse.json({
      message: 'Financial documents bucket already exists',
      created: false
    });
  } catch (error) {
    console.error('Unexpected error checking/creating bucket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 