'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
// Correct import path based on frontend rules
import { useAuth } from '@/components/auth/AuthProvider'
// Use next-intl for translations
import { useTranslations } from 'next-intl'
import { Database } from '@/types/supabase'
import { Skeleton } from '@/components/ui/skeleton'
// Import only the Alert component
import { Alert } from '@/components/ui/alert'
import { Terminal, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from 'date-fns'
import { Button } from "@/components/ui/button"
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign,
  Info,
  FileText,
  Target,
  Briefcase,
  Download,
  Eye as EyeIcon,
  ExternalLink
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// Define types matching the enhanced API response
// Use 'any' for related types temporarily due to potential Supabase type issues
type FinancingNeed = any
type FundingRecommendation = any
type FundingApplication = any
type LenderApplication = any
type FinancingOffer = any

type CompanyWithDetails = Database['public']['Tables']['companies']['Row'] & {
  creator_email: string | null
  financing_needs: FinancingNeed[]
  funding_recommendations: FundingRecommendation[]
  funding_applications: (FundingApplication & {
    lender_applications: (LenderApplication & {
      lender: any
      financing_offers: FinancingOffer[]
    })[]
  })[]
  metadata?: any // Add metadata as optional field
  documents?: any[] // Add documents array
}

// Enhanced data field component with tooltip support
const DataField = ({ 
  label, 
  value, 
  tooltip, 
  icon: Icon,
  className = "" 
}: { 
  label: string; 
  value: React.ReactNode | string | number | null | undefined;
  tooltip?: string;
  icon?: React.ElementType;
  className?: string;
}) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  const content = (
    <div className={`flex items-start gap-3 py-2 ${className}`}>
      {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
        <div className="text-sm text-foreground break-words">{value}</div>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              {content}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

// Financial data tooltip component
const FinancialTooltip = ({ metadata }: { metadata: any }) => {
  if (!metadata?.financial_data?.yearly) return null;

  const formatCurrency = (value: any) => {
    if (!value || value === "Not available") return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-3 max-w-md">
      <h4 className="font-semibold flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        Taloustiedot (5 vuotta)
      </h4>
      <div className="space-y-2">
        {metadata.financial_data.yearly.slice(0, 5).map((year: any) => (
          <div key={year.year} className="text-xs border-b border-muted pb-2 last:border-b-0">
            <div className="font-medium">{year.year}</div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <div>Liikevaihto: {formatCurrency(year.revenue)}</div>
              <div>Tulos: {formatCurrency(year.profit)}</div>
              <div>Liiketulos: {formatCurrency(year.operating_profit)}</div>
              <div>EBITDA: {formatCurrency(year.ebitda)}</div>
            </div>
          </div>
        ))}
      </div>
      {metadata.financial_data.last_updated && (
        <div className="text-xs text-muted-foreground">
          Päivitetty: {format(new Date(metadata.financial_data.last_updated), 'dd.MM.yyyy HH:mm')}
        </div>
      )}
    </div>
  );
};

// YTJ data tooltip component  
const YTJTooltip = ({ metadata }: { metadata: any }) => {
  if (!metadata?.ytj_data) return null;

  const ytj = metadata.ytj_data;

  return (
    <div className="space-y-3 max-w-md">
      <h4 className="font-semibold flex items-center gap-2">
        <FileText className="h-4 w-4" />
        YTJ-tiedot
      </h4>
      <div className="space-y-1 text-xs">
        {ytj.companyForm && <div><span className="font-medium">Yhtiömuoto:</span> {ytj.companyForm}</div>}
        {ytj.status && <div><span className="font-medium">Tila:</span> {ytj.status}</div>}
        {ytj.registrationDate && <div><span className="font-medium">Rekisteröintipvm:</span> {format(new Date(ytj.registrationDate), 'dd.MM.yyyy')}</div>}
        {ytj.mainBusinessLine && <div><span className="font-medium">Päätoimiala:</span> {ytj.mainBusinessLine}</div>}
        {ytj.postalAddress && <div><span className="font-medium">Postiosoite:</span> {ytj.postalAddress}</div>}
        {ytj.postalCity && <div><span className="font-medium">Postitoimipaikka:</span> {ytj.postalCity}</div>}
        {ytj.euId && <div><span className="font-medium">EU-tunnus:</span> {ytj.euId}</div>}
      </div>
    </div>
  );
};

// Collapsible section component
const CollapsibleSection = ({ 
  title, 
  children, 
  defaultOpen = false,
  icon: Icon
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  icon?: React.ElementType;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5" />}
            {title}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CardTitle>
      </CardHeader>
      {isOpen && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
};

const RecommendationItem = ({ rec, t: adminT }: { rec: FundingRecommendation; t: any }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const onboardingT = useTranslations('Onboarding')

  return (
    <div className="mb-4 pb-4 border-b border-muted last:border-b-0 last:mb-0 last:pb-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Suositus #{rec.id?.slice(0, 8) || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {rec.created_at ? format(new Date(rec.created_at), 'dd.MM.yyyy HH:mm') : 'N/A'}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            <Eye className="h-3 w-3 mr-1" />
            {isExpanded ? 'Piilota' : 'Näytä'}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-dashed pt-4">
          {/* Use adminT for all other fields in this component */}
          <DataField label={adminT('recommendations.summary')} value={<pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">{rec.summary}</pre>} />
          <DataField label={adminT('recommendations.analysis')} value={<pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">{rec.analysis}</pre>} />
          <DataField label={adminT('recommendations.actionPlan')} value={<pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">{rec.action_plan}</pre>} />
          <DataField label={adminT('recommendations.outlook')} value={<pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">{rec.outlook}</pre>} />
          
          <h6 className="text-sm font-semibold pt-3 border-t border-dashed mt-3">{adminT('recommendations.detailsTitle')}:</h6>
          {rec.recommendation_details && Array.isArray(rec.recommendation_details) && rec.recommendation_details.length > 0 ? (
            rec.recommendation_details.map((detail: any, detailIndex: number) => (
              <div key={detailIndex} className="mt-3 pt-3 border-t border-dashed border-muted-foreground/50 pl-4">
                 {/* Use onboardingT for the nested type */}
                 <DataField label={adminT('recommendations.type')} value={onboardingT(`recommendationType.${detail.type}`)} /> 
                 <DataField label={adminT('recommendations.amount')} value={`${detail.recommended_amount || 'N/A'} ${detail.currency || ''}`} />
                 <DataField label={adminT('recommendations.rationale')} value={detail.suitability_rationale} />
                 <DataField label={adminT('recommendations.details')} value={detail.details} /> 
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm mt-2 pl-4">{adminT('recommendations.noDetails')}</p>
          )}
        </div>
      )}
    </div>
  )
}

const FinancingOfferItem = ({ offer, t: adminT }: { offer: FinancingOffer; t: any }) => {
  const formatCurrency = (amount: number | string | null, currency = 'EUR') => {
    if (!amount) return '-'
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: currency
    }).format(numAmount)
  }

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-muted-foreground/50 pl-6">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="h-3 w-3 text-green-600" />
        <span className="text-xs font-medium text-green-600">Tarjous #{offer.id?.slice(0, 8) || 'N/A'}</span>
        <Badge variant="secondary" className="text-xs">{offer.status}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <DataField label={adminT('offers.amount')} value={formatCurrency(offer.amount, offer.currency)} />
        <DataField label={adminT('offers.interestRate')} value={offer.interest_rate ? `${offer.interest_rate}%` : 'N/A'} />
        <DataField label={adminT('offers.term')} value={offer.term_months ? `${offer.term_months} kk` : 'N/A'} />
        <DataField label={adminT('offers.createdAt')} value={offer.created_at ? format(new Date(offer.created_at), 'dd.MM.yyyy') : 'N/A'} />
      </div>
      {offer.terms && (
        <DataField 
          label={adminT('offers.terms')} 
          value={<pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-2">{JSON.stringify(offer.terms, null, 2)}</pre>} 
        />
      )}
    </div>
  )
}

const LenderApplicationItem = ({ lenderApp, t: adminT }: { lenderApp: LenderApplication & { lender: any; financing_offers: FinancingOffer[] }; t: any }) => {
  return (
    <div className="mt-3 pt-3 border-t border-dashed border-muted-foreground/50 pl-4">
      <div className="flex items-center gap-2 mb-2">
        <Briefcase className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-600">
          Lainantarjoaja: {lenderApp.lender?.name || 'Tuntematon'}
        </span>
        <Badge variant="secondary">{lenderApp.status}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <DataField label={adminT('lenderApplications.submittedAt')} value={lenderApp.submitted_at ? format(new Date(lenderApp.submitted_at), 'dd.MM.yyyy HH:mm') : 'N/A'} />
        <DataField label={adminT('lenderApplications.lenderType')} value={lenderApp.lender?.type || 'N/A'} />
      </div>
      
      {/* Display financing offers */}
      {lenderApp.financing_offers && lenderApp.financing_offers.length > 0 ? (
        lenderApp.financing_offers.map((offer: FinancingOffer, offerIndex: number) => (
          <FinancingOfferItem key={offer.id || offerIndex} offer={offer} t={adminT} />
        ))
      ) : (
        <p className="text-muted-foreground text-xs mt-2 italic bg-slate-100 dark:bg-slate-700 p-2 rounded">{adminT('offers.notFound')}</p>
      )}
    </div>
  )
}

export default function AdminCompanyDetailsPage() {
  // Use useTranslations from next-intl
  const t = useTranslations('Admin.CompanyDetail')
  const params = useParams<{ locale: string; companyId: string }>()
  const { session, loading: authLoading } = useAuth()
  const [company, setCompany] = useState<CompanyWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null)

  const companyId = params.companyId

  // Handle document download
  const handleDownloadDocument = async (documentId: string, documentName: string) => {
    if (!session) return;
    
    try {
      setDownloadingDoc(documentId);
      
      const response = await fetch(`/api/admin/documents/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        // Try to parse error as JSON first
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to download document');
        } else {
          throw new Error(`Failed to download document: ${response.statusText}`);
        }
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentName;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Error downloading document:', err);
      alert(err instanceof Error ? err.message : 'Failed to download document');
    } finally {
      setDownloadingDoc(null);
    }
  }

  // Handle document preview (opens in new tab)
  const handlePreviewDocument = async (documentId: string) => {
    if (!session) return;
    
    try {
      const response = await fetch(`/api/admin/documents/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        // Try to parse error as JSON first
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load document');
        } else {
          throw new Error(`Failed to load document: ${response.statusText}`);
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Cleanup after a delay (5 seconds)
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 5000);
      
    } catch (err) {
      console.error('Error previewing document:', err);
      alert(err instanceof Error ? err.message : 'Failed to preview document');
    }
  }

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!session || !companyId) {
        // Wait for session or if companyId is missing
        if (!authLoading && !session) {
          setError('Unauthorized. Please log in.')
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/companies/${companyId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        if (result.data) {
          setCompany(result.data as CompanyWithDetails)
        } else {
           throw new Error('Company data not found in response.')
        }
      } catch (err: any) {
        console.error('Failed to fetch company details:', err)
        setError(err.message || 'Failed to fetch company details.')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchCompanyDetails()
    }
  }, [companyId, session, authLoading])

  // Helper functions
  const formatAddress = (address: any) => {
    if (!address) return null;
    if (typeof address === 'string') return address;
    
    const parts = [
      address.street,
      address.postal_code && address.city ? `${address.postal_code} ${address.city}` : address.city,
      address.country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const formatContactInfo = (contactInfo: any) => {
    if (!contactInfo || typeof contactInfo !== 'object') return null;
    
    const info = [];
    if ((contactInfo as any).email) info.push(`📧 ${(contactInfo as any).email}`);
    if ((contactInfo as any).phone) info.push(`📞 ${(contactInfo as any).phone}`);
    
    return info.length > 0 ? info.join(' • ') : null;
  };

  const formatArray = (arr: any[]) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
    return arr.filter(item => item && item !== 'Ei tietoa saatavilla').join(', ');
  };

  const getLatestFinancialData = (metadata: any) => {
    if (!metadata?.financial_data?.latest) return null;
    
    const latest = metadata.financial_data.latest;
    const formatCurrency = (value: any) => {
      if (!value || value === "Not available") return 'Ei tietoa';
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) return 'Ei tietoa';
      return new Intl.NumberFormat('fi-FI', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
      }).format(num);
    };

    return {
      year: latest.year,
      revenue: formatCurrency(latest.revenue),
      profit: formatCurrency(latest.profit),
      operating_profit: formatCurrency(latest.operating_profit)
    };
  };

  // Helper function to format financing needs summary
  const formatFinancingNeedsSummary = (need: any) => {
    if (!need) return null;
    
    const parts = [];
    
    // Add amount if available
    if (need.amount && need.currency) {
      parts.push(`${new Intl.NumberFormat('fi-FI', {
        style: 'currency',
        currency: need.currency,
        maximumFractionDigits: 0
      }).format(need.amount)}`);
    }
    
    // Add purpose if available
    if (need.purpose) {
      parts.push(`Tarkoitus: ${need.purpose}`);
    }
    
    // Add time horizon if available
    if (need.time_horizon) {
      parts.push(`Aikataulu: ${need.time_horizon}`);
    }
    
    // Add urgency if available
    if (need.urgency) {
      parts.push(`Kiireellisyys: ${need.urgency}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  // Helper function to format questionnaire data
  const formatQuestionnaireData = (requirements: any) => {
    if (!requirements || typeof requirements !== 'object') return null;
    
    const sections = [];
    
    // Cash Management purposes
    if (requirements.purpose_cashManagement && requirements.purpose_cashManagement.length > 0) {
      sections.push({
        title: "Kassanhallinta",
        items: requirements.purpose_cashManagement
      });
    }
    
    // Growth purposes
    if (requirements.purpose_growth && requirements.purpose_growth.length > 0) {
      sections.push({
        title: "Kasvutavoitteet",
        items: requirements.purpose_growth
      });
    }
    
    // Structure purposes
    if (requirements.purpose_structure && requirements.purpose_structure.length > 0) {
      sections.push({
        title: "Rakenteelliset muutokset",
        items: requirements.purpose_structure
      });
    }
    
    // Company situation
    if (requirements.companySituation && requirements.companySituation.length > 0) {
      sections.push({
        title: "Yrityksen tilanne",
        items: Array.isArray(requirements.companySituation) ? requirements.companySituation : [requirements.companySituation]
      });
    }
    
    // Current revenue
    if (requirements.currentRevenue) {
      sections.push({
        title: "Nykyinen liikevaihto",
        items: [requirements.currentRevenue]
      });
    }
    
    // Funding amount
    if (requirements.fundingAmount) {
      sections.push({
        title: "Haettu rahoitusmäärä",
        items: [`${requirements.fundingAmount} EUR`]
      });
    }
    
    // Collateral options
    if (requirements.collateralOptions && requirements.collateralOptions.length > 0) {
      sections.push({
        title: "Vakuusvaihtoehdot",
        items: requirements.collateralOptions
      });
    }
    
    // Additional details  
    if (requirements.situationDetails) {
      sections.push({
        title: "Lisätiedot tilanteesta",
        items: [requirements.situationDetails]
      });
    }
    
    if (requirements.collateralDetails) {
      sections.push({
        title: "Vakuuksien lisätiedot", 
        items: [requirements.collateralDetails]
      });
    }
    
    // Other purpose details
    if (requirements.purpose_other) {
      sections.push({
        title: "Muu rahoitustarve",
        items: [requirements.purpose_other]
      });
    }
    
    // Factoring details
    const factoringDetails = [];
    if (requirements.factoring_monthlyInvoices) factoringDetails.push(`Kuukausittaiset laskut: ${requirements.factoring_monthlyInvoices}`);
    if (requirements.factoring_paymentDays) factoringDetails.push(`Maksupäivät: ${requirements.factoring_paymentDays}`);
    if (requirements.factoring_customerLocation) factoringDetails.push(`Asiakkaiden sijainti: ${requirements.factoring_customerLocation}`);
    
    if (factoringDetails.length > 0) {
      sections.push({
        title: "Factoring-tiedot",
        items: factoringDetails
      });
    }
    
    // Consolidation details
    const consolidationDetails = [];
    if (requirements.consolidation_totalAmount) consolidationDetails.push(`Yhteissumma: ${requirements.consolidation_totalAmount}`);
    if (requirements.consolidation_mainGoal) consolidationDetails.push(`Päätavoite: ${requirements.consolidation_mainGoal}`);
    if (requirements.consolidation_collateral) consolidationDetails.push(`Vakuudet: ${requirements.consolidation_collateral}`);
    
    if (consolidationDetails.length > 0) {
      sections.push({
        title: "Lainojen yhdistäminen",
        items: consolidationDetails
      });
    }
    
    return sections;
  };

  if (loading || authLoading) {
    return (
      <div className="space-y-4 p-4 md:p-8">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Card className="mb-6">
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        {[1, 2, 3].map(i => (
           <Card key={i} className="mb-6">
             <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
             <CardContent><Skeleton className="h-4 w-1/2" /></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <Alert variant="destructive">
          <div className="flex items-center mb-1">
             <Terminal className="h-4 w-4 mr-2 flex-shrink-0" />
             <h5 className="font-medium">{t('error.title')}</h5>
          </div>
          <p className="text-sm ml-6">{error}</p>
        </Alert>
      </div>
    )
  }

  if (!company) {
    return (
       <div className="p-4 md:p-8">
        <Alert>
           <div className="flex items-center mb-1">
             <Terminal className="h-4 w-4 mr-2 flex-shrink-0" />
             <h5 className="font-medium">{t('notFound.title')}</h5>
          </div>
          <p className="text-sm ml-6">{t('notFound.message', { companyId })}</p>
        </Alert>
      </div>
    )
  }

  const latestFinancials = getLatestFinancialData(company.metadata);

  // Component for displaying detailed questionnaire data
  const QuestionnaireViewer = ({ requirements }: { requirements: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const sections = formatQuestionnaireData(requirements);
    
    if (!sections || sections.length === 0) {
      return (
        <div className="text-muted-foreground text-sm italic">
          Kyselyn tietoja ei ole saatavilla
        </div>
      );
    }
    
    return (
      <div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsOpen(!isOpen)}
          className="mb-3"
        >
          {isOpen ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {isOpen ? 'Piilota kyselyn tulokset' : 'Näytä koko kysely'}
        </Button>
        
        {isOpen && (
          <div className="bg-muted/50 p-4 rounded-lg border space-y-4">
            {sections.map((section, index) => (
              <div key={index} className="border-b border-muted pb-3 last:border-b-0 last:pb-0">
                <h4 className="font-medium text-sm text-white mb-2">{section.title}</h4>
                <div className="space-y-1">
                  {section.items.map((item: string, itemIndex: number) => (
                    <div key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-white">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="h-6 w-6" />
            {company.name}
          </h1>
          <div className="flex items-center gap-2">
            {company.metadata?.ytj_data && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    YTJ-tiedot
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <YTJTooltip metadata={company.metadata} />
                </TooltipContent>
              </Tooltip>
            )}
            {company.metadata?.financial_data && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Taloustiedot
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <FinancialTooltip metadata={company.metadata} />
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Basic Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('companyInfo.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <DataField 
                  label={t('companyInfo.id')} 
                  value={company.id} 
                  icon={Terminal}
                  tooltip="Yrityksen sisäinen tunniste järjestelmässä"
                />
                <DataField 
                  label={t('companyInfo.businessId')} 
                  value={company.business_id} 
                  icon={FileText}
                  tooltip="Virallinen Y-tunnus"
                />
                <DataField 
                  label={t('companyInfo.name')} 
                  value={company.name} 
                  icon={Building2}
                />
                <DataField 
                  label={t('companyInfo.type')} 
                  value={company.type} 
                  icon={Badge}
                />
                <DataField 
                  label={t('companyInfo.industry')} 
                  value={company.industry} 
                  icon={Briefcase}
                />
              </div>
              <div className="space-y-4">
                <DataField 
                  label={t('companyInfo.founded')} 
                  value={company.founded ? format(new Date(company.founded), 'dd.MM.yyyy') : null} 
                  icon={Calendar}
                />
                <DataField 
                  label={t('companyInfo.employees')} 
                  value={company.employees} 
                  icon={Users}
                />
                <DataField 
                  label={t('companyInfo.website')} 
                  value={company.website ? (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {company.website}
                    </a>
                  ) : null}
                  icon={Globe}
                />
                <DataField 
                  label={t('companyInfo.createdAt')} 
                  value={company.created_at ? format(new Date(company.created_at), 'dd.MM.yyyy HH:mm') : null} 
                  icon={Calendar}
                />
                <DataField 
                  label={t('companyInfo.creatorEmail')} 
                  value={company.creator_email || t('companyInfo.creatorUnknown')} 
                  icon={Mail}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Yhteystiedot ja Osoite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <DataField 
                  label="Osoite" 
                  value={formatAddress(company.address)} 
                  icon={MapPin}
                />
                <DataField 
                  label="Yhteystiedot" 
                  value={formatContactInfo(company.contact_info)} 
                  icon={Mail}
                />
              </div>
              <div className="space-y-4">
                {(company.contact_info as any)?.email && (
                  <DataField 
                    label="Sähköposti" 
                    value={(company.contact_info as any).email} 
                    icon={Mail}
                  />
                )}
                {(company.contact_info as any)?.phone && (
                  <DataField 
                    label="Puhelinnumero" 
                    value={(company.contact_info as any).phone} 
                    icon={Phone}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Liiketoimintatiedot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(company as any).description && (
                <DataField 
                  label="Yrityksen kuvaus" 
                  value={
                    <div className="bg-muted p-3 rounded-lg text-sm">
                      {(company as any).description}
                    </div>
                  } 
                  icon={FileText}
                />
              )}
              <DataField 
                label="Tuotteet ja palvelut" 
                value={formatArray((company as any).products)} 
                icon={Briefcase}
              />
              <DataField 
                label="Markkina-alue" 
                value={(company as any).market} 
                icon={Target}
              />
              <DataField 
                label="Keskeiset kilpailijat" 
                value={formatArray((company as any).key_competitors)} 
                icon={TrendingUp}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        {latestFinancials && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Viimeisimmät taloustiedot ({latestFinancials.year})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DataField 
                  label="Liikevaihto" 
                  value={latestFinancials.revenue} 
                  icon={TrendingUp}
                  className="bg-green-50 dark:bg-green-950 rounded-lg p-3"
                />
                <DataField 
                  label="Tulos" 
                  value={latestFinancials.profit} 
                  icon={DollarSign}
                  className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3"
                />
                <DataField 
                  label="Liiketulos" 
                  value={latestFinancials.operating_profit} 
                  icon={TrendingUp}
                  className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Collapsible Sections */}
        <CollapsibleSection title={t('fundingNeeds.title')} icon={Target}>
          {company.financing_needs && company.financing_needs.length > 0 ? (
            company.financing_needs.map((need, index) => (
              <div key={need.id || index} className={`pb-6 ${index < company.financing_needs.length - 1 ? 'mb-6 border-b border-muted' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <DataField label={t('fundingNeeds.id')} value={need.id} icon={Terminal} />
                  <DataField 
                    label={t('fundingNeeds.amount')} 
                    value={need.amount && need.currency ? `${new Intl.NumberFormat('fi-FI', {
                      style: 'currency',
                      currency: need.currency,
                      maximumFractionDigits: 0
                    }).format(need.amount)}` : 'Määrä ei määritelty'} 
                    icon={DollarSign} 
                  />
                  <DataField label={t('fundingNeeds.purpose')} value={need.purpose || 'Tarkoitus ei määritelty'} icon={Target} />
                  <DataField label={t('fundingNeeds.createdAt')} value={need.created_at ? format(new Date(need.created_at), 'dd.MM.yyyy HH:mm') : null} icon={Calendar} />
                </div>
                
                {/* Enhanced summary */}
                {formatFinancingNeedsSummary(need) && (
                  <DataField 
                    label="Tiivistelmä" 
                    value={
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                        <p className="text-sm">{formatFinancingNeedsSummary(need)}</p>
                      </div>
                    } 
                    icon={Info} 
                  />
                )}
                
                {/* Description */}
                {need.description && (
                  <DataField 
                    label="Kuvaus" 
                    value={
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">{need.description}</p>
                      </div>
                    } 
                    icon={FileText} 
                  />
                )}
                
                {/* Detailed questionnaire data */}
                <DataField 
                  label={t('fundingNeeds.requirements')} 
                  value={<QuestionnaireViewer requirements={need.requirements} />} 
                  icon={FileText}
                />
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">{t('fundingNeeds.notFound')}</p>
          )}
        </CollapsibleSection>

        <CollapsibleSection title={t('recommendations.title')} icon={Target}>
          {company.funding_recommendations && company.funding_recommendations.length > 0 ? (
             company.funding_recommendations.map((rec, index) => (
               <RecommendationItem key={rec.id || index} rec={rec} t={t} />
             ))
          ) : (
            <p className="text-muted-foreground text-sm">{t('recommendations.notFound')}</p>
          )}
        </CollapsibleSection>

        <CollapsibleSection title={t('applications.title')} icon={FileText} defaultOpen>
          {company.funding_applications && company.funding_applications.length > 0 ? (
             company.funding_applications.map((app, index) => (
              <div key={app.id || index} className={`pb-4 ${index < company.funding_applications.length - 1 ? 'mb-4 border-b border-muted' : ''}`}>
                 <DataField label={t('applications.id')} value={app.id} icon={Terminal} />
                 <DataField label={t('applications.type')} value={app.type} icon={FileText} />
                                   <DataField label={t('applications.status')} value={<Badge variant="secondary">{app.status}</Badge>} icon={Info} />
                 <DataField label={t('applications.amount')} value={`${app.amount || 'N/A'} ${app.currency || ''}`} icon={DollarSign} />
                 <DataField label={t('applications.term')} value={app.term_months} icon={Calendar} />
                 <DataField label={t('applications.userId')} value={app.user_id} icon={Users} />
                 <DataField label={t('applications.submittedAt')} value={app.submitted_at ? format(new Date(app.submitted_at), 'dd.MM.yyyy HH:mm') : (app.created_at ? `${format(new Date(app.created_at), 'dd.MM.yyyy HH:mm')} (${t('applications.draft')})` : null)} icon={Calendar} />
                 <DataField 
                   label={t('applications.applicantDetails')} 
                   value={app.applicant_details ? <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">{JSON.stringify(app.applicant_details, null, 2)}</pre> : 'N/A'} 
                   icon={FileText}
                 />
                 
                 {/* Display lender applications */}
                 {app.lender_applications && app.lender_applications.length > 0 ? (
                   <div className="mt-4">
                     {app.lender_applications.map((lenderApp: any, lenderIndex: number) => (
                       <LenderApplicationItem key={lenderApp.id || lenderIndex} lenderApp={lenderApp} t={t} />
                     ))}
                   </div>
                 ) : (
                   <p className="text-muted-foreground text-xs mt-3 italic bg-slate-100 dark:bg-slate-700 p-2 rounded">{t('lenderApplications.notFound')}</p>
                 )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">{t('applications.notFound')}</p>
          )}
        </CollapsibleSection>

        {/* Documents Section */}
        <CollapsibleSection title="Dokumentit" icon={FileText} defaultOpen>
          {company.documents && company.documents.length > 0 ? (
            <div className="space-y-4">
              {company.documents.map((doc: any, index: number) => (
                <div key={doc.id || index} className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {doc.document_types?.name || 'Tuntematon tyyppi'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewDocument(doc.id)}
                              className="gap-2"
                            >
                              <EyeIcon className="h-4 w-4" />
                              Esikatsele
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Avaa dokumentti uuteen välilehteen</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc.id, doc.name)}
                              disabled={downloadingDoc === doc.id}
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              {downloadingDoc === doc.id ? 'Ladataan...' : 'Lataa'}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Lataa dokumentti tietokoneellesi</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DataField 
                      label="Tiedostokoko" 
                      value={doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB` : 'Tuntematon'} 
                      icon={Info}
                    />
                    <DataField 
                      label="Tilikausi" 
                      value={doc.fiscal_year ? `${doc.fiscal_year} (${doc.fiscal_period || 'annual'})` : 'Ei määritelty'} 
                      icon={Calendar}
                    />
                    <DataField 
                      label="Käsittelytila" 
                      value={
                        <Badge variant={doc.processed ? 'default' : 'secondary'}>
                          {doc.processing_status === 'completed' ? 'Valmis' :
                           doc.processing_status === 'processing' ? 'Käsitellään' :
                           doc.processing_status === 'failed' ? 'Epäonnistui' :
                           doc.processing_status === 'pending' ? 'Odottaa' : 
                           doc.processing_status || 'Tuntematon'}
                        </Badge>
                      } 
                      icon={Info}
                    />
                    <DataField 
                      label="Ladattu" 
                      value={doc.uploaded_at ? format(new Date(doc.uploaded_at), 'dd.MM.yyyy HH:mm') : 'Tuntematon'} 
                      icon={Calendar}
                    />
                    <DataField 
                      label="MIME-tyyppi" 
                      value={doc.mime_type || 'Tuntematon'} 
                      icon={Info}
                    />
                    {doc.fiscal_period && (
                      <DataField 
                        label="Jakso" 
                        value={doc.fiscal_period} 
                        icon={Calendar}
                      />
                    )}
                  </div>
                  
                  {/* Show extraction data if available */}
                  {doc.extraction_data && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Talousdata
                      </h4>
                      <div className="bg-muted p-3 rounded-lg">
                        <pre className="text-xs overflow-auto max-h-32">
                          {JSON.stringify(doc.extraction_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {/* Show metadata if available */}
                  {doc.metadata && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Metatiedot
                      </h4>
                      <div className="bg-muted p-3 rounded-lg">
                        <pre className="text-xs overflow-auto max-h-24">
                          {JSON.stringify(doc.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Ei dokumentteja löytynyt</p>
              <p className="text-sm text-muted-foreground">Asiakas ei ole vielä ladannut dokumentteja tai ne eivät ole näkyviä.</p>
            </div>
          )}
        </CollapsibleSection>
      </div>
    </TooltipProvider>
  )
} 