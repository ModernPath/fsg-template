'use client'

import { Link } from '@/app/i18n/navigation'
import { Button } from '@/components/ui/button'
import { CheckIcon } from '@/app/components/Icons'
import OptimizedImage from '@/components/optimized/OptimizedImage'

export default function CrisisFinancingPage() {
  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden pt-8 pb-16 md:pt-12 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative max-w-[1440px] z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Kriisirahoitus – Kun jokainen päivä ratkaisee
            </h1>
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-4xl mx-auto">
              Kriisi ei kysy lupaa. Iso asiakas menee konkurssiin ja vie 40% liikevaihdosta. Korona sulkee bisneksen. Avainhenkilö lähtee ja vie asiakkaat. Toimittaja vaatii vanhat velat tai uhkaa toimituskiellolla. Palkkapäivä on ylihuomenna mutta kassassa ei ole rahaa.
            </p>
            <div className="flex gap-6 justify-center">
              <Button
                size="lg"
                href="/onboarding"
                variant="primary"
                className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg bg-gold-primary hover:bg-gold-highlight text-black rounded-lg shadow-md"
              >
                Hae kriisiapua heti →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunity Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto mb-16">
            <p className="text-lg mb-8">
              Yrityksen kriisi on yrittäjän henkilökohtainen haaste. Mutta kriisissä on myös mahdollisuus. 73% tervehdytetyistä yrityksistä on kannattavampia kriisin jälkeen kuin ennen sitä.
            </p>
          </div>

          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Kriisin vaiheet ja ratkaisut
            </h2>
            <div className="flex justify-center mb-8">
              <OptimizedImage
                src="/images/other/terapia.jpeg"
                alt="Terapia istunto - kriisien käsittely ja ratkaisu"
                width={400}
                height={320}
                className="object-contain max-w-full h-auto"
                placeholder="blur"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-gold-primary">Akuutti kassavirtakriisi</h3>
              <p className="text-muted-foreground mb-4">
                Kassa loppuu 1-7 päivässä. Palkat maksamatta, vuokrat rästissä.
              </p>
              <p className="text-sm text-gold-primary">
                Ratkaisu: Pikarahoitus yrityslimiitillä, päätös 24h
              </p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-gold-primary">Asiakaskato</h3>
              <p className="text-muted-foreground mb-4">
                Liikevaihto putoaa 30-70%. Iso asiakas lähtee, markkina muuttuu.
              </p>
              <p className="text-sm text-gold-primary">
                Ratkaisu: Factoring jäljellä oleville laskuille, limiitti kuluihin
              </p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-gold-primary">Toimittajavelkakriisi</h3>
              <p className="text-muted-foreground mb-4">
                Ostovelat kasaantuneet, toimituskieltouhka.
              </p>
              <p className="text-sm text-gold-primary">
                Ratkaisu: Velkajärjestely + rahoitus, neuvottelut
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
              Kriisirahoituksen vaihtoehdot
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Yrityslimiitti</h3>
              <p className="text-muted-foreground">Nopea kassa-apu, käytössä 24h</p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Factoring</h3>
              <p className="text-muted-foreground">Vapauta saataviin sitoutunut raha</p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Tervehdyttämislaina</h3>
              <p className="text-muted-foreground">Pidemmän aikavälin ratkaisu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Case: Ravintola selvisi koronasta
            </h2>
          </div>

          <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8 mb-12">
            <div className="max-w-4xl mx-auto">
              <p className="text-lg mb-6">
                Fine dining -ravintola Helsingissä, liikevaihto 2,4M€, korona sulki ovet.
              </p>
              <p className="text-lg mb-6">
                <strong className="text-gold-primary">Akuuttitoimet:</strong> Hätälimiitti 150k€, neuvottelut vuokranantajan kanssa, lomautukset.
              </p>
              <p className="text-lg mb-6">
                <strong className="text-gold-primary">Muutos:</strong> Take away -konsepti, limiitillä muutostyöt.
              </p>
              <p className="text-lg text-gold-primary">
                <strong>Tulos:</strong> Liikevaihto 3,1M€, kaksi konseptia, kate 8% → 12%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fast Decisions */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Kriisistä selviäminen vaatii nopeita päätöksiä
            </h2>
            <p className="text-lg">
              Kriisitilanteessa aika on ratkaiseva tekijä. Mitä nopeammin saat kassavirran stabiloitua, sitä paremmat mahdollisuudet on selvitä ja kääntyä kasvuun. Analysoimme tilanteesi kiireellisesti, löydämme välittömät ratkaisut akuuttiin tarpeeseen ja autamme rakentamaan pidemmän aikavälin suunnitelman. Kriisi voi olla käännekohta parempaan – kunhan rahoitus on kunnossa.
            </p>
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
