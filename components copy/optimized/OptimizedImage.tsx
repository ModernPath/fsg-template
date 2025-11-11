'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  quality?: number
  loading?: 'lazy' | 'eager'
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'blur', // Muutettu oletusarvoksi paremman UX:n vuoksi
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fill = false,
  quality = 80, // Hieman alennettu paremman latausnopeuden vuoksi
  loading = 'lazy',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Parannettu blur placeholder
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    console.warn('Image failed to load:', src)
  }

  if (hasError) {
    return (
      <div 
        className={`bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">Kuva ei ladannut</span>
      </div>
    )
  }

  // Auto aspect ratio: if only width or height is provided, maintain aspect ratio
  const shouldMaintainAspect = (width && !height) || (!width && height)
  const imageStyle = shouldMaintainAspect 
    ? { width: width ? `${width}px` : 'auto', height: height ? `${height}px` : 'auto' }
    : undefined

  return (
    <div className={`relative ${isLoading && !priority ? 'animate-pulse bg-muted' : ''}`} style={imageStyle}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={`transition-opacity duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        style={shouldMaintainAspect ? { width: 'auto', height: 'auto' } : undefined}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? (blurDataURL || defaultBlurDataURL) : undefined}
        sizes={sizes}
        quality={quality}
        // Don't set loading prop when priority is true - Next.js handles it automatically
        {...(!priority && { loading })}
        onLoad={handleLoad}
        onError={handleError}
        // Lisää unoptimized={false} varmistamaan optimoinnin
        unoptimized={false}
        {...props}
      />
    </div>
  )
}
