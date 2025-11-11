'use client';

import { usePathname, useRouter as useNextRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { staticLocales as locales, Locale } from '@/app/i18n/config';
import { useAuth } from '@/components/auth/AuthProvider';
import LocaleSwitcher from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getLocalizedOnboardingPath } from '@/utils/localized-paths';
import { 
  Menu, 
  X, 
  ChevronRight, 
  ChevronDown, 
  User,
  BarChart3,
  FileText,
  Calendar,
  PenTool,
  Search,
  Image as ImageIcon,
  Building2,
  Users,
  Mail,
  CreditCard,
  FileCheck,
  Globe,
  Handshake,
  Languages,
  UserCheck,
  Folder,
  Settings,
  Shield,
  ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import { ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

// Define admin link structure
interface AdminLink {
  href: string;
  label: string;
}

interface AdminMenuGroup {
  type: 'group';
  label: string;
  items: AdminLink[];
}

interface AdminMenuItem {
  type: 'item';
  href: string;
  label: string;
}

type AdminMenuNode = AdminMenuGroup | AdminMenuItem;

// Separate AdminSidebar component
function AdminSidebar({ links, pathname }: { links: AdminMenuNode[], pathname?: string }) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['cms']));

  const toggleGroup = (groupLabel: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupLabel)) {
      newExpanded.delete(groupLabel);
    } else {
      newExpanded.add(groupLabel);
    }
    setExpandedGroups(newExpanded);
  };

  // Icon mapping for menu items
  const getMenuIcon = (href: string) => {
    // Dashboard needs exact match since it's just /admin
    if (href.endsWith('/admin') && !href.endsWith('/admin/')) return <Settings className="h-5 w-5" />;
    if (href.includes('analytics')) return <BarChart3 className="h-5 w-5" />;
    if (href.includes('cms') || href.includes('brand')) return <FileText className="h-5 w-5" />;
    if (href.includes('content-calendar')) return <Calendar className="h-5 w-5" />;
    if (href.includes('blog') || href.includes('articles')) return <PenTool className="h-5 w-5" />;
    if (href.includes('seo')) return <Search className="h-5 w-5" />;
    if (href.includes('media')) return <ImageIcon className="h-5 w-5" />;
    if (href.includes('calendar')) return <Calendar className="h-5 w-5" />;
    if (href.includes('companies')) return <Building2 className="h-5 w-5" />;
    if (href.includes('contacts')) return <Users className="h-5 w-5" />;
    if (href.includes('email-templates')) return <Mail className="h-5 w-5" />;
    if (href.includes('financing-providers')) return <CreditCard className="h-5 w-5" />;
    if (href.includes('funding-applications')) return <FileCheck className="h-5 w-5" />;
    if (href.includes('landing-pages')) return <Globe className="h-5 w-5" />;
    if (href.includes('partners')) return <Handshake className="h-5 w-5" />;
    if (href.includes('translations')) return <Languages className="h-5 w-5" />;
    if (href.includes('users')) return <UserCheck className="h-5 w-5" />;
    return <Folder className="h-5 w-5" />;
  };

  const getGroupIcon = (label: string) => {
    if (label.toLowerCase().includes('cms')) return <Settings className="h-5 w-5" />;
    return <Folder className="h-5 w-5" />;
  };

  return (
    <div className="hidden sm:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border overflow-y-auto shadow-lg">
      <div className="w-full py-6">
        {/* Header */}
        <div className="px-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-gold-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Admin</h2>
              <p className="text-xs text-muted-foreground">Hallintapaneeli</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 px-3">
          {links.map((link) => {
            if (link.type === 'group') {
              const isExpanded = expandedGroups.has(link.label);
              return (
                <div key={link.label} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(link.label)}
                    className="group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-muted-foreground hover:text-accent-foreground hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getGroupIcon(link.label)}
                      <span>{link.label}</span>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isExpanded ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-8 space-y-1 border-l-2 border-border pl-4">
                      {link.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            pathname?.endsWith(item.href)
                              ? 'bg-gold-primary/10 text-gold-primary border border-gold-primary/20 shadow-sm'
                              : 'text-muted-foreground hover:text-accent-foreground hover:bg-accent/30'
                          }`}
                        >
                          {getMenuIcon(item.href)}
                          <span>{item.label}</span>
                          {pathname?.endsWith(item.href) && (
                            <div className="w-1.5 h-1.5 bg-gold-primary rounded-full ml-auto"></div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    pathname?.endsWith(link.href)
                      ? 'bg-gold-primary/10 text-gold-primary border border-gold-primary/20 shadow-sm'
                      : 'text-muted-foreground hover:text-accent-foreground hover:bg-accent/50'
                  }`}
                >
                  {getMenuIcon(link.href)}
                  <span className="flex-1">{link.label}</span>
                  {pathname?.endsWith(link.href) && (
                    <div className="w-1.5 h-1.5 bg-gold-primary rounded-full"></div>
                  )}
                </Link>
              );
            }
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6 px-3">
          <div className="border-t border-border pt-4">
            <Link
              href={`/${pathname?.split('/')[1] || 'fi'}`}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-muted-foreground hover:text-accent-foreground hover:bg-accent/50"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Takaisin sivustolle</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Define Funding Links structure
interface FundingLink {
  href: string;
  labelKey: string; // Reference to translation key
  slug: string;
}

// Define structure for navigation items (can include children for dropdowns)
interface NavItem {
  href: string;
  label: string;
  isDropdown?: boolean;
  children?: FundingLink[];
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useNextRouter();
  const currentLocale = useLocale(); // Use next-intl's useLocale for correct locale
  const t = useTranslations('Navigation');
  const tAdmin = useTranslations('Admin'); // Admin translations
  const tFunding = useTranslations('Onboarding'); // Translations for funding types
  const auth = useAuth();
  const { session, loading, isAdmin, error } = auth || { session: null, loading: true, isAdmin: false, error: null };
  const [enabledLocales, setEnabledLocales] = useState<string[]>(locales);
  const [showLoading, setShowLoading] = useState(true);
  const supabase = createClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFundingDropdownOpen, setIsFundingDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch enabled locales
  const fetchEnabledLocales = useCallback(async () => {
    try {
      const response = await fetch('/api/languages');
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      
      // Filter enabled languages and map to locale codes
      const enabled = data
        .filter((lang: { enabled: boolean }) => lang.enabled)
        .map((lang: { code: string }) => lang.code);
      
      setEnabledLocales(enabled);
    } catch (err) {
      console.error('Error fetching enabled locales:', err);
      // Fall back to static locales
      setEnabledLocales(locales);
    }
  }, []);

  useEffect(() => {
    fetchEnabledLocales();

    // Subscribe to changes
    const channel = supabase
      .channel('languages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'languages'
        },
        () => {
          // Refetch enabled locales when any change occurs
          fetchEnabledLocales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchEnabledLocales]);

  // Force loading to false after a timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log('Force ending loading state after timeout')
        setShowLoading(false)
      }
    }, 3000) // Reduced timeout to 3 seconds since we improved auth state handling

    // If we have definitive auth state or error, update immediately
    if (!loading || error) {
      console.log('Auth state resolved:', { loading, error, session })
      setShowLoading(false)
    }

    return () => clearTimeout(timer)
  }, [loading, error, session])

  // Yksinkertainen click-pohjainen dropdown
  const handleDropdownClick = useCallback((itemLabel: string) => {
    if (openDesktopDropdown === itemLabel) {
      setOpenDesktopDropdown(null);
    } else {
      setOpenDesktopDropdown(itemLabel);
    }
  }, [openDesktopDropdown]);

  // Click outside handler for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // Tarkista onko klikki dropdown-containerin sisällä
      const clickedInsideDropdown = (target as Element).closest('.dropdown-container');
      
      if (clickedInsideDropdown) {
        return; // Älä sulje jos klikataan dropdown-containerin sisällä
      }
      
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsFundingDropdownOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(target)) {
        setIsAccountDropdownOpen(false);
      }
      
      // Suljetaan desktop dropdown jos klikataan sen ulkopuolella
      if (openDesktopDropdown) {
        setOpenDesktopDropdown(null);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDesktopDropdown]);

  // Always show navigation links on public pages
  const shouldShowLinks = true

  // Split path into parts and remove empty strings
  const pathParts = pathname?.split('/').filter(Boolean) || [];
  
  // Detect admin path - check after locale part (index 1 since locale is index 0)
  const isAdminPath = pathParts.length > 1 && pathParts[1] === 'admin';

  // Define admin links - only show if user is admin and auth is complete without errors
  const adminLinks: AdminMenuNode[] = (!loading && isAdmin && !error) ? (() => {
    // Define all admin menu items
    const allItems: AdminMenuNode[] = [
      { type: 'item', href: `/${currentLocale}/admin`, label: t('admin.dashboard') },
      { type: 'item', href: `/${currentLocale}/admin/analytics`, label: t('admin.analytics') },
      { 
        type: 'group',
        label: t('admin.cms'),
        items: [
          { href: `/${currentLocale}/admin/cms`, label: t('admin.brand') },
          { href: `/${currentLocale}/admin/content-calendar`, label: t('admin.contentCalendar') },
          { href: `/${currentLocale}/admin/blog`, label: t('admin.articles') },
          { href: `/${currentLocale}/admin/seo`, label: t('admin.seo') },
          { href: `/${currentLocale}/admin/media`, label: t('admin.media') }
        ].sort((a, b) => a.label.localeCompare(b.label, 'fi', { numeric: true, sensitivity: 'base' }))
      },
      { type: 'item', href: `/${currentLocale}/admin/calendar`, label: t('admin.calendar') },
      { type: 'item', href: `/${currentLocale}/admin/surveys`, label: t('admin.surveys') },
      { type: 'item', href: `/${currentLocale}/admin/survey-automation`, label: t('admin.surveyAutomation') },
      { type: 'item', href: `/${currentLocale}/admin/companies`, label: t('admin.companies') },
      { type: 'item', href: `/${currentLocale}/admin/contacts`, label: t('admin.contacts') },
      { type: 'item', href: `/${currentLocale}/admin/email-templates`, label: t('admin.emailTemplates') },
      { type: 'item', href: `/${currentLocale}/admin/financing-providers`, label: t('admin.lenders') },
      { type: 'item', href: `/${currentLocale}/admin/funding-applications`, label: t('admin.lenderApplications') },
      { type: 'item', href: `/${currentLocale}/admin/landing-pages`, label: t('admin.landingPages') },
      { type: 'item', href: `/${currentLocale}/admin/partners`, label: t('admin.partners') },
      { type: 'item', href: `/${currentLocale}/admin/translations`, label: t('admin.translations') },
      { type: 'item', href: `/${currentLocale}/admin/users`, label: t('admin.users') }
    ];

    // Separate groups and items for sorting
    const groups = allItems.filter(item => item.type === 'group') as AdminMenuGroup[];
    const items = allItems.filter(item => item.type === 'item') as AdminMenuItem[];

    // Sort items alphabetically by label
    const sortedItems = items.sort((a, b) => 
      a.label.localeCompare(b.label, 'fi', { numeric: true, sensitivity: 'base' })
    );

    // Sort groups alphabetically by label
    const sortedGroups = groups.sort((a, b) => 
      a.label.localeCompare(b.label, 'fi', { numeric: true, sensitivity: 'base' })
    );

    // Combine groups first, then sorted items
    return [...sortedGroups, ...sortedItems];
  })() : [];

  // Define Funding Type Links
  const fundingLinks: FundingLink[] = [
    { slug: 'bank-loan', href: '/funding/bank-loan', labelKey: 'bank_loan' },
    { slug: 'government-grant', href: '/funding/government-grant', labelKey: 'government_grant' },
    { slug: 'credit-line', href: '/funding/credit-line', labelKey: 'credit_line' },
    { slug: 'factoring-ar', href: '/funding/factoring-ar', labelKey: 'factoring_ar' },
    { slug: 'business-loan', href: '/funding/business-loan', labelKey: 'business_loan' },
    { slug: 'leasing', href: '/funding/leasing', labelKey: 'leasing' },
    { slug: 'bank-guarantee', href: '/funding/bank-guarantee', labelKey: 'bank_guarantee' },
    { slug: 'crowdfunding', href: '/funding/crowdfunding', labelKey: 'crowdfunding' },
    { slug: 'refinancing', href: '/funding/refinancing', labelKey: 'refinancing' },
    { slug: 'equity-financing', href: '/funding/equity-financing', labelKey: 'equity_financing' },
    { slug: 'invoice-financing', href: '/funding/invoice-financing', labelKey: 'invoice_financing' },
    { slug: 'venture-capital', href: '/funding/venture-capital', labelKey: 'venture_capital' },
    { slug: 'r-d-financing', href: '/funding/r-d-financing', labelKey: 'r_d_financing' },
    { slug: 'unknown', href: '/funding/unknown', labelKey: 'unknown' },
  ];
  
  // Kielikohtaiset URL:t - Palauttaa täyden URL:n locale-prefiksillä
  // Nämä vastaavat middleware.ts rewrites-määrityksiä
  const getLocalizedUrl = useCallback((basePath: string) => {
    const localeUrls: Record<string, Record<string, string>> = {
      fi: {
        '/': '/',
        '/funding': '/rahoitus',
        '/funding/business-loan': '/rahoitus/yrityslaina',
        '/funding/credit-line': '/rahoitus/luottoraja',
        '/funding/factoring-ar': '/rahoitus/factoring',
        '/funding/leasing': '/rahoitus/leasing',
        '/solutions': '/ratkaisut',
        '/solutions/retail': '/ratkaisut/kauppa',
        '/solutions/manufacturing': '/ratkaisut/teollisuus',
        '/solutions/construction': '/ratkaisut/rakentaminen',
        '/solutions/technology': '/ratkaisut/teknologia',
        '/solutions/health': '/ratkaisut/terveys',
        '/solutions/logistics': '/ratkaisut/logistiikka',
        '/situations': '/rahoitustilanteet',
        '/situations/growth': '/rahoitustilanteet/kasvun-rahoitus',
        '/situations/working-capital': '/rahoitustilanteet/kassavirran-hallinta',
        '/situations/investment': '/rahoitustilanteet/investointien-rahoitus',
        '/situations/business-acquisitions': '/rahoitustilanteet/yrityskaupat',
        '/situations/crisis-financing': '/rahoitustilanteet/kriisirahoitus',
        '/knowledge': '/tietopankki',
        '/knowledge/guide': '/tietopankki/opas',
        '/knowledge/calculators': '/tietopankki/laskurit',
        '/knowledge/glossary': '/tietopankki/sanasto',
        '/knowledge/faq': '/tietopankki/ukk',
        '/about': '/tietoa',
        '/about/team': '/tietoa/tiimi',
        '/about/why-trusty': '/tietoa/miksi-trusty',
        '/about/customer-stories': '/tietoa/asiakastarinat',
        '/contact': '/yhteystiedot',
        '/blog': '/blogi'
      },
      sv: {
        '/': '/',
        '/funding': '/finansiering',
        '/funding/business-loan': '/finansiering/foretagslan',
        '/funding/credit-line': '/finansiering/kreditgrans',
        '/funding/factoring-ar': '/finansiering/factoring',
        '/funding/leasing': '/finansiering/leasing',
        '/solutions': '/losningar',
        '/solutions/retail': '/losningar/handel',
        '/solutions/manufacturing': '/losningar/tillverkning',
        '/solutions/construction': '/losningar/byggande',
        '/solutions/technology': '/losningar/teknologi',
        '/solutions/health': '/losningar/halsa',
        '/solutions/logistics': '/losningar/logistik',
        '/situations': '/finansieringssituationer',
        '/situations/growth': '/finansieringssituationer/tillvaxt-finansiering',
        '/situations/working-capital': '/finansieringssituationer/kassaflode-hantering',
        '/situations/investment': '/finansieringssituationer/investering-finansiering',
        '/situations/business-acquisitions': '/finansieringssituationer/foretag-farvarvning',
        '/situations/crisis-financing': '/finansieringssituationer/kris-finansiering',
        '/knowledge': '/kunskapsbank',
        '/knowledge/guide': '/kunskapsbank/guide',
        '/knowledge/calculators': '/kunskapsbank/kalkylatorer',
        '/knowledge/glossary': '/kunskapsbank/ordlista',
        '/knowledge/faq': '/kunskapsbank/faq',
        '/about': '/om-oss',
        '/about/team': '/om-oss/team',
        '/about/why-trusty': '/om-oss/varfor-trusty',
        '/about/customer-stories': '/om-oss/kundberattelser',
        '/contact': '/kontakt',
        '/blog': '/blogg'
      },
      en: {
        '/': '/',
        // Englanti käyttää alkuperäisiä polkuja
      }
    };
    
    // Palauta täysi URL locale-prefiksillä
    const localizedPath = localeUrls[currentLocale]?.[basePath] || basePath;
    return `/${currentLocale}${localizedPath}`;
  }, [currentLocale]);

  // Calculate main navigation items according to the new structure
  const mainNavigationItems = useMemo(() => {
    const items: NavItem[] = [
      { href: getLocalizedUrl('/'), label: t('home') },
      {
        href: getLocalizedUrl('/funding'),
        label: t('funding'),
        isDropdown: true,
        children: [
          { 
            slug: 'business-loan', 
            href: getLocalizedUrl('/funding/business-loan'), 
            labelKey: 'business_loan' 
          },
          { 
            slug: 'credit-line', 
            href: getLocalizedUrl('/funding/credit-line'), 
            labelKey: 'credit_line' 
          },
          { 
            slug: 'factoring-ar', 
            href: getLocalizedUrl('/funding/factoring-ar'), 
            labelKey: 'factoring_ar' 
          },
          { 
            slug: 'leasing', 
            href: getLocalizedUrl('/funding/leasing'), 
            labelKey: 'leasing' 
          },
        ]
      },
      {
        href: getLocalizedUrl('/solutions'),
        label: t('industry_solutions'),
        isDropdown: true,
        children: [
          { 
            slug: 'retail', 
            href: getLocalizedUrl('/solutions/retail'), 
            labelKey: 'retail' 
          },
          { 
            slug: 'manufacturing', 
            href: getLocalizedUrl('/solutions/manufacturing'), 
            labelKey: 'manufacturing' 
          },
          { 
            slug: 'construction', 
            href: getLocalizedUrl('/solutions/construction'), 
            labelKey: 'construction' 
          },
          { 
            slug: 'technology', 
            href: getLocalizedUrl('/solutions/technology'), 
            labelKey: 'technology' 
          },
          { 
            slug: 'health', 
            href: getLocalizedUrl('/solutions/health'), 
            labelKey: 'health' 
          },
          { 
            slug: 'logistics', 
            href: getLocalizedUrl('/solutions/logistics'), 
            labelKey: 'logistics' 
          },
        ]
      },
      {
        href: getLocalizedUrl('/situations'),
        label: t('funding_situations'),
        isDropdown: true,
        children: [
          { 
            slug: 'growth', 
            href: getLocalizedUrl('/situations/growth'), 
            labelKey: 'growth' 
          },
          { 
            slug: 'working-capital', 
            href: getLocalizedUrl('/situations/working-capital'), 
            labelKey: 'working_capital' 
          },
          { 
            slug: 'investment', 
            href: getLocalizedUrl('/situations/investment'), 
            labelKey: 'investment' 
          },
          { 
            slug: 'business-acquisitions', 
            href: getLocalizedUrl('/situations/business-acquisitions'), 
            labelKey: 'business_acquisitions' 
          },
          { 
            slug: 'crisis-financing', 
            href: getLocalizedUrl('/situations/crisis-financing'), 
            labelKey: 'crisis_financing' 
          },
        ]
      },
      {
        href: getLocalizedUrl('/knowledge'),
        label: t('knowledge_bank'),
        isDropdown: true,
        children: [
          { 
            slug: 'guide', 
            href: getLocalizedUrl('/knowledge/guide'), 
            labelKey: 'guide' 
          },
          { 
            slug: 'calculators', 
            href: getLocalizedUrl('/knowledge/calculators'), 
            labelKey: 'calculators' 
          },
          { 
            slug: 'glossary', 
            href: getLocalizedUrl('/knowledge/glossary'), 
            labelKey: 'glossary' 
          },
          { 
            slug: 'faq', 
            href: getLocalizedUrl('/knowledge/faq'), 
            labelKey: 'faq' 
          },
        ]
      },
      {
        href: getLocalizedUrl('/about'),
        label: t('about'),
        isDropdown: true,
        children: [
          { 
            slug: 'team', 
            href: getLocalizedUrl('/about/team'), 
            labelKey: 'team' 
          },
          { 
            slug: 'why-trusty', 
            href: getLocalizedUrl('/about/why-trusty'), 
            labelKey: 'why_trusty' 
          },
          { 
            slug: 'customer-stories', 
            href: getLocalizedUrl('/about/customer-stories'), 
            labelKey: 'customer_stories' 
          },
          { 
            slug: 'contact', 
            href: getLocalizedUrl('/contact'), 
            labelKey: 'contact' 
          },
        ]
      },
      { href: getLocalizedUrl('/blog'), label: t('blog') },
    ];

    return items;
  }, [t, session?.user, isAdmin, getLocalizedUrl, currentLocale]);

  // Add menu toggle function back
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleFundingDropdown = () => {
    setIsFundingDropdownOpen((prev: boolean) => !prev);
  }

  const toggleAccountDropdown = () => {
    setIsAccountDropdownOpen((prev: boolean) => !prev);
  }

  // Helper function to get sub-item labels
  const getSubItemLabel = (labelKey: string) => {
    // Always try navigation subpages first
    try {
      return t(`subpages.${labelKey}`);
    } catch {
      // Fallback to funding type translations
      try {
        return tFunding(`recommendationType.${labelKey}`);
      } catch {
        // Final fallback: format the key
        return labelKey.charAt(0).toUpperCase() + labelKey.slice(1).replace(/_/g, ' ');
      }
    }
  }

  return (
    <>
      <nav className="bg-background border-b border-border transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                href={(!loading && isAdmin && isAdminPath) ? `/${currentLocale}/admin` : `/${currentLocale}`}
                className="flex items-center py-2"
              >
                <Image
                  src="/images/trusty-finance-logo-optimized.webp"
                  alt="Trusty Finance"
                  width={120}
                  height={35}
                  style={{ width: 'auto', height: 'auto', maxHeight: '35px' }}
                  priority
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-1">
              {shouldShowLinks ? mainNavigationItems.map((item: any) => (
                item.isDropdown ? (
                  <div 
                    key={item.label} 
                    className="relative dropdown-container"
                  >
                    <button
                      type="button"
                      className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer ${
                        pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                          ? 'text-accent-foreground bg-accent font-bold border-b-2 border-accent'
                          : 'text-foreground hover:text-accent-foreground hover:bg-accent hover:border-b-2 hover:border-accent'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDropdownClick(item.label);
                      }}
                    >
                      {item.label}
                      <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${
                        openDesktopDropdown === item.label ? 'rotate-180' : ''
                      }`} />
                    </button>
                    {openDesktopDropdown === item.label && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute z-50 mt-0 w-64 rounded-md shadow-lg bg-card ring-1 ring-border ring-opacity-5 focus:outline-none py-1"
                      >
                        {item.children?.map((subItem: any) => (
                          <a
                            key={subItem.slug}
                            href={subItem.href}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Suljetaan dropdown ja navigoi
                              setOpenDesktopDropdown(null);
                              router.push(subItem.href);
                            }}
                            className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                          >
                            {getSubItemLabel(subItem.labelKey)}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === item.href
                        ? 'text-accent-foreground bg-accent font-bold border-b-2 border-accent'
                        : 'text-foreground hover:text-accent-foreground hover:bg-accent hover:border-b-2 hover:border-accent'
                      }`}
                  >
                    {item.label}
                  </Link>
                )
              )) : (
                <div className="animate-pulse space-x-1">
                  {[1, 2, 3, 4].map((i) => ( // Increased skeleton count
                    <div key={i} className="inline-block w-20 h-8 bg-muted rounded-md" />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6">
              {showLoading ? (
                <div className="animate-pulse w-16 h-6 bg-muted rounded" />
              ) : (
                <div className="hidden sm:flex items-center space-x-4">
                  {/* Theme Toggle */}
                  <ThemeToggle />
                  {/* Tili-painike - aina näkyvissä */}
                  <div className="relative" ref={accountDropdownRef}>
                    <button
                      onClick={session ? toggleAccountDropdown : () => router.push('/onboarding')}
                      onMouseEnter={session ? () => setIsAccountDropdownOpen(true) : undefined}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors text-foreground hover:text-accent-foreground hover:bg-accent hover:border-b-2 hover:border-accent"
                    >
                      <User className="inline-block mr-2 h-4 w-4" />
                      {t('account.title')}
                      {session && <ChevronDown className="ml-1 h-4 w-4" />}
                    </button>
                    {session && isAccountDropdownOpen && (
                      <div
                        onMouseEnter={() => setIsAccountDropdownOpen(true)}
                        onMouseLeave={() => setIsAccountDropdownOpen(false)}
                        className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-card ring-1 ring-border ring-opacity-5 focus:outline-none py-1"
                      >
                        <Link
                          href={`/${currentLocale}/account/settings`}
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          {t('account.settings')}
                        </Link>
                        <Link
                          href={`/auth/sign-out?next=${encodeURIComponent(pathname)}`}
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          {t('signOut')}
                        </Link>
                      </div>
                    )}
                  </div>

                  {session ? (
                    <>
                      <Link
                        href={`/${currentLocale}/dashboard`}
                        className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-md"
                      >
                        {t('dashboard')}
                      </Link>
                      {(!loading && isAdmin && !isAdminPath) && ( // Show Admin link only if not already in admin section
                        <Link
                          href={`/${currentLocale}/admin`}
                          className="flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors text-foreground hover:text-accent-foreground hover:bg-accent hover:border-b-2 hover:border-accent"
                        >
                          {t('admin_link')}
                        </Link>
                      )}
                    </>
                  ) : (
                    <Link
                      href={getLocalizedOnboardingPath(currentLocale as 'fi' | 'en' | 'sv')}
                      className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-md"
                    >
                      {t('startAnalysis')}
                    </Link>
                  )}
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={toggleMenu}
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md bg-muted hover:bg-accent transition-colors border-2 border-border shadow-md"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6 text-foreground" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6 text-foreground" aria-hidden="true" />
                )}
              </button>
              
              {/* Language Switcher */}
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Admin Sidebar - Desktop only */}
      {(!loading && isAdmin && isAdminPath) && (
        <AdminSidebar links={adminLinks} pathname={pathname} />
      )}

      {/* Mobile menu */}
      <div
        className={`${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } fixed inset-y-0 right-0 w-full sm:hidden bg-background transform transition-transform duration-300 ease-in-out z-50 border-l border-border overflow-y-auto`}
      >
        <div className="pt-20 pb-3 space-y-1 px-4">
          {/* Show admin or public links based on path */}
          {(!loading && isAdmin && isAdminPath) ? (
            <>
              {adminLinks.map((link) => {
                if (link.type === 'group') {
                  return (
                    <div key={link.label}>
                      <span className="block px-3 py-2 rounded-md text-lg font-medium text-muted-foreground">
                        {link.label}
                      </span>
                      <div className="pl-4 space-y-1">
                        {link.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`block px-3 py-2 rounded-md text-lg font-medium ${
                              pathname?.endsWith(item.href)
                                ? 'text-accent-foreground bg-accent font-bold border-l-4 border-primary'
                                : 'text-foreground hover:text-accent-foreground hover:bg-accent'
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-3 py-2 rounded-md text-lg font-medium ${
                        pathname?.endsWith(link.href)
                          ? 'text-accent-foreground bg-accent font-bold border-l-4 border-primary'
                          : 'text-foreground hover:text-accent-foreground hover:bg-accent'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                }
              })}
              <Link
                href={`/${currentLocale}`}
                className="block px-3 py-2 mt-4 rounded-md text-lg font-medium text-foreground hover:text-accent-foreground hover:bg-accent border-t border-border"
              >
                {t('backToSite')}
              </Link>
            </>
          ) : (
            mainNavigationItems.map((item: any) => (
              item.isDropdown ? (
                <div key={item.label}>
                  <div className="flex items-center">
                    <button
                      type="button"
                      className={`flex-1 flex items-center px-3 py-2 rounded-md text-lg font-medium text-left ${pathname.startsWith(item.href)
                          ? 'text-accent-foreground bg-accent font-bold border-l-4 border-primary'
                          : 'text-foreground hover:text-accent-foreground hover:bg-accent'
                        }`}
                      onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                    >
                      {item.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                      className="px-2 py-2 text-foreground hover:text-accent-foreground"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${
                        openDropdown === item.label ? 'rotate-180' : ''
                      }`} />
                    </button>
                  </div>
                  {openDropdown === item.label && (
                    <div className="pl-4 space-y-1 mt-1">
                      {item.children?.map((subItem: any) => (
                        <a
                          key={subItem.slug}
                          href={subItem.href}
                          onClick={(e) => {
                            e.preventDefault();
                            // Suljetaan mobile menu ja dropdown ja navigoi
                            setIsMenuOpen(false);
                            setOpenDropdown(null);
                            router.push(subItem.href);
                          }}
                          className={`flex items-center px-3 py-2 rounded-md text-base font-medium cursor-pointer ${pathname === subItem.href
                              ? 'text-accent-foreground bg-accent font-bold border-l-4 border-primary'
                              : 'text-muted-foreground hover:text-accent-foreground hover:bg-accent'
                            }`}
                        >
                          {getSubItemLabel(subItem.labelKey)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-lg font-medium ${pathname === item.href
                      ? 'text-accent-foreground bg-accent font-bold border-l-4 border-primary'
                      : 'text-foreground hover:text-accent-foreground hover:bg-accent'
                    }`}
                  onClick={() => setIsMenuOpen(false)} // Close menu on link click
                >
                  {item.label}
                </Link>
              )
            ))
          )}

          {/* Mobile Auth Buttons - Kept as Links */}
          <div className="py-6">
            {!loading && (
              <>
                {/* Theme Toggle for Mobile */}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-lg font-medium text-foreground">Teema</span>
                  <ThemeToggle />
                </div>
                
                {/* Tili-linkki - aina näkyvissä mobiilissa */}
                <Link
                  href={session ? `/${currentLocale}/account/settings` : getLocalizedOnboardingPath(currentLocale as 'fi' | 'en' | 'sv')}
                  className="flex items-center px-3 py-2 rounded-md text-lg font-medium text-foreground hover:text-accent-foreground hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="inline-block mr-2 h-4 w-4" />
                  {t('account.title')}
                </Link>
                
                {session ? (
              <>
                <Link
                  href={`/${currentLocale}/dashboard`}
                  className="mx-3 mb-2 block rounded-lg px-4 py-2.5 text-base font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('dashboard')}
                </Link>
                <Link
                  href={`/${currentLocale}/auth/sign-out`}
                  className="flex items-center px-3 py-2 rounded-md text-lg font-medium text-foreground hover:text-accent-foreground hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('Auth.signOut')}
                </Link>
              </>
            ) : (
                                <Link
                    href={getLocalizedOnboardingPath(currentLocale as 'fi' | 'en' | 'sv')}
                    className="mx-3 block rounded-lg px-4 py-2.5 text-base font-semibold text-white-foreground bg-primary hover:bg-primary/90 transition-colors shadow-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('startAnalysis')}
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
