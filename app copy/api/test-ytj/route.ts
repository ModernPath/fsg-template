import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

// Updated YTJ API URLs - try different formats
const YTJ_API_BASE_URL = 'https://avoindata.prh.fi/opendata-ytj-api/v3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId') || '3361305-7'; // Default to Trusty Finance
  
  try {
    // Construct the YTJ API endpoint URL with the business ID
    // Try a few different formats
    const formats = [
      `${YTJ_API_BASE_URL}/companies/${businessId}`,
      `${YTJ_API_BASE_URL}/companies?businessId=${businessId}`,
      `${YTJ_API_BASE_URL}/information-service/${businessId}`
    ];
    
    // Try each format until one works
    let response = null;
    let data = null;
    let success = false;
    let error = null;
    
    for (const endpoint of formats) {
      try {
        console.log(`Trying to fetch data from YTJ API: ${endpoint}`);
        response = await fetch(endpoint);
        
        if (response.ok) {
          data = await response.json();
          success = true;
          break;
        } else {
          const errorText = await response.text();
          console.log(`Error with endpoint ${endpoint}: ${response.status} ${errorText}`);
        }
      } catch (err) {
        console.error(`Error with endpoint ${endpoint}:`, err);
      }
    }
    
    if (success) {
      return NextResponse.json({
        success: true,
        data
      });
    } else {
      throw new Error('Failed to fetch data from any endpoint format');
    }
  } catch (error) {
    console.error('Error fetching from YTJ API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 