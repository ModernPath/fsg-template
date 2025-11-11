'use client';

import React, { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';

interface EuroWhirlwindLoaderProps {
  isVisible: boolean;
  message?: string;
}

const NUM_SYMBOLS = 25; // Keep increased number of symbols

const EuroWhirlwindLoader: React.FC<EuroWhirlwindLoaderProps> = ({ 
  isVisible, 
  message 
}) => {
  const t = useTranslations('Components.EuroWhirlwindLoader');

  // Memoize symbol data to avoid recalculation on every render
  const symbols = useMemo(() => {
    return Array.from({ length: NUM_SYMBOLS }).map((_, i) => ({
      id: i,
      delay: Math.random() * 4.5, // Keep increased max delay
      tx: (Math.random() - 0.5) * 500, // Wider X translation range
      ty: (Math.random() - 0.5) * 400, // Wider Y translation range
    }));
  }, []); // Empty dependency array means this runs only once

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isVisible]);

  if (!isVisible) {
    return null; // Don't render anything if not visible
  }

  const displayMessage = message || t('analyzingMessage', { default: 'Analyzing Documents & Generating Recommendations...' });

  return (
    <div className="euro-whirlwind-overlay" aria-live="polite" aria-busy="true">
      <div className="euro-whirlwind-container">
        {symbols.map((symbol) => (
          <span
            key={symbol.id}
            className="euro-symbol"
            style={{
              animationDelay: `${symbol.delay}s`,
              '--tx': symbol.tx,
              '--ty': symbol.ty,
            } as React.CSSProperties}
          >
            €
          </span>
        ))}
      </div>
      <div className="whirlwind-message">
        {displayMessage}
      </div>
    </div>
  );
};

export default EuroWhirlwindLoader; 