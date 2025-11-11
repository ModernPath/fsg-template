'use client'

import { Link } from '@/app/i18n/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  params: {
    locale: string
  }
}

export default function BlogArticlePage({ params }: Props) {
  const { locale } = params

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Article Header */}
      <div className="max-w-4xl mx-auto">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/blog" className="hover:text-gold-primary">Blogi</Link>
          <span className="mx-2">›</span>
          <span>Yritysrahoitus Suomessa 2025</span>
        </nav>

        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gold-primary mb-4">
            Yritysrahoitus Suomessa 2025: Kattava opas yrittäjille
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Kaikki mitä sinun tulee tietää yritysrahoituksesta Suomessa vuonna 2025. Lainat, tuet, factoring ja uudet rahoitusmuodot selkeästi selitettynä.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Julkaistu: 19.1.2025</span>
            <span>•</span>
            <span>Lukuaika: 12 min</span>
            <span>•</span>
            <span>Kategoria: Yritysrahoitus</span>
          </div>
        </header>

        {/* Article Content */}
        <article className="prose prose-lg prose-invert max-w-none">
          
          {/* Introduction */}
          <div className="bg-gradient-to-r from-gold-primary/10 to-gold-highlight/10 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Sisältö:</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Yritysrahoituksen tilanne Suomessa 2025</li>
              <li>Perinteiset rahoitusmuodot: lainat ja luotot</li>
              <li>Modernit rahoitusvaihtoehdot: factoring ja leasing</li>
              <li>Julkiset tuet ja avustukset</li>
              <li>AI ja digitaaliset ratkaisut rahoituksessa</li>
              <li>Käytännön vinkit rahoitushakemukseen</li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mb-6">Yritysrahoituksen tilanne Suomessa 2025</h2>
          
          <p className="text-lg leading-relaxed mb-6">
            Suomen yritysrahoitusmarkkinat ovat kokeneet merkittäviä muutoksia viime vuosina. Vuonna 2025 yrittäjillä on käytössään 
            entistä monipuolisemmat rahoitusvaihtoehdot, mutta samalla kilpailu asiakkaista on kiristynyt ja vaatimukset tiukentuneet.
          </p>

          <p className="text-lg leading-relaxed mb-8">
            Keskeiset trendit vuonna 2025:
          </p>

          <ul className="list-disc list-inside space-y-3 text-lg mb-8 pl-6">
            <li><strong>Digitalisoituminen:</strong> AI-pohjaiset analyysit ja automatisoitu päätöksenteko yleistyvät</li>
            <li><strong>Henkilökohtaistaminen:</strong> Rahoitusratkaisuja räätälöidään entistä tarkemmin yrityksen tarpeisiin</li>
            <li><strong>Nopeus:</strong> Rahoituspäätökset syntyvät päivissä tuntien sijaan</li>
            <li><strong>Läpinäkyvyys:</strong> Asiakkaat vaativat selkeää tietoa kustannuksista ja ehdoista</li>
          </ul>

          <h2 className="text-3xl font-bold text-white mb-6">Perinteiset rahoitusmuodot: lainat ja luotot</h2>

          <h3 className="text-2xl font-semibold text-gold-primary mb-4">Yrityslainat</h3>
          
          <p className="text-lg leading-relaxed mb-6">
            Yrityslainat ovat edelleen suosituin rahoitusmuoto suurempiin investointeihin. Vuonna 2025 keskimääräiset korot vaihtelevat 
            2,5-12% välillä riippuen yrityksen koosta, toimialasta ja riskiprofiilista.
          </p>

          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h4 className="text-xl font-semibold text-white mb-4">Yrityslainan edut:</h4>
            <ul className="list-disc list-inside space-y-2">
              <li>Kiinteät kuukausierät helpottavat budjetointia</li>
              <li>Pitkät takaisinmaksuajat (2-10 vuotta)</li>
              <li>Kilpailukykyiset korot vakavaraisia yrityksiä</li>
              <li>Ei omistusosuuden luovuttamista</li>
            </ul>
          </div>

          <h3 className="text-2xl font-semibold text-gold-primary mb-4">Yritysluottolimiitit</h3>
          
          <p className="text-lg leading-relaxed mb-6">
            Luottolimiitit soveltuvat erinomaisesti kassavirran tasaamiseen ja lyhytaikaiseen rahoitustarpeeseen. 
            Nykyään limiittejä on saatavilla jopa 500 000 euroon asti ilman vakuuksia.
          </p>

          <h2 className="text-3xl font-bold text-white mb-6">Modernit rahoitusvaihtoehdot</h2>

          <h3 className="text-2xl font-semibold text-gold-primary mb-4">Factoring ja laskurahoitus</h3>
          
          <p className="text-lg leading-relaxed mb-6">
            Factoring on kasvanut räjähdysmäisesti Suomessa. Vuonna 2025 factoring-markkinat ovat arviolta 8 miljardia euroa, 
            mikä on 40% kasvua edellisestä vuodesta.
          </p>

          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h4 className="text-xl font-semibold text-white mb-4">Factoring-palkkiot 2025:</h4>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Perinteinen factoring:</strong> 1,5-4% laskun arvosta</li>
              <li><strong>Express-factoring:</strong> 24h-maksatus, 2-6% palkkio</li>
              <li><strong>Reverse factoring:</strong> 0,8-2,5% (ostajan järjestämä)</li>
            </ul>
          </div>

          <h3 className="text-2xl font-semibold text-gold-primary mb-4">Leasing-rahoitus</h3>
          
          <p className="text-lg leading-relaxed mb-6">
            Leasing on erityisen suosittu kalusto- ja ajoneuvohankinnoissa. Uutena trendinä on "green leasing", 
            jossa ympäristöystävälliset investoinnit saavat edullisemmat ehdot.
          </p>

          <h2 className="text-3xl font-bold text-white mb-6">Julkiset tuet ja avustukset</h2>
          
          <p className="text-lg leading-relaxed mb-6">
            Suomen valtion tarjoamat tuet yrityksille ovat monipuolistuneet. Vuonna 2025 käytettävissä on yli 200 
            erilaista tukimuotoa digitalisaatiosta kestävään kehitykseen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-gold-primary">Business Finland</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Tutkimus- ja kehityshankkeet</li>
                  <li>• Kansainvälistymistuki</li>
                  <li>• Innovaatiorahoitus</li>
                  <li>• Enintään 50% hankkeen kustannuksista</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-gold-primary">ELY-keskukset</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Yrityksen kehittämisavustus</li>
                  <li>• Maaseutu-seuturahasto</li>
                  <li>• Energiatuet</li>
                  <li>• 10 000 - 500 000 euroa</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-3xl font-bold text-white mb-6">AI ja digitaaliset ratkaisut</h2>
          
          <p className="text-lg leading-relaxed mb-6">
            Tekoäly mullistaa yritysrahoitusta. AI-pohjaiset järjestelmät analysoivat yrityksen taloustietoja sekunteissa 
            ja löytävät optimaaliset rahoitusratkaisut automaattisesti.
          </p>

          <div className="bg-gradient-to-r from-gold-primary/10 to-gold-highlight/10 rounded-lg p-6 mb-8">
            <h4 className="text-xl font-semibold text-white mb-4">AI:n hyödyt rahoituksessa:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-semibold text-gold-primary mb-2">Yrityksille:</h5>
                <ul className="space-y-1 text-sm">
                  <li>• Nopeat rahoituspäätökset</li>
                  <li>• Henkilökohtaiset suositukset</li>
                  <li>• Automaattinen dokumenttianalyysi</li>
                  <li>• Reaaliaikainen riskiarviointi</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gold-primary mb-2">Rahoittajille:</h5>
                <ul className="space-y-1 text-sm">
                  <li>• Tarkempi riskiarviointi</li>
                  <li>• Automatisoitu käsittely</li>
                  <li>• Petosriskien tunnistaminen</li>
                  <li>• Kustannustehokkuus</li>
                </ul>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-6">Käytännön vinkit rahoitushakemukseen</h2>
          
          <h3 className="text-2xl font-semibold text-gold-primary mb-4">Valmistelu</h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="bg-gold-primary text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">1</div>
              <div>
                <h4 className="font-semibold text-white mb-2">Liiketoimintasuunnitelma</h4>
                <p className="text-muted-foreground">Päivitä liiketoimintasuunnitelmasi vastaamaan nykyistä tilannetta ja tulevaisuuden näkymiä.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-gold-primary text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">2</div>
              <div>
                <h4 className="font-semibold text-white mb-2">Talousluvut kuntoon</h4>
                <p className="text-muted-foreground">Varmista että tilinpäätökset, kassavirtalaskelmat ja budjetit ovat ajan tasalla.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-gold-primary text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">3</div>
              <div>
                <h4 className="font-semibold text-white mb-2">Vakuudet selviksi</h4>
                <p className="text-muted-foreground">Kartoita käytettävissä olevat vakuudet ja niiden arvot etukäteen.</p>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-semibold text-gold-primary mb-4">Hakuprosessi</h3>
          
          <p className="text-lg leading-relaxed mb-6">
            Vuonna 2025 suurin osa rahoitushakemuksista tehdään digitaalisesti. Keskimääräinen käsittelyaika on pudonnut 
            2-3 viikkoon, ja kiireellisissä tapauksissa päätös voi syntyä jopa 24 tunnissa.
          </p>

          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h4 className="text-xl font-semibold text-white mb-4">Hakemuksen liitteet 2025:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-semibold text-gold-primary mb-2">Pakollisia:</h5>
                <ul className="space-y-1 text-sm">
                  <li>• Tilinpäätös (2-3 viimeistä vuotta)</li>
                  <li>• Liiketoimintasuunnitelma</li>
                  <li>• Kassavirtalaskelma</li>
                  <li>• Rahoituksen käyttösuunnitelma</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gold-primary mb-2">Suositeltavia:</h5>
                <ul className="space-y-1 text-sm">
                  <li>• Asiakasreferenssit</li>
                  <li>• Markkina-analyysi</li>
                  <li>• Kilpailija-analyysi</li>
                  <li>• Riskianalyysi</li>
                </ul>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-6">Yhteenveto</h2>
          
          <p className="text-lg leading-relaxed mb-6">
            Yritysrahoitus Suomessa on vuonna 2025 monipuolisempaa ja saavutettavampaa kuin koskaan aiemmin. 
            AI-pohjaiset ratkaisut nopeuttavat prosesseja, kun taas uudet rahoitusmuodot tarjoavat joustavia vaihtoehtoja.
          </p>

          <p className="text-lg leading-relaxed mb-8">
            Menestyksen avaimet ovat huolellinen valmistelu, oikean rahoitusmuodon valinta ja luotettavan kumppanin löytäminen. 
            Trusty Finance auttaa yrityksiäsi näissä kaikissa vaiheissa AI-pohjaisen analyysin avulla.
          </p>

        </article>

        {/* Article Footer */}
        <footer className="border-t border-border pt-8 mt-12">
          <div className="bg-gradient-to-r from-gold-primary/10 to-gold-highlight/10 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Tarvitsetko apua rahoitushakemuksessa?
            </h3>
            <p className="text-muted-foreground mb-6">
              Trusty Finance -asiantuntijat auttavat sinua löytämään parhaan rahoitusratkaisun yrityksellesi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding">
                <Button className="bg-gold-primary text-black hover:bg-gold-highlight">
                  Aloita ilmainen analyysi
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="border-gold-primary text-gold-primary hover:bg-gold-primary hover:text-black">
                  Ota yhteyttä asiantuntijaan
                </Button>
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
