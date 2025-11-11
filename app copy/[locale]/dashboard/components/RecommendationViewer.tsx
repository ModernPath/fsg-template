'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ExpandIcon,
  MinimizeIcon,
  LightbulbIcon,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CreditCard,
  CoinsIcon,
  Building,
  PiggyBank,
  BadgePercent,
  Briefcase,
  BarChart3,
  MaximizeIcon,
  XIcon
} from 'lucide-react'

interface RecommendationDetail {
  type?: string;
  details?: string;
  suitability_rationale?: string;
}

interface FundingRecommendation {
  id: string;
  summary?: string | null;
  analysis?: string | null;
  recommendation_details?: RecommendationDetail[] | null;
  action_plan?: string | null;
  outlook?: string | null;
}

interface Props {
  recommendation: FundingRecommendation;
  locale: string;
}

// Function to get an appropriate icon based on funding type
const getFundingTypeIcon = (type: string | undefined) => {
  const typeLower = type?.toLowerCase() || '';
  // Using text-gold-primary for icons to match the theme
  if (typeLower.includes('equity') || typeLower.includes('venture')) {
    return <Building className="h-6 w-6 text-gold-primary" />;
  } else if (typeLower.includes('loan') || typeLower.includes('debt')) {
    return <CreditCard className="h-6 w-6 text-gold-primary" />;
  } else if (typeLower.includes('credit_line') || typeLower.includes('line')) {
    return <BadgePercent className="h-6 w-6 text-gold-primary" />;
  } else if (typeLower.includes('grant')) {
    return <CoinsIcon className="h-6 w-6 text-gold-primary" />;
  } else if (typeLower.includes('factoring')) {
    return <PiggyBank className="h-6 w-6 text-gold-primary" />;
  } else if (typeLower.includes('leasing')) {
    return <Briefcase className="h-6 w-6 text-gold-primary" />;
  } else {
    return <LightbulbIcon className="h-6 w-6 text-gold-primary" />;
  }
};

// Updated function to generate slide content with theme-agnostic HTML structure
const generateSlides = (recommendation: FundingRecommendation, t: any) => {
  const slides = [];
  
  // Summary slide
  if (recommendation.summary) {
    slides.push({
      id: 'summary',
      title: t('summary', { default: 'Summary' }),
      content: `
        <div class="slide-content-centered">
          <h2 class="slide-title-main">${t('summary', { default: 'Summary' })}</h2>
          <div class="slide-text-large">${recommendation.summary}</div>
        </div>
      `,
      background_image: '/images/funding-summary-bg.jpg', // Keep background images for now
      transition: 'fade' as const
    });
  }
  
  // Analysis slide
  if (recommendation.analysis) {
    slides.push({
      id: 'analysis',
      title: t('analysis', { default: 'Analysis' }),
      content: `
        <div class="slide-content-normal">
          <h2 class="slide-title-section">${t('analysis', { default: 'Financial Analysis' })}</h2>
          <div class="slide-text-scrollable">${recommendation.analysis}</div>
        </div>
      `,
      background_image: '/images/analysis-bg.jpg',
      transition: 'slide' as const
    });
  }
  
  // Recommendation details slides
  if (recommendation.recommendation_details && recommendation.recommendation_details.length > 0) {
    slides.push({
      id: 'recommendations-intro',
      title: t('recommendations', { default: 'Funding Recommendations' }),
      content: `
        <div class="slide-content-centered">
          <h2 class="slide-title-main">${t('recommendations', { default: 'Funding Recommendations' })}</h2>
          <p class="slide-text-large">${t('recommendationsIntro', { default: 'Based on your financial data, the following funding options are most suitable for your business needs.' })}</p>
        </div>
      `,
      background_image: '/images/recommendations-bg.jpg',
      transition: 'zoom' as const
    });
    
    recommendation.recommendation_details.forEach((detail, index) => {
      const typeText = detail.type?.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || t('recommendation', { default: 'Recommendation' });
      // Icon HTML will be handled by React component rendering later, not in string
      slides.push({
        id: `recommendation-${index}`,
        title: typeText,
        // Content will be rendered by a sub-component for better styling and icon handling
        content: ``, // Placeholder, actual content rendered via component mapping
        type: detail.type, // Pass type and details for sub-component rendering
        details: detail.details,
        suitability_rationale: detail.suitability_rationale,
        background_image: '/images/recommendation-detail-bg.jpg',
        transition: 'slide' as const
      });
    });
  }
  
  if (recommendation.action_plan) {
    slides.push({
      id: 'action-plan',
      title: t('actionPlan', { default: 'Action Plan' }),
      content: `
        <div class="slide-content-normal">
          <h2 class="slide-title-section">${t('actionPlan', { default: 'Action Plan' })}</h2>
          <div class="slide-text-scrollable">${recommendation.action_plan}</div>
        </div>
      `,
      background_image: '/images/action-plan-bg.jpg',
      transition: 'fade' as const
    });
  }
  
  if (recommendation.outlook) {
    slides.push({
      id: 'outlook',
      title: t('outlook', { default: 'Financial Outlook' }),
      content: `
        <div class="slide-content-centered">
          <h2 class="slide-title-main">${t('outlook', { default: 'Financial Outlook' })}</h2>
          <div class="slide-text-large">${recommendation.outlook}</div>
        </div>
      `,
      background_image: '/images/outlook-bg.jpg',
      transition: 'zoom' as const
    });
  }
  return slides;
};

