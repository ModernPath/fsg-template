import React from 'react'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Languages, FileText, Globe, Upload } from 'lucide-react'

export default async function TranslationsPage() {
  const t = await getTranslations('Admin')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Käännökset</h1>
        <p className="text-muted-foreground">Hallitse kieltenvälisiä käännöksiä ja lokalisaatiota</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Kielet
                </p>
                <p className="text-3xl font-bold text-white">3</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <Languages className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Käännösavaimet
                </p>
                <p className="text-3xl font-bold text-white">1,247</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-full">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Valmiusaste
                </p>
                <p className="text-3xl font-bold text-white">98%</p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-full">
                <Globe className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Translation Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Kielitiedostot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                <div className="flex items-center gap-3">
                  <Languages className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-white">Suomi (fi)</p>
                    <p className="text-sm text-muted-foreground">Pääkieli - 100% valmis</p>
                  </div>
                </div>
                <span className="text-sm text-green-500 font-medium">Valmis</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                <div className="flex items-center gap-3">
                  <Languages className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-white">English (en)</p>
                    <p className="text-sm text-muted-foreground">97% käännetty</p>
                  </div>
                </div>
                <span className="text-sm text-yellow-500 font-medium">Käsittelyssä</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                <div className="flex items-center gap-3">
                  <Languages className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-white">Svenska (sv)</p>
                    <p className="text-sm text-muted-foreground">98% käännetty</p>
                  </div>
                </div>
                <span className="text-sm text-yellow-500 font-medium">Käsittelyssä</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Viimeisimmät muutokset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Päivitetty Navigation.json</p>
                  <p className="text-xs text-muted-foreground">Suomi - 2 tuntia sitten</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Lisätty uudet product-sivut</p>
                  <p className="text-xs text-muted-foreground">Englanti - 4 tuntia sitten</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Korjattu FAQ-käännökset</p>
                  <p className="text-xs text-muted-foreground">Ruotsi - 6 tuntia sitten</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-white">Käännöstyökalut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 rounded-lg border border-border hover:border-gold-primary/50 transition-all bg-background hover:bg-background/80">
              <Upload className="h-8 w-8 text-blue-500 mb-2" />
              <h3 className="font-medium text-white mb-1">Tuo käännökset</h3>
              <p className="text-sm text-muted-foreground">Lataa JSON-tiedostot</p>
            </button>

            <button className="p-4 rounded-lg border border-border hover:border-gold-primary/50 transition-all bg-background hover:bg-background/80">
              <FileText className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-medium text-white mb-1">Vie käännökset</h3>
              <p className="text-sm text-muted-foreground">Lataa kaikki kielet</p>
            </button>

            <button className="p-4 rounded-lg border border-border hover:border-gold-primary/50 transition-all bg-background hover:bg-background/80">
              <Languages className="h-8 w-8 text-purple-500 mb-2" />
              <h3 className="font-medium text-white mb-1">Tarkista puuttuvat</h3>
              <p className="text-sm text-muted-foreground">Vertaile kieliä</p>
            </button>

            <button className="p-4 rounded-lg border border-border hover:border-gold-primary/50 transition-all bg-background hover:bg-background/80">
              <Globe className="h-8 w-8 text-orange-500 mb-2" />
              <h3 className="font-medium text-white mb-1">Automaattikäännös</h3>
              <p className="text-sm text-muted-foreground">AI-avusteinen</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
