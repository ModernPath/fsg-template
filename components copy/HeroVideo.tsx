'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

interface HeroVideoProps {
  fallbackImage: any; // Consider using a more specific type if possible, e.g., StaticImageData
  alt: string;
  videoSrc: string; // Added videoSrc prop
}

export default function HeroVideo({ fallbackImage, alt, videoSrc }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement) {
      const handleLoadedData = () => {
        setVideoLoaded(true);
        // Yritä toistaa videota, mutta älä aseta virhetilaa jos epäonnistuu
        videoElement.play().catch(error => {
          console.log('[HeroVideo] Autoplay prevented by browser policy:', error);
          // Autoplay-esto on normaalia, ei virhe
        });
      };

      const handleError = (event: Event) => {
        console.error('[HeroVideo] Video loading error:', event);
        setVideoError(true);
      };

      const handleCanPlay = () => {
        setVideoLoaded(true);
      };

      // Lisää useita event listenereita varmistamaan latauksen tunnistaminen
      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('error', handleError);
      
      // Aseta src heti
      if (videoElement.src !== videoSrc) {
        videoElement.src = videoSrc;
      }

      // Cleanup function
      return () => {
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('error', handleError);
        if (videoElement && !videoElement.paused) {
          videoElement.pause();
        }
      };
    }
  }, [videoSrc]);

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      {/* Fallback kuva näkyy aina ensin ja piiloon vasta kun video on latautunut */}
      <Image
        src={fallbackImage}
        alt={alt}
        fill
        priority
        quality={85}
        sizes="100vw"
        onLoad={() => setImageLoaded(true)}
        className={`object-cover h-full w-full transition-opacity duration-700 ease-in-out ${
          videoLoaded && !videoError ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
      
      {/* Video näkyy vasta kun se on ladattu ja toimii */}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata" // Muutettu 'auto' -> 'metadata' nopeampaa latautumista varten
        className={`object-cover h-full w-full transition-opacity duration-700 ease-in-out ${
          videoLoaded && !videoError ? 'opacity-90' : 'opacity-0'
        } absolute inset-0`}
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
        }}
        poster={fallbackImage.src} // Käytä fallback-kuvaa posterina
      />
    </div>
  );
} 