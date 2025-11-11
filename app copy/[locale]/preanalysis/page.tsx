'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/app/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/app/i18n/navigation';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Stepper komponentti etenemisen näyttämiseen
function ProgressStepper() {
  const t = useTranslations('Onboarding');
  
  // Määritellään vaiheet
  const steps = [
    { id: '1', label: t('step1.title', { default: 'Tunnistautuminen' }), completed: true },
    { id: '2', label: t('step2.title', { default: 'Yritystiedot' }), completed: true },
    { id: '3', label: t('step3.title', { default: 'Alustava analyysi' }), completed: false, active: true },
    { id: '4', label: t('step4.title', { default: 'Tarvekartoitus' }), completed: false },
    { id: '5', label: t('step5.title', { default: 'Yhteenveto' }), completed: false },
    { id: '6', label: t('step6.title', { default: 'Rahoitushakemus' }), completed: false },
    { id: '7', label: t('step7.title', { default: 'Tunnistautuminen (UBO)' }), completed: false }
  ];

  return (
    <div className="w-full mb-10">
      <div className="flex flex-wrap justify-between relative mb-4">
        {steps.map((step, index) => (
          <div 
            key={step.id} 
            className={cn(
              "flex flex-col items-center relative z-10",
              index === 0 ? "ml-0" : index === steps.length - 1 ? "mr-0" : ""
            )}
          >
            <div 
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2",
                step.completed ? "bg-primary border-primary text-white" : 
                step.active ? "bg-background border-primary text-white" : 
                "bg-background border-muted-foreground/30 text-muted-foreground/50"
              )}
            >
              {step.completed ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : step.id}
            </div>
            <div className={cn(
              "text-xs font-medium mt-2 text-center",
              step.active ? "text-white" : step.completed ? "text-foreground" : "text-muted-foreground/60"
            )}>
              {step.label}
            </div>
          </div>
        ))}
        
        {/* Yhdistävä viiva */}
        <div className="absolute top-5 left-0 w-full transform -translate-y-1/2 h-0.5 bg-muted-foreground/20 -z-0">
          <div className="h-full bg-primary" style={{ width: "28.6%" }}></div>
        </div>
      </div>
    </div>
  );
}

// Tyylitelty otsikkokomponentti
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-semibold mb-4 text-white">{children}</h2>
  );
}

// Demo-data analyysin tuloksille
// Tätä käytetään, kun oikeaa dataa ei ole vielä saatavilla
const demoAnalysisResult = {
  companyName: "Esimerkki Oy",
  businessId: "1234567-8",
  riskClass: "B+",
  riskScore: "76/100",
  financialData: {
    revenue: {
      '2021': '1,250',
      '2022': '1,420',
      '2023': '1,650',
      '2024': '1,850'
    },
    revenueGrowth: {
      '2021': 12.5,
      '2022': 13.6,
      '2023': 16.2,
      '2024': 12.1
    },
    operatingProfit: {
      '2021': '112',
      '2022': '128',
      '2023': '148',
      '2024': '167'
    },
    netProfit: {
      '2021': '86',
      '2022': '98',
      '2023': '116',
      '2024': '132'
    },
    netProfitGrowth: {
      '2021': 8.2,
      '2022': 13.9,
      '2023': 18.4,
      '2024': 13.8
    },
    equityRatio: {
      '2021': 32,
      '2022': 35,
      '2023': 38,
      '2024': 40
    }
  },
  analysis: "Yrityksen taloudellinen kehitys on ollut vakaata viimeisten neljän vuoden aikana. Liikevaihto on kasvanut tasaisesti, ja kannattavuus on parantunut. Omavaraisuusaste on hyvällä tasolla ja on parantunut vuosittain. Yritys on riskitasoltaan keskitasoa parempi (B+), mikä tarkoittaa että rahoituksen saatavuuden mahdollisuudet ovat hyvät. Erityisesti tasainen kasvu ja parantunut kannattavuus ovat vahvuuksia rahoituksen näkökulmasta."
};

