'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { usePathname } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

// Custom Switch component that works reliably (same as in admin surveys)
const CustomSwitch = ({ 
  checked, 
  onChange, 
  disabled = false 
}: { 
  checked: boolean, 
  onChange: (checked: boolean) => void,
  disabled?: boolean 
}) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
  </label>
);

// Eri keksityypit vaihtuvat
const COOKIE_EMOJIS = ['🍪', '🥠', '🧁', '🎂', '🍰', '🥮'];

interface CookiePreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const t = useTranslations('CookieConsent');
  const { toast } = useToast();
  const pathname = usePathname();
  const [showBanner, setShowBanner] = useState(false);
  const [currentCookie, setCurrentCookie] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Aina päällä
    preferences: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // ÄLÄ näytä banneria privacy/tietosuojaseloste-sivulla
    if (pathname && (pathname.includes('/privacy') || pathname.includes('/tietosuojaseloste'))) {
      setShowBanner(false);
      return;
    }

    // Tarkista onko käyttäjä jo hyväksynyt
    const hasConsented = localStorage.getItem('cookie-consent');
    if (!hasConsented) {
      setShowBanner(true);
    } else {
      // Lataa tallennetut asetukset
      const savedPrefs = localStorage.getItem('cookie-preferences');
      if (savedPrefs) {
        try {
          setPreferences(JSON.parse(savedPrefs));
        } catch (e) {
          console.error('Failed to parse cookie preferences', e);
        }
      }
    }
  }, [pathname]);

  // Vaihda keksiä 2 sekunnin välein
  useEffect(() => {
    if (!showBanner) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentCookie((prev) => (prev + 1) % COOKIE_EMOJIS.length);
        setIsAnimating(false);
      }, 300);
    }, 2000);

    return () => clearInterval(interval);
  }, [showBanner]);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    setPreferences(prefs);
  };

  const handleAccept = () => {
    const allAccepted = {
      essential: true,
      preferences: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
    setShowBanner(false);
    toast({
      title: COOKIE_EMOJIS[currentCookie],
      description: t('accepted'),
      duration: 3000,
    });
  };

  const handleDecline = () => {
    const onlyEssential = {
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false,
    };
    savePreferences(onlyEssential);
    setShowBanner(false);
    toast({
      description: t('declined'),
      duration: 3000,
    });
  };

  const handleCustomize = () => {
    setShowPreferences(true);
  };

  const handleSaveCustom = () => {
    savePreferences(preferences);
    setShowPreferences(false);
    setShowBanner(false);
    toast({
      title: COOKIE_EMOJIS[currentCookie],
      description: t('preferencesSaved'),
      duration: 3000,
    });
  };

  return (
    <>
      {showBanner && (
        <>
          {/* Tumma tausta-overlay */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300" />
          
          {/* Keskellä oleva cookie-modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-3xl shadow-2xl border-4 border-primary/20 max-w-2xl w-full animate-in zoom-in-95 duration-300">
          {/* Iso keksi-otsikko */}
          <div className="text-center pt-8 pb-6 px-6 border-b border-border">
            <div 
              className={`text-9xl mb-4 transition-all duration-300 ${
                isAnimating ? 'scale-0 rotate-180' : 'scale-100 rotate-0'
              }`}
            >
              {COOKIE_EMOJIS[currentCookie]}
            </div>
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('title')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          {/* Sisältö */}
          <div className="p-6 space-y-4">
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <p className="text-base leading-relaxed">
                {t('message')}
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{t('essential')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span>{t('preferencesCookies')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>{t('analytics')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>{t('marketing')}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {t('explanation')}
              </p>
            </div>

            <a
              href="/privacy"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              aria-label={t('privacyPolicyAriaLabel')}
            >
              {t('privacyPolicy')} →
            </a>
          </div>

          {/* Painikkeet */}
          <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAccept}
              className="flex-1 px-6 py-4 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              {t('acceptAll')} 🎉
            </button>
            <button
              onClick={handleCustomize}
              className="px-6 py-4 text-base border-2 border-border rounded-xl hover:bg-muted transition-all duration-200"
            >
              {t('customizeButton')}
            </button>
            <button
              onClick={handleDecline}
              className="px-6 py-4 text-base border-2 border-border rounded-xl hover:bg-muted transition-all duration-200"
            >
              {t('decline')}
            </button>
          </div>

          {/* Humoristinen alaviite */}
          <div className="px-6 pb-6 text-center">
            <p className="text-xs text-muted-foreground italic">
              {t('humor')}
            </p>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Evästeasetukset Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogPortal>
          <DialogOverlay className="!z-[70]" />
          <DialogContent className="sm:max-w-[500px] !z-[85]">
            <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <span className="text-3xl">{COOKIE_EMOJIS[currentCookie]}</span>
              {t('preferencesDialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('preferencesDialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Välttämättömät evästeet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <h4 className="font-semibold">{t('essentialTitle')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('essentialDescription')}
                  </p>
                </div>
                <CustomSwitch
                  checked={true}
                  onChange={() => {}}
                  disabled
                />
              </div>
            </div>

            {/* Mieltymykset evästeet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <h4 className="font-semibold">{t('preferencesCookiesTitle')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('preferencesCookiesDescription')}
                  </p>
                </div>
                <CustomSwitch
                  checked={preferences.preferences}
                  onChange={(checked) => {
                    console.log('Preferences switch clicked:', checked);
                    setPreferences({ ...preferences, preferences: checked });
                  }}
                />
              </div>
            </div>

            {/* Analytiikka evästeet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <h4 className="font-semibold">{t('analyticsTitle')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('analyticsDescription')}
                  </p>
                </div>
                <CustomSwitch
                  checked={preferences.analytics}
                  onChange={(checked) => {
                    console.log('Analytics switch clicked:', checked);
                    setPreferences({ ...preferences, analytics: checked });
                  }}
                />
              </div>
            </div>

            {/* Markkinointi evästeet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <h4 className="font-semibold">{t('marketingTitle')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('marketingDescription')}
                  </p>
                </div>
                <CustomSwitch
                  checked={preferences.marketing}
                  onChange={(checked) => {
                    console.log('Marketing switch clicked:', checked);
                    setPreferences({ ...preferences, marketing: checked });
                  }}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowPreferences(false)}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSaveCustom}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              {t('savePreferences')}
            </button>
          </DialogFooter>
        </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
} 