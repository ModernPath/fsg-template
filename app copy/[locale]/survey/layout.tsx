'use client'

import { ReactNode, useEffect } from 'react'

interface SurveyLayoutProps {
  children: ReactNode
}

export default function SurveyLayout({ children }: SurveyLayoutProps) {
  useEffect(() => {
    // Aggressive hiding of navigation and footer elements
    const hideElements = () => {
      const selectors = [
        'nav', 'header', 'footer',
        '.sticky', '[class*="sticky"]',
        '[class*="navigation"]', '[class*="header"]', '[class*="footer"]',
        '[class*="top-0"]', '.z-50'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          (el as HTMLElement).style.display = 'none';
          (el as HTMLElement).style.visibility = 'hidden';
          (el as HTMLElement).style.height = '0';
          (el as HTMLElement).style.overflow = 'hidden';
        });
      });
    };

    // Hide immediately and after a delay
    hideElements();
    const timer = setTimeout(hideElements, 100);
    
    // Also hide on DOM mutations
    const observer = new MutationObserver(hideElements);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <style jsx global>{`
        /* Force hide navigation and footer */
        nav, header, footer, 
        .sticky, [class*="sticky"], 
        [class*="navigation"], [class*="header"], [class*="footer"],
        [class*="top-0"], .z-50 {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          overflow: hidden !important;
        }
        
        /* Reset main container */
        main {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
      `}</style>
      {children}
    </div>
  )
}
