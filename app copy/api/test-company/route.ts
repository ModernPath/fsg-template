import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

// Updated YTJ API base URL
const YTJ_API_BASE_URL = 'https://avoindata.prh.fi/opendata-ytj-api/v3';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId') || '3361305-7'; // Default to Trusty Finance
    
    console.log(`Testing company data fetch for business ID: ${businessId}`);
    
    // Build the URL with query parameters properly
    const endpoint = `${YTJ_API_BASE_URL}/companies?businessId=${businessId}`;
    
    console.log(`Making request to: ${endpoint}`);
    
    // Set custom headers for the YTJ API request
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Financial-Services-App/1.0'
    };
    
    // Make the request to YTJ API with headers
    const response = await fetch(endpoint, { headers });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`YTJ API error response: ${errorText}`);
      
      // Try the alternative endpoint format to see if it works
      console.log('Trying alternative endpoint format...');
      const altEndpoint = `${YTJ_API_BASE_URL}/companies/${businessId}`;
      
      console.log(`Making request to: ${altEndpoint}`);
      const altResponse = await fetch(altEndpoint, { headers });
      
      if (altResponse.ok) {
        const data = await altResponse.json();
        return NextResponse.json({
          success: true,
          source: 'alternative endpoint',
          endpoint: altEndpoint,
          data
        });
      } else {
        const altErrorText = await altResponse.text();
        throw new Error(`YTJ API error: ${response.status} ${errorText}\nAlternative endpoint: ${altResponse.status} ${altErrorText}`);
      }
    }
    
    // Parse the JSON response
    const data = await response.json();
    
    // Check if we got any companies in the response
    if (!data.companies || data.companies.length === 0) {
      console.warn('No company data found in the response');
      return NextResponse.json({
        success: false,
        error: 'No company data found',
        rawResponse: data
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      source: 'primary endpoint',
      endpoint,
      data
    });
  } catch (error) {
    console.error('Error in test-company API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 