export default function PreAnalysisPage() {
  const t = useTranslations('PreAnalysis');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Käytetään suoraan demo-analyysiä tuloksena
  const [analysisResult, setAnalysisResult] = useState<any>(demoAnalysisResult);

  // Simuloidaan datan lataus kun komponentti latautuu
  useEffect(() => {
    // Todellisessa sovelluksessa hakisimme tässä kohtaa datan API:sta
    setLoading(true);
    // Simuloidaan latausviivettä
    const timer = setTimeout(() => {
      setLoading(false);
      // Asetetaan demo-data analyysin tuloksiksi
      setAnalysisResult(demoAnalysisResult);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    // Ohjaa käyttäjä tarvekartoitukseen (vaihe 4)
    router.push('/onboarding?step=funding-needs');
  };

  const handleGetFinancing = () => {
    // Ohjaa käyttäjä suoraan rahoitushakemukseen (vaihe 6)
    router.push('/onboarding?step=summary');
  };

  const handleContact = () => {
    // Ohjaa käyttäjä yhteystietosivulle
    router.push('/contact');
  };
  
  return (
    <div className="container mx-auto py-8 px-4 relative">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black/90 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[500px] w-[500px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>
      
      <h1 className="text-4xl font-bold mb-8 text-center">{t('title', { default: 'Yritysanalyysi' })}</h1>
      
      {/* Lisätään etenemispalkki */}
      <ProgressStepper />
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" className="text-white mb-4" />
          <p className="text-lg text-center text-muted-foreground">{t('analyzing', { default: 'Analysoidaan yrityksenne tietoja...' })}</p>
        </div>
      ) : (
        <div className="w-full max-w-5xl mx-auto animate-in fade-in-0 zoom-in-95">
          <Card className="mb-8 backdrop-blur-sm bg-opacity-80 bg-background shadow-xl border-opacity-40 overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-primary/10 via-primary to-primary/10"></div>
            
            <CardHeader className="pb-0 pt-8">
              <CardTitle className="text-4xl font-bold mb-1">{analysisResult.companyName}</CardTitle>
              <CardDescription className="text-base">{analysisResult.businessId}</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="relative p-6 bg-background/60 rounded-xl border border-border/30 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:bg-background/80">
                  <div className="absolute -top-6 -left-6 w-16 h-16 bg-primary/10 rounded-full blur-xl"></div>
                  <h3 className="text-lg font-medium text-muted-foreground mb-3">{t('riskClass', { default: 'Yrityksen riskiluokka' })}</h3>
                  <div className="text-6xl font-extrabold text-white">{analysisResult.riskClass}</div>
                </div>
                
                <div className="relative p-6 bg-background/60 rounded-xl border border-border/30 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:bg-background/80">
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-primary/10 rounded-full blur-xl"></div>
                  <h3 className="text-lg font-medium text-muted-foreground mb-3">{t('riskScore', { default: 'Yrityksen riskipisteet' })}</h3>
                  <div className="text-6xl font-extrabold text-white">{analysisResult.riskScore}</div>
                </div>
              </div>
              
              <div className="p-6 bg-background/60 rounded-xl border border-border/30 shadow-sm mb-10 transition-all duration-300 hover:shadow-md hover:bg-background/80">
                <h3 className="text-xl font-semibold mb-6">{t('financialData', { default: 'Taloudelliset tunnusluvut' })}</h3>
                
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 text-left text-muted-foreground font-medium">{t('indicator', { default: 'Tunnusluku' })}</th>
                        <th className="py-3 px-4 text-right text-muted-foreground font-medium">2021</th>
                        <th className="py-3 px-4 text-right text-muted-foreground font-medium">2022</th>
                        <th className="py-3 px-4 text-right text-muted-foreground font-medium">2023</th>
                        <th className="py-3 px-4 text-right text-muted-foreground font-medium">2024</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-4 font-medium">{t('revenue', { default: 'Liikevaihto (tEUR)' })}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.revenue['2021']}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.revenue['2022']}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.revenue['2023']}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.revenue['2024']}</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-4 font-medium">{t('revenueGrowth', { default: 'Liikevaihdon kehitys (%)' })}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.revenueGrowth['2021'] > 0 ? 
                          <span className="text-green-500">{analysisResult.financialData.revenueGrowth['2021']}%</span> : 
                          <span className="text-red-500">{analysisResult.financialData.revenueGrowth['2021']}%</span>}
                        </td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.revenueGrowth['2022'] > 0 ? 
                          <span className="text-green-500">{analysisResult.financialData.revenueGrowth['2022']}%</span> : 
                          <span className="text-red-500">{analysisResult.financialData.revenueGrowth['2022']}%</span>}
                        </td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.revenueGrowth['2023'] > 0 ? 
                          <span className="text-green-500">{analysisResult.financialData.revenueGrowth['2023']}%</span> : 
                          <span className="text-red-500">{analysisResult.financialData.revenueGrowth['2023']}%</span>}
                        </td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.revenueGrowth['2024'] > 0 ? 
                          <span className="text-green-500">{analysisResult.financialData.revenueGrowth['2024']}%</span> : 
                          <span className="text-red-500">{analysisResult.financialData.revenueGrowth['2024']}%</span>}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-4 font-medium">{t('operatingProfit', { default: 'Käyttökate (tEUR)' })}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.operatingProfit['2021']}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.operatingProfit['2022']}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.operatingProfit['2023']}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.operatingProfit['2024']}</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-4 font-medium">{t('netProfit', { default: 'Liiketulos (tEUR)' })}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.netProfit['2021']}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.netProfit['2022']}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.netProfit['2023']}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.netProfit['2024']}</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-4 font-medium">{t('netProfitGrowth', { default: 'Liiketuloksen kehitys (%)' })}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.netProfitGrowth['2021'] > 0 ? 
                          <span className="text-green-500">{analysisResult.financialData.netProfitGrowth['2021']}%</span> : 
                          <span className="text-red-500">{analysisResult.financialData.netProfitGrowth['2021']}%</span>}
                        </td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.netProfitGrowth['2022'] > 0 ? 
                          <span className="text-green-500">{analysisResult.financialData.netProfitGrowth['2022']}%</span> : 
                          <span className="text-red-500">{analysisResult.financialData.netProfitGrowth['2022']}%</span>}
                        </td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.netProfitGrowth['2023'] > 0 ? 
                          <span className="text-green-500">{analysisResult.financialData.netProfitGrowth['2023']}%</span> : 
                          <span className="text-red-500">{analysisResult.financialData.netProfitGrowth['2023']}%</span>}
                        </td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.netProfitGrowth['2024'] > 0 ? 
                          <span className="text-green-500">{analysisResult.financialData.netProfitGrowth['2024']}%</span> : 
                          <span className="text-red-500">{analysisResult.financialData.netProfitGrowth['2024']}%</span>}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-4 font-medium">{t('equityRatio', { default: 'Omavaraisuus-%' })}</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.equityRatio['2021']}%</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.equityRatio['2022']}%</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.equityRatio['2023']}%</td>
                        <td className="py-4 px-4 text-right">{analysisResult.financialData.equityRatio['2024']}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="p-6 bg-background/60 rounded-xl border border-border/30 shadow-sm mb-10 transition-all duration-300 hover:shadow-md hover:bg-background/80">
                <h3 className="text-xl font-semibold mb-6">{t('analysis', { default: 'Analyysi' })}</h3>
                <p className="text-base leading-relaxed">{analysisResult.analysis}</p>
              </div>

              {/* Toimintasuositukset */}
              <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 shadow-sm mb-6 transition-all duration-300">
                <h3 className="text-xl font-semibold mb-4 text-white">{t('recommendations', { default: 'Toimintasuositukset' })}</h3>
                <p className="text-base leading-relaxed mb-4">
                  {t('recommendationsText', { default: 'Analyysimme perusteella yrityksenne soveltuu hyvin rahoituksenhakijaksi. Suosittelemme jatkamaan tarvekartoitukseen, jotta voimme räätälöidä teille sopivimman rahoitusratkaisun.' })}
                </p>
                <p className="text-base leading-relaxed">
                  {t('nextStepsText', { default: 'Seuraavassa vaiheessa kartoitamme tarkemmin rahoitustarpeenne ja löydämme teille parhaat rahoitusvaihtoehdot.' })}
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row gap-4 py-8 border-t border-border/30">
              <Button 
                className="w-full sm:w-auto h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-md hover:shadow-lg"
                onClick={handleGetFinancing}
              >
                {t('getFinancing', { default: 'Hae rahoitusta' })}
              </Button>
              
              <Button 
                className="w-full sm:w-auto h-12 text-base font-medium bg-gradient-to-r from-background to-muted hover:from-muted hover:to-muted/80 border border-border transition-all duration-300 shadow-sm hover:shadow-md"
                variant="outline"
                onClick={handleContinue}
              >
                {t('detailedAnalysis', { default: 'Jatka tarvekartoitukseen' })}
              </Button>
              
              <Button 
                className="w-full sm:w-auto h-12 text-base font-medium bg-gradient-to-r from-background to-muted hover:from-muted hover:to-muted/80 border border-border transition-all duration-300 shadow-sm hover:shadow-md"
                variant="outline"
                onClick={handleContact}
              >
                {t('contact', { default: 'Ota yhteyttä' })}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
} 