'use client'

import { Link } from '@/app/i18n/navigation'
import { Button } from '@/components/ui/button'
import { CheckIcon } from '@/app/components/Icons'
import OptimizedImage from '@/components/optimized/OptimizedImage'

export default function GrowthFinancingPage() {
  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden pt-8 pb-16 md:pt-12 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative max-w-[1440px] z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Kasvun rahoittaminen – Kun mahdollisuus koputtaa ovella
            </h1>
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-4xl mx-auto">
              Se hetki tulee yllättäen. Iso asiakas haluaa tilata kolminkertaisen määrän. Kilpailija myy liiketoimintansa ja voisit ostaa sen. Tuotteesi menee viraaliksi ja tilaukset räjähtävät. Tiedät että tämä on se mahdollisuus josta olet haaveillut – mutta kasvu syö käteistä nopeammin kuin uskallat laskea.
            </p>
            <div className="flex gap-6 justify-center">
              <Button
                size="lg"
                href="/onboarding"
                variant="primary"
                className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg bg-gold-primary hover:bg-gold-highlight text-black rounded-lg shadow-md"
              >
                Aloita kasvun rahoitusanalyysi nyt →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto mb-16">
            <p className="text-lg mb-8">
              Kasvun haaste on yksinkertainen: mitä nopeammin kasvu, sitä enemmän se vaatii käyttöpääomaa. Jokainen uusi asiakas vaatii etupainotteisia investointeja. Tutkimusten mukaan 82% nopeasti kasvavista yrityksistä kokee kassavirtakriisin – ja 38% joutuu hidastamaan kasvua rahoituksen puutteen takia.
            </p>
          </div>

          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Kasvun rahoituksen haasteet
            </h2>
            <div className="flex justify-center mb-8">
              <OptimizedImage
                src="/images/other/highfly.jpeg"
                alt="Korkea lento - kasvun mahdollisuudet ja haasteet"
                width={400}
                height={320}
                className="object-contain max-w-full h-auto"
                placeholder="blur"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-gold-primary">Käyttöpääoman kasvu</h3>
              <p className="text-muted-foreground">
                Jokainen miljoonan lisämyynti sitoo 200-400k€ käyttöpääomaa. Varasto kasvaa, myyntisaatavat moninkertaistuvat, henkilöstökulut nousevat etupainotteisesti.
              </p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-gold-primary">Nopeat päätökset</h3>
              <p className="text-muted-foreground">
                Parhaat diilit vaativat nopeaa reagointia. Kilpailijan asiakaskanta myynnissä, iso tilaus 48h päätösajalla – ei aikaa viikkojen lainaprosessille.
              </p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-gold-primary">Kasvun epätasaisuus</h3>
              <p className="text-muted-foreground">
                Kasvu harvoin on lineaarista. Isot tilaukset, sesongit ja markkinamuutokset tuovat piikkejä, joihin pitää pystyä reagoimaan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Financing Options */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Rahoitusvaihtoehdot kasvuun
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Yrityslaina</h3>
              <p className="text-muted-foreground">Isompiin panostuksiin ja investointeihin</p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Yrityslimiitti</h3>
              <p className="text-muted-foreground">Joustavaan käyttöpääoman hallintaan</p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Factoring</h3>
              <p className="text-muted-foreground">Myyntisaatavien muuttaminen käteiseksi</p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Case: Verkkokauppa 0,5M → 5M € kolmessa vuodessa
            </h2>
          </div>

          <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8 mb-12">
            <div className="max-w-4xl mx-auto">
              <p className="text-lg mb-6">
                Urheiluvälineiden verkkokauppa sai yllättäen mahdollisuuden ostaa kilpailijan varaston ja asiakaskannan. Haaste: 300k€ pitäisi löytyä 2 viikossa.
              </p>
              <p className="text-lg mb-6">
                <strong className="text-gold-primary">Ratkaisu:</strong> Yrityslimiitti 150k€ + factoring vapautti 100k€ + oma kassa 50k€.
              </p>
              <p className="text-lg text-gold-primary">
                <strong>Tulos:</strong> Liikevaihto kasvoi 0,5M → 5M€ kolmessa vuodessa, yritys markkinajohtaja segmentissään.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How We Help */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Näin Trusty Finance auttaa kasvun rahoituksessa
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-3 text-gold-primary">1. Analysoimme tilanteen</h3>
              <p className="text-muted-foreground">Kartoitamme kasvupotentiaalisi, kassavirtasi ja rahoitustarpeesi</p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-3 text-gold-primary">2. Annamme räätälöidyt suositukset</h3>
              <p className="text-muted-foreground">Kerromme mitkä rahoitusvaihtoehdot sopivat juuri sinun tilanteeseesi</p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-3 text-gold-primary">3. Kilpailutamme rahoittajat</h3>
              <p className="text-muted-foreground">Haemme 3-5 tarjousta ja varmistamme parhaat ehdot</p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-3 text-gold-primary">4. Varmistamme toteutuksen</h3>
              <p className="text-muted-foreground">Rahat tilillä 48h päätöksestä, olemme mukana loppuun asti</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Miksi Trusty Finance?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <div className="flex items-start">
                <CheckIcon className="w-6 h-6 text-gold-primary mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Ymmärrämme tilanteesi</h3>
                  <p className="text-muted-foreground">Olemme auttaneet lukuisia yrityksiä samankaltaisissa tilanteissa</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <div className="flex items-start">
                <CheckIcon className="w-6 h-6 text-gold-primary mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Nopea päätös</h3>
                  <p className="text-muted-foreground">24-48h sisällä tiedät vaihtoehdot</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <div className="flex items-start">
                <CheckIcon className="w-6 h-6 text-gold-primary mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Kilpailutetut tarjoukset</h3>
                  <p className="text-muted-foreground">Saat parhaat ehdot usealta rahoittajalta</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <div className="flex items-start">
                <CheckIcon className="w-6 h-6 text-gold-primary mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Ilmainen palvelu</h3>
                  <p className="text-muted-foreground">Ei kuluja sinulle</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Aloita tästä
            </h2>
            <p className="text-xl mb-10">
              Tee ilmainen rahoitusanalyysi (2 min) tai ota yhteyttä suoraan asiantuntijoihimme.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                href="/onboarding"
                variant="primary"
                className="h-14 px-10 text-lg bg-gold-primary hover:bg-gold-highlight text-black rounded-xl shadow-lg"
              >
                Tee ilmainen rahoitusanalyysi (2 min) →
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
