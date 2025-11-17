'use client'

import React from 'react';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterWrapper() {
  const pathname = usePathname();
  
  // Piilota footer veneretki-sivulla (sillä on oma footer)
  if (pathname?.includes('/fuengirola-veneretket')) {
    return null;
  }
  
  return <Footer />;
} 