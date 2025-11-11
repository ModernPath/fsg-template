'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/app/i18n/navigation'
import { motion } from 'framer-motion'

interface FloatingNavProps {
  locale: string
}

export default function FloatingNav({ locale }: FloatingNavProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  return (
    <motion.div 
      className="fixed bottom-8 right-8 z-50"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0.8,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={`/${locale}/blog`}
        className="flex items-center justify-center w-14 h-14 bg-gold-primary hover:bg-gold-highlight text-black rounded-full shadow-lg hover:shadow-gold-primary/50 transition-all duration-300 transform hover:scale-105"
        aria-label="Back to blog"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
    </motion.div>
  )
} 