'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/app/components/Button';
import { Link } from '@/app/i18n/navigation';
import { IconBrain, IconShield, IconMoney, IconCalculator, IconChart, CheckIcon } from '@/app/components/Icons';
import laiskiainenFAQImage from '@/public/images/other/laiskiainen_FAQ.jpeg';

// FAQ Item-komponentti
const FaqItem = ({ question, answer, isOpen, onClick }: { 
  question: string; 
  answer: string | JSX.Element; 
  isOpen: boolean; 
  onClick: () => void 
}) => {
  return (
    <div className="border border-gray-dark rounded-lg mb-4 overflow-hidden hover:border-primary transition-all duration-300 bg-gray-very-dark">
      <button
        className="w-full flex justify-between items-center p-5 text-left focus:outline-none"
        onClick={onClick}
      >
        <h3 className="text-xl font-semibold">{question}</h3>
        <div className={`w-6 h-6 flex items-center justify-center rounded-full bg-primary/20 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg
            width="14"
            height="8"
            viewBox="0 0 14 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className=""
          >
            <path
              d="M1 1L7 7L13 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-5 pt-0 text-foreground/80">
          {answer}
        </div>
      </div>
    </div>
  );
};

interface Props {
  params: {
    locale: string;
  };
}

export default function FaqPageContent({ params }: Props) {
  const { locale } = params;
  const t = useTranslations('FAQ');
  
  // Tila FAQ-kategorioiden avaamiselle
  const [activeCategories, setActiveCategories] = useState<{ [key: string]: boolean }>({
    general: true,
    service: false,
    financing: false,
    security: false,
    technical: false
  });

  // Tila yksittäisten FAQ-kohtien avaamiselle
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  // Kategoriavaihdon käsittelijä
  const handleCategoryChange = (category: string) => {
    setActiveCategories(prev => {
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as { [key: string]: boolean });
      
      newState[category] = true;
      return newState;
    });
  };

  // FAQ-kohdan vaihdon käsittelijä
  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // FAQ-kysymykset kategorioittain
  const faqItems = {
    general: [
      {
        id: 'what-is-fsg',
        question: 'Mitä FSG Trusty Finance tekee?',
        answer: 'FSG Trusty Finance on digitaalinen rahoituspalvelu, joka yksinkertaistaa yritysten rahoitushakuprosessin. Automatisoimme rahoitusvaihtoehtojen etsinnän ja vertailun, jotta löydät yrityksellesi parhaiten sopivan rahoitusratkaisun vaivattomasti.'
      },
      {
        id: 'who-can-use',
        question: 'Kenelle palvelu on tarkoitettu?',
        answer: 'Palvelumme on suunniteltu kaikenkokoisille yrityksille - aloittavilta yrityksiltä pitkän linjan toimijoille. Erityisesti hyödynnät palveluamme, jos haet rahoitusta liiketoiminnan kasvattamiseen, laitehankintoihin, käyttöpääoman turvaamiseen tai olemassa olevien velkojen järjestelyyn.'
      },
      {
        id: 'what-makes-different',
        question: 'Miksi valita FSG Trusty Finance perinteisen pankkikierroksen sijaan?',
        answer: 'Säästät merkittävästi aikaa ja vaivaa. Sen sijaan, että kävisit läpi useita rahoittajia erikseen, vertailemme puolestasi kaikki vaihtoehdot ja esitämme sinulle parhaat tarjoukset. Lisäksi tekoälyanalyysi varmistaa, että saat juuri yrityksesi profiiliin sopivia ehdotuksia.'
      },
      {
        id: 'how-to-start',
        question: 'Kuinka pääsen alkuun?',
        answer: (
          <div>
            <p className="mb-3">Aloittaminen on yksinkertaista:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Luo käyttäjätili ja syötä yrityksesi perustiedot</li>
              <li>Toimita tarvittavat talousdokumentit järjestelmään</li>
              <li>Vastaa muutamaan kysymykseen rahoitustarpeistasi</li>
              <li>Vastaanota räätälöidyt rahoitusehdotukset ja valitse sinulle paras vaihtoehto</li>
            </ol>
          </div>
        )
      }
    ],
    service: [
      {
        id: 'how-analysis-works',
        question: 'Kuinka palvelu analysoi yritystäni?',
        answer: 'Järjestelmämme käy läpi taloustietosi ja vertaa niitä tietokantaamme, jossa on tuhansia onnistuneita rahoitustapauksia. Tekoäly tunnistaa yrityksesi vahvuudet ja sopivimmat rahoituskanavat. Analyysi ottaa huomioon toimialasi erityispiirteet, kasvuvauhdin ja nykyisen taloustilanteen.'
      },
      {
        id: 'recommendations-accuracy',
        question: 'Voinko luottaa saamiini ehdotuksiin?',
        answer: 'Ehdotuksemme perustuvat reaaliaikaiseen markkinadataan ja rahoittajien todellisiin kriteereihin. Päivitämme tietojamme jatkuvasti, joten saat aina ajankohtaiset suositukset. Muista kuitenkin, että lopullinen päätös syntyy aina rahoittajan omassa arvioinnissa - me vain ohjaamme sinut oikeaan suuntaan.'
      },
      {
        id: 'document-requirements',
        question: 'Mitä tietoja minun täytyy antaa?',
        answer: 'Aloitat helposti pelkällä tilinpäätöksellä - se riittää perusanalyysiin. Jos haluat tarkempia tuloksia, lataa myös kuluvan vuoden luvut mukaan. Järjestelmä lukee tiedot automaattisesti useimmista tiedostoformaateista, joten sinun ei tarvitse syöttää numeroita käsin.'
      },
      {
        id: 'service-cost',
        question: 'Mitä palvelu minulle maksaa?',
        answer: 'Et maksa meille mitään - palvelumme on täysin ilmainen yrityksille. Saamme palkkion rahoittajilta vain silloin, kun rahoituksesi toteutuu. Tämä tarkoittaa, että olemme motivoituneita löytämään sinulle parhaat mahdolliset ratkaisut - voitamme vain yhdessä.'
      }
    ],
    financing: [
      {
        id: 'financing-types',
        question: 'Mitä rahoitustyyppejä palvelu kattaa?',
        answer: (
          <div>
            <p className="mb-3">Palvelumme kattaa laajan valikoiman rahoitusinstrumentteja:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Yrityslimiitti ja luottolimitti</li>
              <li>Yrityslainat (vakuudelliset ja vakuudettomat)</li>
              <li>Factoring ja laskurahoitus</li>
              <li>Leasing ja Sale Lease Back -järjestelyt</li>
              <li>Lainojen uudelleenjärjestelyt</li>
              <li>Pankkitakaukset ja muut vakuusjärjestelyt</li>
            </ul>
          </div>
        )
      },
      {
        id: 'application-time',
        question: 'Kuinka kauan rahoitushakemuksen käsittely kestää?',
        answer: 'Rahoitushakemuksen käsittelyaika vaihtelee rahoitusmuodon ja rahoittajan mukaan. Nopeimmillaan vastauksen voi saada muutamissa tunneissa (yrityslimiitti, laskurahoitus), kun taas vakuudellisten lainojen käsittely voi kestää useita päiviä. Palvelumme seuraa hakemuksesi tilannetta puolestasi ja ilmoittaa, kun päätös on saatu.'
      },
      {
        id: 'rejection-reasons',
        question: 'Milloin rahoitushakemus voi kaatua?',
        answer: (
          <div>
            <p className="mb-3">Jotkut seikat voivat hankaloittaa rahoituksen saamista:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Taloustilanne näyttää epävakaalta tai yrityksellä on maksuvaikeuksia</li>
              <li>Veloissa on jo liian iso osuus liikevaihdosta</li>
              <li>Vakuudet eivät riitä tai niitä ei ole tarjota</li>
              <li>Yrityksesi on vasta aloittanut eikä historiaa ole kertynyt</li>
              <li>Toimialasi koetaan liian riskialttiiksi</li>
            </ul>
            <p className="mt-3">Älä anna näiden lannistaa! Etsimme sinulle rahoittajia, jotka ymmärtävät tilanteesi ja tarjoamme vaihtoehtoja, jotka todella voivat toimia.</p>
          </div>
        )
      },
      {
        id: 'interest-rates',
        question: 'Millaisiin kustannuksiin kannattaa varautua?',
        answer: 'Rahoituksen hinta riippuu monesta asiasta - yrityksestäsi, vakuuksista ja siitä, millaista rahoitusta haet. Pankkien peruslainat ovat yleensä edullisimpia vaihtoehtoja, kun taas vakuudettomissa rahoitusmuodoissa hinnat ovat korkeampia. Factoring-ratkaisujen kustannus määräytyy laskun arvon perusteella ja on tyypillisesti kilpailukykyinen nopean kassavirran tarpeeseen. Näytämme sinulle aina todellisen kokonaiskustannuksen, jotta tiedät mitä maksat.'
      }
    ],
    security: [
      {
        id: 'data-security',
        question: 'Miten asiakastietojen tietoturva ja tietosuoja on varmistettu?',
        answer: 'FSG Trusty Finance noudattaa korkeimpia kansainvälisiä tietoturva- ja tietosuojastandardeja. Kaikki asiakastiedot suojataan AES-256-bit salauksella sekä tiedonsiirrossa että tallennuksessa. Palvelumme toimii ISO 27001 -sertifioidussa pilviympäristössä, ja käytämme monitasoista tunnistautumista sekä jatkuvaa tietoturvavalvontaa. Noudatamme täysimääräisesti EU:n yleistä tietosuoja-asetusta (GDPR) sekä kaikkia sovellettavia kansallisia säädöksiä.'
      },
      {
        id: 'data-sharing',
        question: 'Missä tilanteissa asiakastietoja jaetaan kolmansille osapuolille?',
        answer: 'Asiakastietoja luovutetaan kolmansille osapuolille ainoastaan asiakkaan nimenomaisen suostumuksen perusteella rahoitushakemusten käsittelyn yhteydessä. Tietojen luovutus tapahtuu aina salattua yhteyttä käyttäen suoraan valittujen rahoituslaitosten kanssa. Emme myy, vuokraa tai muutoin luovuta asiakastietoja markkinointitarkoituksiin. Kaikki tietojen käsittely dokumentoidaan täydellisesti GDPR-vaatimusten mukaisesti.'
      },
      {
        id: 'data-deletion',
        question: 'Miten asiakas voi käyttää tietosuojaoikeuksiaan?',
        answer: 'Asiakkaalla on oikeus saada pääsy kaikkiin häntä koskeviin henkilötietoihin, oikaista virheellisiä tietoja, pyytää tietojen poistamista sekä rajoittaa niiden käsittelyä. Tietosuojaoikeuksien käyttämiseksi asiakas voi ottaa yhteyttä tietosuojavastaavaamme kirjallisesti. Lakisääteisiä säilytysvelvoitteita koskevat tiedot (mm. kirjanpitolaki, rahanpesulaki) säilytetään määräajan mukaisesti. Käsittelemme kaikki pyynnöt GDPR:n edellyttämässä aikataulussa.'
      }
    ],
    technical: [
      {
        id: 'supported-browsers',
        question: 'Mitä selaimia palvelu tukee?',
        answer: 'Palvelumme on optimoitu toimimaan kaikilla moderneilla selaimilla, kuten Chrome, Firefox, Safari ja Edge. Suosittelemme käyttämään uusinta saatavilla olevaa selainversiota parhaan käyttökokemuksen takaamiseksi.'
      },
      {
        id: 'mobile-support',
        question: 'Toimiiko palvelu mobiililaitteilla?',
        answer: 'Kyllä, palvelumme on täysin responsiivinen ja toimii kaikilla mobiililaitteilla. Voit käyttää analyysityökalujamme ja hakea rahoitusta missä tahansa oletkin, älypuhelimella tai tabletilla.'
      },
      {
        id: 'technical-issues',
        question: 'Mitä teen, jos kohtaan teknisiä ongelmia?',
        answer: 'Jos kohtaat teknisiä ongelmia, suosittelemme ensin tyhjentämään selaimen välimuistin ja evästeet sekä kokeilemaan toista selainta. Jos ongelmat jatkuvat, ota yhteyttä asiakaspalveluumme osoitteeseen support@trustyfinance.fi. Kuvaile ongelmaa mahdollisimman tarkasti ja liitä mukaan mahdolliset virheilmoitukset sekä käyttämäsi laitteen ja selaimen tiedot.'
      }
    ]
  };

  const currentCategory = Object.keys(activeCategories).find(key => activeCategories[key]) || 'general';
  const currentItems = faqItems[currentCategory as keyof typeof faqItems];

  return (
    <div className="relative bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col justify-center items-center bg-background overflow-hidden pt-4 pb-10 md:pt-8 md:pb-20">
        <div className="absolute inset-0 bg-background/50 z-0"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative max-w-[1440px] z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="w-full md:w-1/2 text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                {t('hero.title')}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-xl">
                {t('hero.description')}
              </p>
              <Button
                href="/contact"
                variant="primary"
                size="lg"
                className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg bg-gold-primary hover:bg-gold-highlight text-black rounded-lg shadow-md"
              >
                {t('hero.cta')}
              </Button>
            </div>
            <div className="w-full md:w-1/2 flex justify-center md:justify-end">
              <Image
                src={laiskiainenFAQImage}
                alt={t('hero.imageAlt')}
                width={600}
                height={450}
                className="object-contain rounded-xl shadow-2xl border-2 border-gold-primary/30"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('faq.title')}
            </h2>
            <p className="text-xl">
              {t('faq.description')}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Sidebar: Categories */}
            <aside className="w-full md:w-1/4">
              <div className="sticky top-24">
                <nav className="flex flex-col space-y-2">
                  {Object.keys(faqItems).map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`px-4 py-2 text-left rounded-md transition-all duration-200 ${
                        activeCategories[category] 
                          ? 'bg-primary/10 text-primary font-semibold' 
                          : 'hover:bg-primary/5 text-foreground/80'
                      }`}
                    >
                      {t(`categories.${category}`)}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Right Content: FAQs and Contact Info */}
            <div className="w-full md:w-3/4">
              {/* FAQ Items Section */}
              <div>
                <h2 className="text-3xl font-bold mb-8 text-foreground">
                  {currentCategory === 'general' && (t.rich('section.general') || 'Yleisimmät kysymykset')}
                  {currentCategory === 'service' && (t.rich('section.service') || 'Palvelun käyttö')}
                  {currentCategory === 'financing' && (t.rich('section.financing') || 'Rahoitukseen liittyvät kysymykset')}
                  {currentCategory === 'security' && (t.rich('section.security') || 'Tietoturva ja yksityisyys')}
                  {currentCategory === 'technical' && (t.rich('section.technical') || 'Tekniset kysymykset')}
                </h2>
                {Object.keys(activeCategories).map((categoryKey) => (
                  activeCategories[categoryKey] && (
                    <div key={categoryKey}>
                      {(faqItems[categoryKey as keyof typeof faqItems] || []).map((item) => (
                        <FaqItem
                          key={item.id}
                          question={item.question}
                          answer={item.answer}
                          isOpen={openItems[item.id] || false}
                          onClick={() => toggleItem(item.id)}
                        />
                      ))}
                    </div>
                  )
                ))}
              </div>

              {/* Contact Info Section - Moved here */}
              <div className="mt-16 p-8 bg-gray-very-dark rounded-2xl shadow-2xl border border-gray-dark">
                <h2 className="text-3xl font-bold mb-6 text-foreground">
                  {t('contact.title')}
                </h2>
                <p className="text-xl text-foreground/80 mb-8">
                  {t('contact.description')}
                </p>
                <Button
                  href="/contact"
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg border-gray-600 hover:bg-primary hover:text-black text-foreground/80 rounded-lg shadow-md transition-all"
                >
                  {t('contact.cta')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 