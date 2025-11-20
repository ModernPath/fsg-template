'use client'

import { useTranslations } from 'next-intl'
import { Play } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

export function VideoGallerySection() {
  const t = useTranslations('BoatTrips.videos')
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null)

  const videos = [
    { 
      id: 'dolphins', 
      title: t('dolphinVideo'),
      duration: '2:30',
      thumbnail: '/images/gallery/dolphins-1.jpg',
      sources: [
        '/videos/dolphins.mp4',
        'https://cdn.pixabay.com/video/2020/05/05/38281-417299468_large.mp4',
        'https://cdn.pixabay.com/video/2016/07/27/4404-176010046_large.mp4'
      ]
    },
    { 
      id: 'sunset', 
      title: t('sunsetVideo'),
      duration: '1:45',
      thumbnail: '/images/gallery/sunset-1.jpg',
      sources: [
        '/videos/sunset.mp4',
        'https://cdn.pixabay.com/video/2022/01/18/105023-667468114_large.mp4',
        'https://cdn.pixabay.com/video/2021/08/06/84390-584473982_large.mp4'
      ]
    },
    { 
      id: 'tour', 
      title: t('tourVideo'),
      duration: '3:00',
      thumbnail: '/images/gallery/boat-1.jpg',
      sources: [
        '/videos/tour.mp4',
        'https://cdn.pixabay.com/video/2023/07/25/173435-850154969_large.mp4',
        'https://cdn.pixabay.com/video/2020/08/18/47959-451879467_large.mp4'
      ]
    },
  ]

  const handleVideoClick = (videoId: string) => {
    // Open YouTube videos - replace with real URLs when available
    const urls: { [key: string]: string } = {
      dolphins: 'https://www.youtube.com/results?search_query=dolphins+mediterranean+sea',
      sunset: 'https://www.youtube.com/results?search_query=sunset+boat+cruise+fuengirola',
      tour: 'https://www.youtube.com/results?search_query=boat+tour+costa+del+sol'
    }
    window.open(urls[videoId] || 'https://youtube.com/@fuengirolanveneretket', '_blank')
  }

  return (
    <section className="py-32 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20" data-aos="fade-up">
          <h2 className="font-geist text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 text-blue-600">
            {t('title')}
          </h2>
          <p className="text-2xl text-blue-400 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {videos.map((video, index) => (
            <div
              key={video.id}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="group relative bg-white rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-blue-500/30 border border-blue-100"
            >
              <div className="relative aspect-video">
                {/* Video thumbnail with animated preview */}
                <div className="relative w-full h-full">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover"
                  />
                  {/* Animated waves overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600/50 to-transparent">
                    <div className="absolute inset-0 animate-pulse opacity-30">
                      <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                </div>

                {/* Play overlay with glassmorphism */}
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-blue-900/70 via-blue-600/20 to-transparent cursor-pointer transition-all duration-300 group-hover:from-blue-900/50"
                  onClick={() => handleVideoClick(video.id)}
                  onMouseEnter={() => setHoveredVideo(video.id)}
                  onMouseLeave={() => setHoveredVideo(null)}
                >
                  <div className={`bg-white/90 backdrop-blur-md rounded-full p-8 shadow-2xl transition-all duration-300 ${hoveredVideo === video.id ? 'scale-125 bg-white' : 'scale-100'}`}>
                    <Play className="w-16 h-16 text-blue-600 ml-2" />
                  </div>
                </div>

                {/* Duration badge with glassmorphism */}
                <div className="absolute top-4 right-4 bg-blue-600/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  {video.duration}
                </div>
              </div>

              {/* Video info with gradient */}
              <div className="p-8 bg-gradient-to-br from-white to-blue-50/50">
                <h3 className="text-2xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                  {video.title}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action with 3D effect */}
        <div className="mt-20 text-center" data-aos="fade-up" data-aos-delay="300">
          <p className="text-blue-400 mb-6 text-xl">{t('watchMore')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="https://youtube.com/@fuengirolanveneretket" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-10 py-5 rounded-full font-bold text-lg shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1"
            >
              <Play className="w-6 h-6" />
              {t('youtubeChannel')}
            </a>
            <p className="text-sm text-blue-400">
              🎬 {t('videoInfo')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
