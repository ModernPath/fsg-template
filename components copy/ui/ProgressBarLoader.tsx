'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface ProgressBarLoaderProps {
  isVisible: boolean;
  message?: string;
  estimatedDurationSeconds?: number;
}

const ProgressBarLoader: React.FC<ProgressBarLoaderProps> = ({ 
  isVisible, 
  message,
  estimatedDurationSeconds = 40 // Oletus 40 sekuntia
}) => {
  const t = useTranslations('Components.ProgressBarLoader');
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(estimatedDurationSeconds);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setTimeRemaining(estimatedDurationSeconds);
      // Remove body top margin when progress bar is hidden
      document.body.style.marginTop = '0px';
      return;
    }

    // Add top margin to body to push content below progress bar
    // Check if page has header/navigation elements that actually have content
    const headerElements = document.querySelectorAll('header, nav, .sticky.top-0, [class*="sticky"]');
    let hasVisibleHeader = false;
    
    for (const el of headerElements) {
      const styles = getComputedStyle(el as Element);
      const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden';
      const hasContent = (el as Element).textContent?.trim() || (el as Element).children.length > 0;
      
      if (isVisible && hasContent) {
        hasVisibleHeader = true;
        break;
      }
    }
    
    console.log('🔍 [ProgressBarLoader] Header check:', {
      headerElementsFound: headerElements.length,
      hasVisibleHeader,
      currentUrl: window.location.href
    });
    
    // Only add margin if there's a visible header with content that might conflict with progress bar
    const marginTop = hasVisibleHeader ? '200px' : '20px';
    document.body.style.marginTop = marginTop;
    
    console.log('🔍 [ProgressBarLoader] Setting margin-top:', marginTop);

    const startTime = Date.now();
    const duration = estimatedDurationSeconds * 1000; // Muunna millisekunneiksi

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercentage = Math.min((elapsed / duration) * 100, 99); // Maksimi 99% kunnes oikeasti valmis
      const remainingMs = Math.max(duration - elapsed, 0);
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      setProgress(progressPercentage);
      setTimeRemaining(remainingSeconds);

      // Lopeta intervalli kun aika on kulunut
      if (elapsed >= duration) {
        clearInterval(interval);
        setProgress(99); // Pidä 99% kunnes komponentti piilottaa itsensä
      }
    }, 100); // Päivitä 10 kertaa sekunnissa

    // Cleanup funktio
    return () => {
      clearInterval(interval);
      document.body.style.marginTop = '0px';
    };
  }, [isVisible, estimatedDurationSeconds]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.marginTop = '0px';
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  const displayMessage = message || t('analyzingMessage', { default: 'Analysoidaan asiakirjoja, tämä voi kestää hetken...' });

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  return (
    <div className="progress-loader-overlay" aria-live="polite" aria-busy="true">
      <div className="progress-loader-container">
        {/* Pääviesti */}
        <div className="progress-message">
          {displayMessage}
        </div>
        
        {/* Tilapalkki */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
          <div className="progress-percentage">
            {Math.round(progress)}%
          </div>
        </div>
        
        {/* Jäljellä oleva aika */}
        <div className="time-remaining">
          {timeRemaining > 0 ? (
            <>Arvioitu jäljellä oleva aika: {formatTime(timeRemaining)}</>
          ) : (
            <>Viimeistellään analyysiä...</>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBarLoader; 