// New sub-component for rendering individual recommendation detail slides
const RecommendationDetailSlide = ({ slide, t }: { slide: any, t: any }) => {
  const IconComponent = getFundingTypeIcon(slide.type);
  return (
    <div className="slide-content-normal prose prose-invert prose-headings:text-gold-primary prose-p:text-gold-secondary prose-strong:text-gold-highlight text-gold-secondary">
      <div className="flex items-center mb-6">
        <div className="bg-gold-primary/10 p-3 rounded-full mr-4"> {/* Subtle gold background for icon */}
          {IconComponent}
        </div>
        <h2 className="slide-title-section !text-gold-primary">{slide.title}</h2> {/* Ensure title uses gold */} 
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-very-dark p-5 rounded-lg border border-gray-dark"> {/* Card-like styling */}
          <h3 className="text-xl font-semibold mb-3 text-gold-secondary">{t('description', { default: 'Description' })}</h3>
          <p>{slide.details || ''}</p>
        </div>
        <div className="bg-gray-very-dark p-5 rounded-lg border border-gray-dark"> {/* Card-like styling */}
          <h3 className="text-xl font-semibold mb-3 text-gold-secondary">{t('suitability', { default: 'Suitability' })}</h3>
          <p>{slide.suitability_rationale || ''}</p>
        </div>
      </div>
    </div>
  );
};

