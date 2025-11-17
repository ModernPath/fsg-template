'use client'

import { useEffect } from 'react'

export function AOSInit() {
  useEffect(() => {
    // Import AOS dynamically
    import('aos').then((AOS) => {
      AOS.init({
        duration: 1000,
        once: true,
        offset: 100,
        easing: 'ease-out-cubic',
      })
    })

    // Import AOS CSS
    import('aos/dist/aos.css')
  }, [])

  return null
}

