'use client'

import Image from "next/image"
import { useTranslations } from 'next-intl'
import { Button } from '@/app/components/Button'
import { Link } from '@/app/i18n/navigation'
import { IconMoney, IconCalculator, IconTarget, IconAward, IconTrendingUp, IconChart, IconShield, IconUsers, IconRocket } from '@/app/components/Icons'

interface Props {
  params: {
    locale: string
  }
}

export default function CashFlowPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('CashFlow')

  const cashFlowPatterns = [
    {
      pattern: "Sesonkivaihtelut",
      description: "Myynti vaihtelee vuodenaikojen mukaan",
      icon: IconChart,
      examples: [
        "Joulumyynti kaupassa (Q4 vilkas, Q1 hiljainen)",
        "Rakentaminen (kesä vilkas, talvi hiljainen)",
        "Matkailu (kesä/talvilomat vs. arkikaudet)",
        "Koulutuspalvelut (lukukaudet vs. lomat)"
      ],
      solutions: [
        {
          type: "Sesonkiluottolimiitti",
          how: "Ennakoidaan sesonkitarpeet ja myönnetään tilapäinen luotto hiljaisiin kausiin",
          timing: "Haetaan ennen hiljaista kautta",
          href: "/funding/credit-line"
        },
        {
          type: "Takaisinostosopimus",
          how: "Myy varastot tai saamiset väliaikaisesti, osta takaisin vilkkaana aikana",
          timing: "Toteutetaan hiljaisen kauden alussa",
          href: "/funding/factoring-ar"
        }
      ]
    },
    {
      pattern: "Maksuviiveet ja perintä",
      description: "Asiakkaat maksavat myöhässä tai ei ollenkaan",
      icon: IconCalculator,
      examples: [
        "B2B-asiakkaat venyttävät 30pv → 60-90pv",
        "Julkinen sektori maksaa hitaasti",
        "Startup-asiakkaat kassavaikeuksissa",
        "Kansainväliset asiakkaat eri maksukulttuurit"
      ],
      solutions: [
        {
          type: "Factoring",
          how: "Myy laskut rahoittajalle heti kun lähetät, eliminoi maksuaikariskin",
          timing: "Käytössä jatkuvasti",
          href: "/funding/factoring-ar"
        },
        {
          type: "Luottovakuutus + rahoitus",
          how: "Vakuuta suurimmat asiakkaat ja rahoita saamiset",
          timing: "Ennen isojen sopimusten solmimista",
          href: "/funding/factoring-ar"
        }
      ]
    },
    {
      pattern: "Odottamattomat menot",
      description: "Äkilliset isot kulut järkyttävät kassavirtaa",
      icon: IconShield,
      examples: [
        "Koneiden rikkoutuminen ja korjaukset",
        "Avainhenkilön sairastuminen",
        "Toimittajan konkurssi ja uusien etsiminen",
        "Oikeudenkäynti- tai sakkokustannukset"
      ],
      solutions: [
        {
          type: "Valmiusluotto",
          how: "Ennakkoon sovittu luottolimiitti, joka aktivoidaan tarpeen tullen",
          timing: "Sovitaan ennakkoon, käytetään kriisitilanteessa",
          href: "/funding/credit-line"
        },
        {
          type: "Pikalainaratkaisu",
          how: "Nopea rahoitus akuutteihin tilanteisiin, päätös samana päivänä",
          timing: "Heti kun tarve ilmenee",
          href: "/funding/business-loan"
        }
      ]
    },
    {
      pattern: "Kasvun aiheuttamat paineet",
      description: "Nopea kasvu syö kassavirtaa",
      icon: IconTrendingUp,
      examples: [
        "Uudet asiakkaat → lisää varastoja ja henkilöstöä",
        "Isot tilaukset → materiaalien ennakkoostoja",
        "Markkinointi → kulut ennen tuloja",
        "Henkilöstön lisäys → palkat heti, tuottavuus myöhemmin"
      ],
      solutions: [
        {
          type: "Kasvurahoitus",
          how: "Joustava rahoitus joka mukautuu yrityksen kasvutahtiin",
          timing: "Kasvuvaiheen alussa",
          href: "/funding/business-loan"
        },
        {
          type: "Revenue-based financing",
          how: "Takaisinmaksu sidottu liikevaihtoon, ei kiinteitä eriä",
          timing: "Sopii toistuville tuloille",
          href: "/funding/business-loan"
        }
      ]
    }
  ];

  const earlyWarnings = [
    {
      indicator: "Kassavarojen väheneminen",
      warningLevel: "🟡 Varoitus",
      threshold: "Kassavarat < 2 kuukauden kulut",
      action: "Aktivoi luottolimiitti, analysoi kassavirtaennuste"
    },
    {
      indicator: "Maksuviiveet lisääntyvät",
      warningLevel: "🟡 Varoitus", 
      threshold: "Myöhässä olevien laskujen % kasvaa",
      action: "Tiukenna perintää, harkitse factoring-palvelua"
    },
    {
      indicator: "Toimittajien maksuajat venyivät",
      warningLevel: "🟠 Huoli",
      threshold: "Maksat toimittajille myöhässä",
      action: "Neuvottele maksuaikataulusta, etsi lisärahoitusta"
    },
    {
      indicator: "Palkkojen tai verojen maksu vaikeutuu",
      warningLevel: "🔴 Kriittinen",
      threshold: "Ei rahaa pakollisiin maksuihin",
      action: "Hae pikaisesti lisärahoitusta, ota yhteys rahoittajaan"
    }
  ];

  const shortTermSolutions = [
    {
      urgency: "24-48 tuntia",
      situation: "Akuutti kassakriisi",
      solutions: [
        "Pikalainaratkaisut",
        "Factoring express-käsittely",
        "Luottolimiittin nostaminen",
        "Asiakkaiden ennakkomaksujen pyytäminen"
      ]
    },
    {
      urgency: "1-2 viikkoa", 
      situation: "Lähestyvä kassapula",
      solutions: [
        "Factoring-sopimus",
        "Uusi luottolimiitti",
        "Lyhytaikainen kassalaina",
        "Toimittajamaksujen uudelleenjärjestely"
      ]
    },
    {
      urgency: "1 kuukausi",
      situation: "Sesonkivalmistautuminen",
      solutions: [
        "Sesonkiluottolimiitti",
        "Varastorahoitus",
        "Kassavirtasuunnittelu",
        "Budjetin tarkistus"
      ]
    },
    {
      urgency: "3-6 kuukautta",
      situation: "Rakenteellinen muutos",
      solutions: [
        "Kokonaisvaltainen rahoitussuunnittelu",
        "Kassavirtaoptimointi",
        "Uusien asiakkaiden creditcheck",
        "Maksujärjestelmien automatisointi"
      ]
    }
  ];

  const caseStudies = [
    {
      company: "Rakennusliike",
      problem: "Julkisen sektorin projektit maksavat 90-120 pv myöhässä. Kassavaje 400k€.",
      situation: "Sesonkivaihtelut + maksuviiveet",
      solution: "Julkisten laskujen factoring + 200k€ sesonkiluottolimiitti",
      implementation: "2 viikkoa sopimuksesta käyttöön",
      result: "Kassavirta tasaantui. Voi ottaa vastaan isompia projekteja.",
      savings: "Säästö 30k€/v stressistä ja hylkäämättömistä projekteista"
    },
    {
      company: "Verkkokauppa",
      problem: "Joulumyynnin varastoostot 500k€ lokakuussa. Myynti vasta marras-joulukuussa.",
      situation: "Sesonkivaihtelut",
      solution: "Varastorahoitus 400k€ + factoring Black Friday -laskuille",
      implementation: "6 viikkoa suunnittelusta toteutukseen",
      result: "Parhaat tuotteet ei loppuneet kesken. Myynti +60% edellisvuoteen.",
      savings: "Lisämyynti 300k€ hyvän varastosaatavuuden ansiosta"
    },
    {
      company: "IT-konsultointiyritys",
      problem: "Avainasiakkaan konkurssi jätti 150k€ saamiset maksamatta.",
      situation: "Odottamattomat menot",
      solution: "Valmiusluotto 200k€ + luottovakuutus uusille asiakkaille",
      implementation: "Kriisitilanteessa luotto aktivoitu samana päivänä",
      result: "Selvittiin kriisistä. Uusia asiakkaita voi ottaa rohkeammin.",
      savings: "Tulevaisuudessa luottovakuutus estää vastaavat tappiot"
    }
  ];

  const preventiveMeasures = [
    {
      area: "Kassavirtaennusteet",
      measures: [
        "13 viikon rullaava kassavirtaennuste",
        "Skenaariomallinnus (optimistinen/realistinen/pessimistinen)",
        "Sesonkimallien hyödyntäminen historiasta",
        "Automaattiset hälytykset kassavirran käänteistä"
      ]
    },
    {
      area: "Asiakashallinta",
      measures: [
        "Luottotietojen tarkistus ennen isoja sopimuksia",
        "Maksuehtojen optimointi toimialakohtaisesti",
        "Ennakkomaksujen hyödyntäminen",
        "Asiakkaiden maksuhistorian seuranta"
      ]
    },
    {
      area: "Rahoitusvalmiudet",
      measures: [
        "Luottolimiittien ennakkosopimat",
        "Useiden rahoittajien suhteet",
        "Factoring-valmiudet isoimmille asiakkaille",
        "Vakuudet ja niiden arvostukset ajan tasalla"
      ]
    },
    {
      area: "Operatiivinen tehokkuus",
      measures: [
        "Laskutusprosessien nopeuttaminen",
        "Varastonkierron optimointi",
        "Toimittajamaksujen ajoitus",
        "Kulujen joustavuuden lisääminen"
      ]
    }
  ];

  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden pt-16 pb-20 md:pt-20 md:pb-28">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-8 text-gold-primary">
              Kassavirran tasaaminen
            </h1>
            
            <div className="text-lg sm:text-xl lg:text-2xl leading-relaxed mb-12 max-w-4xl">
              <p className="mb-8 text-foreground/80">
                Kassavirta heiluu kaikissa yrityksissä – sesonkivaihtelut, asiakkaiden maksuviiveet, 
                odottamattomat kulut ja kasvun paineet voivat aiheuttaa tilapäisiä haasteita. 
                Oikeilla työkaluilla tasaat kassavirtaa ja varaudut ennustettaviin vaihteluihin.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start mb-16">
              <Button
                href="/onboarding"
                size="lg"
                className="h-16 px-12 text-xl font-semibold bg-gold-primary hover:bg-gold-highlight text-black rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Analysoi kassavirtasi haasteet
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Kassavirtamallit */}
      <section className="relative py-20 bg-gray-very-dark">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary text-center">
              Yleisimmät kassavirtahaasteet
            </h2>
            <p className="text-xl text-center text-foreground/80">
              Tunnista oman yrityksesi kassavirtamalli ja sopivat ratkaisut
            </p>
          </div>

          <div className="space-y-16">
            {cashFlowPatterns.map((pattern, index) => {
              const IconComponent = pattern.icon;
              return (
                <div key={index} className="p-8 rounded-2xl bg-card border border-gold-primary/20">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Kassavirtamalli */}
                    <div>
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 bg-gold-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <IconComponent className="w-6 h-6 text-gold-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-3 text-gold-primary">{pattern.pattern}</h3>
                          <p className="text-foreground/80 mb-6">{pattern.description}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-blue-400">Tyypillisiä esimerkkejä:</h4>
                        <ul className="space-y-2">
                          {pattern.examples.map((example, exampleIndex) => (
                            <li key={exampleIndex} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                              <span className="text-sm text-foreground/80">{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Ratkaisut */}
                    <div className="lg:col-span-2">
                      <h4 className="text-lg font-bold mb-6 text-gold-primary">Tasausratkaisut:</h4>
                      <div className="space-y-6">
                        {pattern.solutions.map((solution, solutionIndex) => (
                          <div key={solutionIndex} className="p-6 rounded-xl bg-background border border-gold-primary/20">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
                              <h5 className="text-lg font-semibold text-gold-primary">
                                <Link href={solution.href} className="hover:text-gold-highlight underline">
                                  {solution.type}
                                </Link>
                              </h5>
                              <span className="text-sm font-medium text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
                                {solution.timing}
                              </span>
                            </div>
                            <p className="text-foreground/80">{solution.how}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Varoitusmerkit */}
      <section className="relative py-20 bg-background">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary text-center">
              Kassavirtaongelmien varoitusmerkit
            </h2>
            <p className="text-xl text-center text-foreground/80">
              Mitä ennemmin reagoit, sitä helpompi ongelma on ratkaista
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {earlyWarnings.map((warning, index) => (
              <div key={index} className="p-6 rounded-xl bg-card border border-gold-primary/20">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-2xl">{warning.warningLevel.charAt(0)}</div>
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-gold-primary">{warning.indicator}</h3>
                    <div className="text-sm text-foreground/60 mb-3">{warning.warningLevel}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-red-500 mb-1">Kynnysarvo:</div>
                    <div className="text-sm bg-red-500/10 text-red-500 px-3 py-2 rounded">
                      {warning.threshold}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-semibold text-green-500 mb-1">Suositeltava toimenpide:</div>
                    <div className="text-sm bg-green-500/10 text-green-500 px-3 py-2 rounded">
                      {warning.action}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lyhytaikaiset ratkaisut */}
      <section className="relative py-20 bg-gray-very-dark">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary text-center">
              Nopeusvaatimuksen mukaiset ratkaisut
            </h2>
            <p className="text-xl text-center text-foreground/80">
              Eri tilanteisiin tarvitaan eri nopeuden ratkaisuja
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {shortTermSolutions.map((timeframe, index) => (
              <div key={index} className="p-6 rounded-xl bg-card border border-gold-primary/20">
                <div className="mb-6">
                  <div className="text-sm font-semibold text-gold-primary mb-2">Aikaikkuna:</div>
                  <div className="text-xl font-bold text-gold-primary mb-3">{timeframe.urgency}</div>
                  <div className="text-lg text-foreground/80">{timeframe.situation}</div>
                </div>
                
                <div>
                  <div className="text-sm font-semibold text-green-500 mb-3">Käytettävissä olevat ratkaisut:</div>
                  <ul className="space-y-2">
                    {timeframe.solutions.map((solution, solutionIndex) => (
                      <li key={solutionIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0"></div>
                        <span className="text-foreground/80">{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Käytännön esimerkit */}
      <section className="relative py-20 bg-background">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary text-center">
              Kassavirtakriiseistä selviytyminen
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-12">
            {caseStudies.map((study, index) => (
              <div key={index} className="p-8 rounded-2xl bg-card border border-gold-primary/20">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-gold-primary">{study.company}</h3>
                    <div className="text-sm text-blue-400 bg-blue-400/10 px-3 py-1 rounded mb-3">
                      {study.situation}
                    </div>
                    <div className="text-sm text-green-500">
                      Toteutus: {study.implementation}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-red-500">Ongelma:</h4>
                    <p className="text-foreground/80">{study.problem}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-gold-primary">Ratkaisu:</h4>
                    <p className="text-foreground/80">{study.solution}</p>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <h4 className="text-lg font-semibold mb-3 text-green-500">Tulos:</h4>
                    <p className="text-foreground/80 mb-2">{study.result}</p>
                    <div className="text-sm bg-green-500/10 text-green-500 px-3 py-1 rounded">
                      {study.savings}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-blue-400">Vaikutus:</h4>
                    <p className="text-sm text-foreground/80">{study.savings}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ennaltaehkäisy */}
      <section className="relative py-20 bg-gray-very-dark">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-16 text-gold-primary text-center">
              Kassavirtaongelmien ennaltaehkäisy
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {preventiveMeasures.map((area, index) => (
                <div key={index} className="p-6 rounded-xl bg-card border border-gold-primary/20">
                  <h3 className="text-xl font-bold mb-4 text-gold-primary">{area.area}</h3>
                  <ul className="space-y-3">
                    {area.measures.map((measure, measureIndex) => (
                      <li key={measureIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-gold-primary mt-2 shrink-0"></div>
                        <span className="text-foreground/80">{measure}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-background text-center">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary">
            Tasaa kassavirtasi älykkäästi
          </h2>
          
          <div className="max-w-3xl mx-auto mb-12">
            <p className="text-xl md:text-2xl leading-relaxed mb-8">
              Tekoälyanalyysimme tunnistaa kassavirtasi mallit:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gold-primary shrink-0"></div>
                <span>Sesonkimallit ja niiden ennustaminen</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gold-primary shrink-0"></div>
                <span>Asiakkaiden maksumallit ja riskit</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gold-primary shrink-0"></div>
                <span>Optimaaliset tasausratkaisut</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gold-primary shrink-0"></div>
                <span>Ennaltaehkäisevät toimenpiteet</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              href="/onboarding"
              size="lg"
              className="h-16 px-12 text-xl font-semibold bg-gold-primary hover:bg-gold-highlight text-black rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Aloita kassavirtaanalyysi
            </Button>
            
            <div className="text-lg text-foreground/80">
              <p>Tai soita meille: <a href="tel:+358501234567" className="text-gold-primary hover:text-gold-highlight font-semibold">050 123 4567</a></p>
              <p className="text-sm">Kassavirta-asiantuntijat arkisin 8-18</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
