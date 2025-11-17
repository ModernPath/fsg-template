#!/usr/bin/env tsx

import axios from 'axios'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY

async function listAvatars() {
  if (!HEYGEN_API_KEY) {
    throw new Error('HEYGEN_API_KEY is not set in .env.local')
  }

  console.log('🔍 Fetching available HeyGen avatars...\n')

  try {
    // Try different API endpoints to list avatars
    const endpoints = [
      'https://api.heygen.com/v2/avatars',
      'https://api.heygen.com/v1/avatars',
      'https://api.heygen.com/v2/avatar.list',
      'https://api.heygen.com/v1/avatar.list'
    ]

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying: ${endpoint}`)
        const response = await axios.get(endpoint, {
          headers: {
            'X-Api-Key': HEYGEN_API_KEY,
            'Content-Type': 'application/json'
          }
        })

        console.log('\n✅ Success! Available avatars:')
        console.log(JSON.stringify(response.data, null, 2))
        return response.data
      } catch (error: any) {
        console.log(`  ❌ ${error.response?.status || error.message}`)
      }
    }

    console.log('\n⚠️ Could not find avatar list endpoint.')
    console.log('💡 Trying to create a test video to see error details...\n')

    // Try to create a video to see what the API tells us
    const testResponse = await axios.post(
      'https://api.heygen.com/v2/video/generate',
      {
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: 'test',
            avatar_style: 'normal'
          },
          voice: {
            type: 'text',
            input_text: 'Test',
            voice_id: 'en-US-JennyNeural'
          }
        }],
        dimension: { width: 1920, height: 1080 },
        test: true
      },
      {
        headers: {
          'X-Api-Key': HEYGEN_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('Test response:', JSON.stringify(testResponse.data, null, 2))

  } catch (error: any) {
    if (error.response) {
      console.error('\n❌ API Error Response:')
      console.error(JSON.stringify(error.response.data, null, 2))
      console.error('\nStatus:', error.response.status)
      console.error('Headers:', error.response.headers)
    } else {
      console.error('\n❌ Error:', error.message)
    }
  }
}

listAvatars()

