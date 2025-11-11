import { NextResponse } from 'next/server';
import { setupNodePolyfills } from '@/lib/utils/nodePolyfill';

// Ensure fetch is available in environments without native fetch
if (typeof fetch === 'undefined') {
  setupNodePolyfills();
}

/**
 * Example API route using the fetch polyfill
 * This route makes a request to a public API and returns the result
 * 
 * @param request - The incoming request
 */
export async function GET(request: Request) {
  try {
    // Make an external API request using fetch
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return the data as JSON
    return NextResponse.json({
      success: true,
      data,
      meta: {
        source: 'JsonPlaceholder',
        endpoint: 'https://jsonplaceholder.typicode.com/todos/1',
        fetchPolyfilled: typeof global !== 'undefined' && global.fetch !== undefined
      }
    });
  } catch (error) {
    console.error('Error in fetch-example API route:', error);
    
    // Return error details
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 