export default function RecommendationViewer({ recommendation, locale }: Props) {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common'); // For generic terms like 'Close'
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const slides = generateSlides(recommendation, t);

  // useEffect to reset currentSlide when recommendation changes to avoid out-of-bounds
  useEffect(() => {
    setCurrentSlide(0);
  }, [recommendation]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index);
    }
  }, [slides.length]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToSlide(currentSlide - 1);
      } else if (e.key === 'ArrowRight') {
        goToSlide(currentSlide + 1);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToSlide, currentSlide]);

  if (!slides.length) {
    return (
      <div className="flex items-center justify-center p-10 bg-gray-very-dark text-gold-secondary rounded-md min-h-[200px]">
        <LightbulbIcon className="h-8 w-8 mr-3 text-gold-primary" />
        <p>{t('noRecommendationDetails', { default: 'No recommendation details available.' })}</p>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  const slideContainerClasses = cn(
    'relative w-full text-gold-secondary overflow-hidden transition-all duration-500 ease-in-out',
    // Theming for the main viewer area - bg-black will be inherited from Step5Summary now
    isExpanded ? 'h-[70vh] sm:h-[80vh] md:h-[500px]' : 'h-[300px] sm:h-[350px]',
    'rounded-md bg-black' // No fullscreen styling
  );

  const controlButtonClasses = "border-gold-primary text-gold-primary hover:bg-gold-primary/10 p-2 w-9 h-9 sm:w-10 sm:h-10";

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full bg-gray-very-dark text-gold-secondary overflow-hidden border border-gray-dark rounded-lg shadow-xl transition-all duration-300 ease-in-out',
        {
          'h-[540px] lg:h-[620px]': !isExpanded, // Adjusted height (20% less than previous)
          'h-auto min-h-[700px]': isExpanded, 
        }
      )}
    >
      {/* Top Controls: Only Expand/Collapse */} 
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
        <Button variant="outline" size="default" onClick={toggleExpanded} className={controlButtonClasses}>
          {isExpanded ? <MinimizeIcon className="h-5 w-5" /> : <MaximizeIcon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Slide Content Area */}
      <div className="relative w-full h-full z-10">
        {currentSlideData.background_image && (
          <div className="absolute inset-0 z-0">
            <Image
              src={currentSlideData.background_image}
              alt={currentSlideData.title || 'Slide background'}
              fill
              className="object-cover opacity-10 md:opacity-15" // Slightly more subtle opacity
            />
          </div>
        )}
        <div className={cn(
          "relative z-20 flex flex-col items-center justify-center h-full transition-all duration-300 ease-in-out",
          "p-6 md:p-8"
        )}>
          {currentSlideData.id.startsWith('recommendation-') && currentSlideData.id !== 'recommendations-intro' ? (
            <RecommendationDetailSlide slide={currentSlideData} t={t} />
          ) : (
            <div 
              className="w-full h-full prose prose-invert prose-headings:text-gold-primary prose-p:text-gold-secondary prose-strong:text-gold-highlight text-gold-secondary overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-gold-primary) transparent' } as React.CSSProperties}
              dangerouslySetInnerHTML={{ __html: currentSlideData.content }}
            />
          )}
        </div>
      </div>

      {/* Navigation and Progress (only if multiple slides) */}
      {slides.length > 1 && (
        <>
          {/* Progress bar (more subtle) */}
          <div className="absolute left-0 w-full h-1 bg-gray-very-dark z-30 bottom-0">
            <div 
              className="h-full bg-gold-primary transition-all duration-300"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            />
          </div>

          {/* Prev/Next Buttons */}
          <Button
            variant="outline"
            size="default"
            onClick={() => goToSlide(currentSlide - 1)}
            disabled={currentSlide === 0}
            className={cn(
              controlButtonClasses,
              "absolute left-3 top-1/2 -translate-y-1/2 z-40 transition-opacity",
              currentSlide === 0 ? "opacity-0 pointer-events-none" : "opacity-60 hover:opacity-100"
            )}
            title={tCommon('previous')}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={() => goToSlide(currentSlide + 1)}
            disabled={currentSlide === slides.length - 1}
            className={cn(
              controlButtonClasses,
              "absolute right-3 top-1/2 -translate-y-1/2 z-40 transition-opacity",
              currentSlide === slides.length - 1 ? "opacity-0 pointer-events-none" : "opacity-60 hover:opacity-100"
            )}
            title={tCommon('next')}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>

          {/* Thumbnails (visible when expanded) */}
          {isExpanded && (
            <div className="absolute left-1/2 -translate-x-1/2 flex gap-2 z-40 bottom-4">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    index === currentSlide
                      ? 'bg-gold-primary scale-125 w-2.5 h-2.5' 
                      : 'bg-gray-dark hover:bg-gold-secondary/70'
                  )}
                />
              ))}
            </div>
          )}
        </>
      )}
      {/* Click to expand overlay when not expanded */} 
      {!isExpanded && slides.length > 0 && (
        <div 
            className="absolute inset-0 z-30 flex flex-col items-center justify-center cursor-pointer bg-black/30 hover:bg-black/10 transition-colors duration-300"
            onClick={toggleExpanded}
        >
            <div className="flex items-center text-gold-primary bg-black/70 p-3 rounded-md">
                <TrendingUp className="h-5 w-5 mr-2" />
                <p className="font-semibold">{t('clickToExpand', { default: 'Click to Expand Visual Summary' })}</p>
            </div>
            {slides.length > 1 && <p className="text-xs text-gold-secondary/70 mt-2">{t('slideCount', { current: currentSlide + 1, total: slides.length })}</p>}
        </div>
      )}
    </div>
  );
} 