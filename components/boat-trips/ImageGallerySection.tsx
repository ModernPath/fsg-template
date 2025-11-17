'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export function ImageGallerySection() {
  const t = useTranslations('BoatTrips.gallery')
  const [filter, setFilter] = useState('all')
  const [selectedImage, setSelectedImage] = useState<typeof images[0] | null>(null)
  const [imageIndex, setImageIndex] = useState(0)

  const closeModal = () => {
    setSelectedImage(null)
  }

  // ESC-näppäin sulkee lightboxin
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedImage])

  // Estä body scrollaus kun lightbox on auki
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedImage])

  const images = [
    { src: '/images/gallery/dolphins-1.jpg', category: 'dolphins', alt: 'Delfiinit Välimerellä' },
    { src: '/images/gallery/boat-1.jpg', category: 'boats', alt: 'Luksusveneet' },
    { src: '/images/gallery/sunset-1.jpg', category: 'sunset', alt: 'Auringonlasku merellä' },
    { src: '/images/gallery/customers-1.jpg', category: 'customers', alt: 'Tyytyväiset asiakkaat' },
    { src: '/images/gallery/dolphins-2.jpg', category: 'dolphins', alt: 'Delfiinilauma' },
    { src: '/images/gallery/boat-2.jpg', category: 'boats', alt: 'Veneretki' },
    { src: '/images/gallery/sunset-2.jpg', category: 'sunset', alt: 'Kultainen auringonlasku' },
    { src: '/images/gallery/customers-2.jpg', category: 'customers', alt: 'Perheretki' },
  ]

  const categories = [
    { id: 'all', label: t('categories.all') },
    { id: 'dolphins', label: t('categories.dolphins') },
    { id: 'boats', label: t('categories.boats') },
    { id: 'sunset', label: t('categories.sunset') },
    { id: 'customers', label: t('categories.customers') },
  ]

  const filteredImages = filter === 'all' 
    ? images 
    : images.filter(img => img.category === filter)

  const nextImage = () => {
    const nextIndex = (imageIndex + 1) % filteredImages.length
    setImageIndex(nextIndex)
    setSelectedImage(filteredImages[nextIndex])
  }

  const prevImage = () => {
    const prevIndex = (imageIndex - 1 + filteredImages.length) % filteredImages.length
    setImageIndex(prevIndex)
    setSelectedImage(filteredImages[prevIndex])
  }

  return (
    <section id="gallery" className="py-32 bg-gradient-to-b from-white via-blue-50/50 to-white relative overflow-hidden scroll-mt-20">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="font-geist text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 text-blue-600">
            {t('title')}
          </h2>
          <p className="text-2xl text-blue-400 max-w-3xl mx-auto mb-12">
            {t('subtitle')}
          </p>

          {/* Category filters with 3D effect */}
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setFilter(category.id)}
                className={`px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                  filter === category.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-2xl shadow-blue-500/50'
                    : 'bg-white text-blue-600 border-2 border-blue-200 hover:border-blue-400 shadow-lg hover:shadow-xl'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Masonry-style gallery with hover effects */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredImages.map((image, index) => (
            <div
              key={index}
              data-aos="zoom-in"
              data-aos-delay={index * 50}
              className="group relative aspect-square overflow-hidden rounded-3xl cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border-2 border-blue-100 hover:border-blue-300"
              onClick={() => {
                setSelectedImage(image)
                setImageIndex(index)
              }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-125"
                onError={(e) => {
                  e.currentTarget.src = '/images/placeholder-boat.svg'
                }}
              />
              {/* Overlay with glassmorphism */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end">
                <div className="p-6 w-full bg-white/10 backdrop-blur-md">
                  <p className="text-white font-bold text-lg drop-shadow-lg">{image.alt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal with animations */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={closeModal}
          >
            {/* Close button - SUUREMPI JA NÄKYVÄMPI */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeModal()
              }}
              className="fixed top-4 right-4 md:top-8 md:right-8 bg-red-500 hover:bg-red-600 text-white p-3 md:p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-2xl z-[10000] flex items-center gap-2 pointer-events-auto"
              aria-label="Sulje"
            >
              <X className="w-6 h-6 md:w-8 md:h-8" />
              <span className="hidden md:inline font-bold">ESC</span>
            </button>

            {/* Navigation buttons */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="fixed left-2 md:left-8 top-1/2 -translate-y-1/2 bg-blue-600/90 backdrop-blur-md hover:bg-blue-700 text-white p-3 md:p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-2xl z-[10000] pointer-events-auto"
              aria-label="Edellinen kuva"
            >
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="fixed right-2 md:right-8 top-1/2 -translate-y-1/2 bg-blue-600/90 backdrop-blur-md hover:bg-blue-700 text-white p-3 md:p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-2xl z-[10000] pointer-events-auto"
              aria-label="Seuraava kuva"
            >
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
            </button>

            {/* Image */}
            <div className="relative max-w-6xl max-h-[90vh] w-full h-full pointer-events-none">
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                fill
                className="object-contain rounded-3xl shadow-2xl"
              />
            </div>

            {/* Image counter & help text */}
            <div className="fixed bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-[10000] pointer-events-none">
              <div className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl">
                <span className="font-bold">{imageIndex + 1} / {filteredImages.length}</span>
              </div>
              <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl text-sm">
                Klikkaa taustaa tai paina ESC sulkeaksesi
              </div>
            </div>
          </div>
        )}

        {/* Instagram CTA with 3D effect */}
        <div className="mt-20 text-center" data-aos="fade-up" data-aos-delay="200">
          <p className="text-blue-400 mb-6 text-xl">{t('followUs')}</p>
          <a 
            href="https://instagram.com/fuengirolanveneretket" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 hover:from-pink-600 hover:via-purple-600 hover:to-pink-600 text-white px-10 py-5 rounded-full font-bold text-lg shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @fuengirolanveneretket
          </a>
        </div>
      </div>
    </section>
  )
}
