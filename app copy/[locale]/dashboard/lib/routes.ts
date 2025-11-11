import { 
  UserCircle, 
  FileText, 
  LineChart, 
  TrendingUp,
  Upload,
  Settings,
  Goal,
  EuroIcon,
  CalendarDays,
  Target,
  Building2,
  BarChart3
} from 'lucide-react'

// Dashboard step IDs
export const DASHBOARD_STEPS = {
  FUNDING_NEEDS: 'funding-needs',
  DOCUMENTS: 'documents',
  RECOMMENDATIONS: 'recommendations',
  COMPANY_PROFILE: 'company-profile',
  FINANCIAL_DASHBOARD: 'financial-dashboard'
} as const;

export type DashboardStep = typeof DASHBOARD_STEPS[keyof typeof DASHBOARD_STEPS];

// Dashboard routes configuration
export const DASHBOARD_ROUTES = [
  {
    id: DASHBOARD_STEPS.FUNDING_NEEDS,
    path: '/funding-needs',
    label: 'fundingNeeds',
    icon: EuroIcon,
    requiredSteps: []
  },
  {
    id: DASHBOARD_STEPS.DOCUMENTS,
    path: '/documents',
    label: 'documents',
    icon: FileText,
    requiredSteps: [DASHBOARD_STEPS.FUNDING_NEEDS]
  },
  {
    id: DASHBOARD_STEPS.RECOMMENDATIONS,
    path: '/recommendations',
    label: 'Dashboard.recommendationsTitle',
    icon: TrendingUp,
    requiredSteps: [DASHBOARD_STEPS.FUNDING_NEEDS, DASHBOARD_STEPS.DOCUMENTS]
  },
  {
    id: DASHBOARD_STEPS.COMPANY_PROFILE,
    path: '/company-profile',
    label: 'companyProfile',
    icon: Building2,
    requiredSteps: [DASHBOARD_STEPS.FUNDING_NEEDS, DASHBOARD_STEPS.DOCUMENTS, DASHBOARD_STEPS.RECOMMENDATIONS]
  },
  {
    id: DASHBOARD_STEPS.FINANCIAL_DASHBOARD,
    path: '/',
    label: 'financialDashboard',
    icon: BarChart3,
    requiredSteps: [DASHBOARD_STEPS.FUNDING_NEEDS, DASHBOARD_STEPS.DOCUMENTS, DASHBOARD_STEPS.RECOMMENDATIONS, DASHBOARD_STEPS.COMPANY_PROFILE]
  }
];

// Get the localized route path with locale prefix
export function getLocalizedRoute(locale: string, routePath: string) {
  return `/${locale}/dashboard${routePath}`;
}

// Get the relative route path without locale prefix
export function getRelativeRoute(routePath: string) {
  // If it's the root dashboard path ('/'), return empty string
  if (routePath === '/') return '';
  
  // Otherwise, return the path with leading slash removed to make it relative
  return routePath.startsWith('/') ? routePath.substring(1) : routePath;
}

// Get next route based on current step
export function getNextRoute(currentStepId: string): string | null {
  const steps = Object.values(DASHBOARD_ROUTES)
    .filter(route => 'requiredSteps' in route)
    .sort((a, b) => (a.requiredSteps?.length || 0) - (b.requiredSteps?.length || 0));
  
  const currentIndex = steps.findIndex(step => step.id === currentStepId);
  return currentIndex >= 0 && currentIndex < steps.length - 1 
    ? steps[currentIndex + 1].path 
    : null;
}

// Get previous route based on current step
export function getPreviousRoute(currentStepId: string): string | null {
  const steps = Object.values(DASHBOARD_ROUTES)
    .filter(route => 'requiredSteps' in route)
    .sort((a, b) => (a.requiredSteps?.length || 0) - (b.requiredSteps?.length || 0));
  
  const currentIndex = steps.findIndex(step => step.id === currentStepId);
  return currentIndex > 0 ? steps[currentIndex - 1].path : null;
} 