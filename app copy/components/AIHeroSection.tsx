'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'
import { 
  TypingAnimation,
  DataProcessingAnimation
} from './AIAnimations'
import { Link } from '@/app/i18n/navigation'

interface AIHeroSectionProps {
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
  videoSrc?: string
  posterSrc?: string
}

// Simple gradient background
function SimpleGradient() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-black opacity-40" />
  )
}

export function AIHeroSection({
  title,
  description,
  ctaLabel,
  ctaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  videoSrc,
  posterSrc
}: AIHeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  // Handle smooth scroll for anchor links
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href')?.replace('#', '');
    if (targetId) {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: 'smooth'
        });
      }
    }
  };

  // Determine if secondary link is an anchor
  const isAnchorLink = secondaryCtaHref?.startsWith('#') || false;

  return (
    <section ref={sectionRef} className="relative py-28 md:py-36 bg-black overflow-hidden min-h-[90vh] flex items-center">
      {/* Base background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-black" />
      <SimpleGradient />
      
      <div className="container mx-auto px-4 relative max-w-7xl">
        <div className="w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            {/* Left column: Text content */}
            <div className="text-center lg:text-left lg:col-span-2">
              <motion.h1 
                className="text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {title}
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-gray-300 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {description}
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link
                  href={ctaHref}
                  className="inline-flex items-center px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                >
                  {ctaLabel}
                </Link>
                
                {secondaryCtaLabel && secondaryCtaHref && (
                  isAnchorLink ? (
                    <a
                      href={secondaryCtaHref}
                      onClick={handleSmoothScroll}
                      className="inline-flex items-center px-8 py-3 rounded-lg border border-gray-700 text-white font-semibold hover:bg-gray-800 transition-all duration-300 hover:border-blue-500/50"
                    >
                      {secondaryCtaLabel}
                    </a>
                  ) : (
                    <Link
                      href={secondaryCtaHref}
                      className="inline-flex items-center px-8 py-3 rounded-lg border border-gray-700 text-white font-semibold hover:bg-gray-800 transition-all duration-300 hover:border-blue-500/50"
                    >
                      {secondaryCtaLabel}
                    </Link>
                  )
                )}
              </motion.div>
            </div>
            
            {/* Right column: Simple animation showcase */}
            <motion.div 
              className="relative rounded-xl overflow-hidden aspect-video shadow-xl lg:col-span-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {videoSrc ? (
                <video
                  src={videoSrc}
                  poster={posterSrc}
                  className="w-full h-full object-cover rounded-xl"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full p-8">
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* Simple data processing animation */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                          <DataProcessingAnimation />
                        </div>
                        
                        {/* Simple typing indicator */}
                        <div className="absolute bottom-8 right-8">
                          <TypingAnimation />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Simple scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <svg className="w-6 h-6 text-gray-400 animate-bounce" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </motion.div>
    </section>
  )
} 