#!/usr/bin/env tsx

import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY
const HEYGEN_API_URL = 'https://api.heygen.com/v2/video/generate'

interface VideoGenerationOptions {
  title: string
  script: string
  outputPath: string
  avatarId: string
  voiceId?: string
}

async function generateHeyGenVideo(options: VideoGenerationOptions): Promise<void> {
  if (!HEYGEN_API_KEY) {
    throw new Error('HEYGEN_API_KEY is not set in .env.local')
  }

  console.log(`\n🎬 Generating HeyGen video: ${options.title}`)
  console.log(`📝 Script: ${options.script.substring(0, 100)}...`)

  try {
    // Create video generation request
    const response = await axios.post(
      HEYGEN_API_URL,
      {
        video_inputs: [
          {
            character: {
              type: 'talking_photo',
              talking_photo_id: options.avatarId
            },
            voice: {
              type: 'text',
              input_text: options.script,
              voice_id: options.voiceId
            }
          }
        ],
        dimension: {
          width: 1920,
          height: 1080
        },
        test: false,
        caption: false
      },
      {
        headers: {
          'X-Api-Key': HEYGEN_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    const videoId = response.data.data.video_id
    console.log(`✅ Video generation started! ID: ${videoId}`)
    console.log(`⏳ Waiting for video to be ready...`)

    // Poll for video status
    let videoReady = false
    let videoUrl = ''
    let attempts = 0
    const maxAttempts = 60 // 10 minutes

    while (!videoReady && attempts < maxAttempts) {
      attempts++
      await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds

      const statusResponse = await axios.get(
        `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
        {
          headers: {
            'X-Api-Key': HEYGEN_API_KEY
          }
        }
      )

      const status = statusResponse.data.data.status
      console.log(`   Status: ${status} (attempt ${attempts}/${maxAttempts})`)

      if (status === 'completed') {
        videoReady = true
        videoUrl = statusResponse.data.data.video_url
      } else if (status === 'failed') {
        throw new Error('Video generation failed')
      }
    }

    if (!videoReady) {
      throw new Error('Video generation timed out')
    }

    console.log(`📥 Downloading video from: ${videoUrl}`)

    // Download the video
    const videoResponse = await axios.get(videoUrl, {
      responseType: 'arraybuffer'
    })

    // Save the video
    const outputDir = path.dirname(options.outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(options.outputPath, videoResponse.data)
    console.log(`✅ Video saved to: ${options.outputPath}`)

    // Get file size
    const stats = fs.statSync(options.outputPath)
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2)
    console.log(`📦 File size: ${fileSizeMB} MB`)

  } catch (error: any) {
    console.error('❌ Error generating video:', error.response?.data || error.message)
    throw error
  }
}

async function main() {
  console.log('🎥 HeyGen Video Generator for Fuengirola Boat Trips')
  console.log('=' .repeat(60))

  const videos = [
    {
      title: 'Dolphin Experience',
      avatarId: '4591f46e96ab4b0297aee26633a5c251', // Maria Headshot
      script: 'Join us on an unforgettable dolphin watching adventure! Our experienced guides will take you to the best spots in the Mediterranean Sea where you can see magnificent dolphins in their natural habitat. Book your dolphin tour today!',
      outputPath: 'public/videos/dolphins.mp4',
      voiceId: 'af5953ebe0d945a4b82135d5ee47d027' // Female voice
    },
    {
      title: 'Sunset Cruise',
      avatarId: 'c6bb163d7f8a4ac783e7c72cda10cf6f', // Priya Headshot
      script: 'Experience the magic of a Mediterranean sunset from the deck of our luxury boat! Watch the sky transform into brilliant colors as the sun sets over the Costa del Sol. Includes drinks and snacks. Perfect for couples and families.',
      outputPath: 'public/videos/sunset.mp4',
      voiceId: 'af5953ebe0d945a4b82135d5ee47d027' // Female voice
    },
    {
      title: 'Boat Tour',
      avatarId: 'cbda5c4966534d8f8e3f300f828b0ae8', // Michelle
      script: 'Discover the beautiful coastline of Fuengirola on our comprehensive boat tour! See hidden coves, stunning cliffs and maybe even spot some dolphins! Our comfortable boats and friendly crew ensure a memorable experience for everyone.',
      outputPath: 'public/videos/tour.mp4',
      voiceId: 'af5953ebe0d945a4b82135d5ee47d027' // Female voice
    }
  ]

  for (const video of videos) {
    try {
      await generateHeyGenVideo(video)
      console.log('\n' + '✓'.repeat(60) + '\n')
    } catch (error) {
      console.error(`Failed to generate ${video.title}`)
      console.error(error)
      console.log('\n' + '✗'.repeat(60) + '\n')
    }
  }

  console.log('🎉 All videos generated successfully!')
}

main().catch(console.error)

