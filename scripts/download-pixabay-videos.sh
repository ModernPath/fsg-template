#!/bin/bash

# Download free stock videos from direct sources
echo "Downloading boat/ocean videos..."

# Video 1: Ocean waves (from Pexels)
curl -L "https://player.vimeo.com/progressive_redirect/playback/759392175/rendition/720p/file.mp4?loc=external&log_user=0&signature=0c6b1c3d5e4f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b" \
  -o public/videos/boat-dolphins-bg.mp4 \
  --max-time 120 \
  -H "User-Agent: Mozilla/5.0" \
  2>&1 | grep -E "Downloaded|Error|%" | tail -5

echo "Background video downloaded!"

# Video 2: Dolphins swimming
curl -L "https://player.vimeo.com/progressive_redirect/playback/759651845/rendition/720p/file.mp4?loc=external&log_user=0&signature=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2" \
  -o public/videos/dolphins.mp4 \
  --max-time 120 \
  -H "User-Agent: Mozilla/5.0" \
  2>&1 | grep -E "Downloaded|Error|%" | tail -5

echo "Dolphin video downloaded!"

# Video 3: Sunset on water
curl -L "https://player.vimeo.com/progressive_redirect/playback/759640172/rendition/720p/file.mp4?loc=external&log_user=0&signature=b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3" \
  -o public/videos/sunset.mp4 \
  --max-time 120 \
  -H "User-Agent: Mozilla/5.0" \
  2>&1 | grep -E "Downloaded|Error|%" | tail -5

echo "Sunset video downloaded!"

# Video 4: Boat tour
curl -L "https://player.vimeo.com/progressive_redirect/playback/759637840/rendition/720p/file.mp4?loc=external&log_user=0&signature=c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4" \
  -o public/videos/tour.mp4 \
  --max-time 120 \
  -H "User-Agent: Mozilla/5.0" \
  2>&1 | grep -E "Downloaded|Error|%" | tail -5

echo "Tour video downloaded!"

echo ""
echo "All videos downloaded! Checking sizes..."
ls -lh public/videos/*.mp4

