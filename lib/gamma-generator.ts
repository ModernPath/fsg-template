/**
 * Gamma.app Integration
 * 
 * Creates professional presentations using Gamma.app Generate API
 * 
 * API Documentation: https://developers.gamma.app/
 * Note: Requires Pro or Ultra subscription
 */

export interface TeaserContent {
  title: string;
  tagline: string;
  summary: string;
  investmentHighlights: string[];
  businessOverview: {
    description: string;
    industry: string;
    products: string[];
    marketPosition: string;
  };
  financialSnapshot: {
    revenue: string;
    profitMargin: string;
    growthRate: string;
    ebitda: string;
  };
  competitiveAdvantages: string[];
  growthOpportunities: string[];
  idealBuyer: string[];
  transactionRationale: string;
  nextSteps: string;
}

export interface GammaSlide {
  type: 'title' | 'content' | 'two-column' | 'image' | 'quote';
  title?: string;
  content?: string;
  items?: string[];
  imageUrl?: string;
  quote?: string;
  author?: string;
}

export interface GammaPresentationRequest {
  title: string;
  description?: string;
  slides: GammaSlide[];
  theme?: string;
  brandColor?: string;
}

export interface GammaPresentationResponse {
  id: string;
  url: string;
  editUrl?: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

/**
 * Create a Gamma presentation from teaser content
 */
async function createGammaPresentation(
  teaserContent: TeaserContent,
  apiKey: string
): Promise<GammaPresentationResponse> {
  
  if (!apiKey || !apiKey.startsWith('sk-gamma-')) {
    throw new Error('Invalid Gamma API key. Must start with "sk-gamma-"');
  }

  // Build slides from teaser content
  const slides = buildTeaserSlides(teaserContent);

  // Gamma API request structure
  // For structured generation, we provide detailed slide content
  // The API may prefer 'text' field with markdown or 'slides' array
  const requestBody: GammaPresentationRequest = {
    title: teaserContent.title,
    description: teaserContent.summary,
    slides: slides,
    theme: 'professional',
    brandColor: '#D4AF37', // Gold for business/finance theme
  };

  // Alternative: If structured slides don't work, try text-based generation
  // const requestBody = {
  //   text: formatTeaserAsText(teaserContent),
  //   card_type: 'presentation',
  //   theme: 'professional'
  // };

  try {
    // Gamma API endpoint - using v1/cards for card/presentation generation
    // Based on Gamma API documentation at developers.gamma.app
    const response = await fetch('https://api.gamma.app/v1/cards', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey, // Gamma uses X-API-KEY header, not Bearer
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gamma API error:', errorText);
      throw new Error(`Gamma API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // Gamma API response structure:
    // {
    //   id: "card_abc123",
    //   url: "https://gamma.app/docs/...",
    //   edit_url: "https://gamma.app/edit/...",
    //   status: "completed" | "processing" | "failed"
    // }
    return {
      id: result.id || result.card_id || result.presentation_id,
      url: result.url || result.view_url || result.presentation_url,
      editUrl: result.edit_url || result.editUrl,
      status: result.status || 'processing',
      createdAt: result.created_at || result.createdAt || new Date().toISOString(),
    };

  } catch (error) {
    console.error('Failed to create Gamma presentation:', error);
    throw error;
  }
}

/**
 * Convert teaser content to Gamma slides
 */
function buildTeaserSlides(teaser: TeaserContent): GammaSlide[] {
  const slides: GammaSlide[] = [];

  // Slide 1: Title slide
  slides.push({
    type: 'title',
    title: teaser.title,
    content: teaser.tagline,
  });

  // Slide 2: Executive Summary
  slides.push({
    type: 'content',
    title: 'Executive Summary',
    content: teaser.summary,
  });

  // Slide 3: Investment Highlights
  slides.push({
    type: 'content',
    title: 'Investment Highlights',
    items: teaser.investmentHighlights,
  });

  // Slide 4: Business Overview
  slides.push({
    type: 'content',
    title: 'Business Overview',
    content: teaser.businessOverview.description,
    items: [
      `Industry: ${teaser.businessOverview.industry}`,
      `Market Position: ${teaser.businessOverview.marketPosition}`,
    ],
  });

  // Slide 5: Products & Services
  if (teaser.businessOverview.products && teaser.businessOverview.products.length > 0) {
    slides.push({
      type: 'content',
      title: 'Products & Services',
      items: teaser.businessOverview.products,
    });
  }

  // Slide 6: Financial Snapshot
  slides.push({
    type: 'two-column',
    title: 'Financial Snapshot',
    items: [
      `Revenue: ${teaser.financialSnapshot.revenue}`,
      `Profit Margin: ${teaser.financialSnapshot.profitMargin}`,
      `Growth Rate: ${teaser.financialSnapshot.growthRate}`,
      `EBITDA: ${teaser.financialSnapshot.ebitda}`,
    ],
  });

  // Slide 7: Competitive Advantages
  if (teaser.competitiveAdvantages && teaser.competitiveAdvantages.length > 0) {
    slides.push({
      type: 'content',
      title: 'Competitive Advantages',
      items: teaser.competitiveAdvantages,
    });
  }

  // Slide 8: Growth Opportunities
  if (teaser.growthOpportunities && teaser.growthOpportunities.length > 0) {
    slides.push({
      type: 'content',
      title: 'Growth Opportunities',
      items: teaser.growthOpportunities,
    });
  }

  // Slide 9: Ideal Buyer Profile
  if (teaser.idealBuyer && teaser.idealBuyer.length > 0) {
    slides.push({
      type: 'content',
      title: 'Ideal Buyer Profile',
      items: teaser.idealBuyer,
    });
  }

  // Slide 10: Transaction Rationale
  slides.push({
    type: 'content',
    title: 'Why Now?',
    content: teaser.transactionRationale,
  });

  // Slide 11: Next Steps
  slides.push({
    type: 'content',
    title: 'Next Steps',
    content: teaser.nextSteps,
  });

  return slides;
}

/**
 * Check Gamma presentation status
 */
async function checkGammaStatus(
  presentationId: string,
  apiKey: string
): Promise<GammaPresentationResponse> {
  
  // Using v1/cards endpoint for status checks
  const response = await fetch(`https://api.gamma.app/v1/cards/${presentationId}`, {
    method: 'GET',
    headers: {
      'X-API-KEY': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check Gamma status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Alternative: Generate presentation using Gamma AI prompt
 * (if the structured API above doesn't work)
 */
async function createGammaPresentationFromPrompt(
  prompt: string,
  apiKey: string
): Promise<GammaPresentationResponse> {
  
  // Using v1/cards endpoint with text-based generation
  const response = await fetch('https://api.gamma.app/v1/cards', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: prompt, // Gamma API uses 'text' field for prompt-based generation
      card_type: 'presentation', // Specify we want a presentation
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gamma API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Export functions
export { createGammaPresentation, createGammaPresentationFromPrompt, checkGammaStatus };
