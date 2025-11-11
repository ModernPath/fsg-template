'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import NewAnalysisBot from '@/components/lastbot/NewAnalysisBot'
import InternalAnalysisBot from '@/components/lastbot/InternalAnalysisBot'

type CalculatorType = 'general_financing' | 'factoring' | 'business_loan' | 'credit_line' | 'leasing'

interface YtjCompany {
  businessId: string
  name: string
  address?: string
  postalAddress?: string
  registrationDate?: string
  status?: string
  website?: string
  euId?: string
  companyForm?: string
  mainBusinessLine?: string
  postCode?: string
  city?: string
}

export default function CalculatorPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'fi'
  const supabase = createClient()

  const [businessId, setBusinessId] = useState('')
  const [company, setCompany] = useState<YtjCompany | null>(null)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<CalculatorType>('general_financing')

  // Generic inputs
  const [amount, setAmount] = useState<number>(50000)
  const [termMonths, setTermMonths] = useState<number>(12)

  // Factoring specific
  const [factoringMonthlyInvoices, setFactoringMonthlyInvoices] = useState<number>(20000)
  const [factoringAvgDays, setFactoringAvgDays] = useState<number>(30)

  // Credit line specific
  const [creditLineLimit, setCreditLineLimit] = useState<number>(30000)
  const [creditLineUtilization, setCreditLineUtilization] = useState<number>(40)

  // Leasing specific
  const [leasingAssetPrice, setLeasingAssetPrice] = useState<number>(25000)
  const [leasingDownPaymentPct, setLeasingDownPaymentPct] = useState<number>(10)

  // Business loan specific
  const [loanInterestPct, setLoanInterestPct] = useState<number>(9)

  // Determine which inputs user has actually adjusted (vs. defaults)
  const adjustedKeys = useMemo(() => {
    const changed: string[] = []
    if (type === 'general_financing') {
      if (amount !== 50000) changed.push('amount')
      if (termMonths !== 12) changed.push('termMonths')
    } else if (type === 'factoring') {
      if (factoringMonthlyInvoices !== 20000) changed.push('factoringMonthlyInvoices')
      if (factoringAvgDays !== 30) changed.push('factoringAvgDays')
    } else if (type === 'credit_line') {
      if (creditLineLimit !== 30000) changed.push('creditLineLimit')
      if (creditLineUtilization !== 40) changed.push('creditLineUtilization')
    } else if (type === 'leasing') {
      if (leasingAssetPrice !== 25000) changed.push('leasingAssetPrice')
      if (leasingDownPaymentPct !== 10) changed.push('leasingDownPaymentPct')
      if (termMonths !== 12) changed.push('termMonths')
    } else if (type === 'business_loan') {
      if (amount !== 50000) changed.push('amount')
      if (termMonths !== 12) changed.push('termMonths')
      if (loanInterestPct !== 9) changed.push('loanInterestPct')
    }
    return changed
  }, [type, amount, termMonths, factoringMonthlyInvoices, factoringAvgDays, creditLineLimit, creditLineUtilization, leasingAssetPrice, leasingDownPaymentPct, loanInterestPct])

  const result = useMemo(() => {
    switch (type) {
      case 'factoring': {
        const advancePct = 80
        const advance = Math.round((factoringMonthlyInvoices * advancePct) / 100)
        const fees = Math.round(factoringMonthlyInvoices * 0.02) // illustrative
        return { advancePct, advance, fees }
      }
      case 'credit_line': {
        const used = Math.round((creditLineLimit * creditLineUtilization) / 100)
        const monthlyInterest = Math.round((used * 0.01) * 100) / 100 // 1% example
        return { used, monthlyInterest }
      }
      case 'leasing': {
        const downPayment = Math.round((leasingAssetPrice * leasingDownPaymentPct) / 100)
        const financed = leasingAssetPrice - downPayment
        const monthly = Math.round((financed / termMonths) * 1.02) // simple fee
        return { downPayment, financed, monthly }
      }
      case 'business_loan': {
        const monthlyInterest = Math.round((amount * (loanInterestPct / 100) / 12) * 100) / 100
        const annuity = Math.round(((amount / termMonths) + monthlyInterest) * 100) / 100
        return { annuity, monthlyInterest }
      }
      default: {
        const estimate = Math.round(amount * 0.9)
        return { estimate }
      }
    }
  }, [type, factoringMonthlyInvoices, factoringAvgDays, creditLineLimit, creditLineUtilization, leasingAssetPrice, leasingDownPaymentPct, termMonths, amount, loanInterestPct])

  const fetchCompany = async (query: string) => {
    try {
      const url = `/api/companies/search?query=${encodeURIComponent(query)}&limit=1`
      const res = await fetch(url)
      if (!res.ok) throw new Error('YTJ haku epäonnistui')
      const data = await res.json()
      // Support both old {results} and new {data}
      const list = Array.isArray(data?.results) ? data.results : Array.isArray(data?.data) ? data.data : []
      if (list.length > 0) {
        setCompany(list[0])
      } else {
        setCompany(null)
      }
    } catch (e) {
      setCompany(null)
    }
  }

  const saveLead = async () => {
    const inputs: any = {
      amount,
      termMonths,
      factoringMonthlyInvoices,
      factoringAvgDays,
      creditLineLimit,
      creditLineUtilization,
      leasingAssetPrice,
      leasingDownPaymentPct,
      loanInterestPct,
    }
    const payload = {
      locale,
      sourcePage: `/${locale}/calculator`,
      businessId,
      companyName: company?.name,
      email,
      phone: phone || null,
      calculatorType: type,
      inputs,
      result,
    }
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch('/api/calculator/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error('Save failed', errText)
      alert('Tallennus epäonnistui')
      return
    }
    const data = await res.json().catch(() => ({}))
    if (data?.invited) {
      alert('Tallennettu! Loimme sinulle käyttäjätilin ja lähetimme sähköpostivahvistuksen.')
    } else {
      const degraded = data && data.leadSaved === false
      alert(degraded ? 'Tallennettu! (Huom: laskurin yksityiskohtia ei voitu tallentaa — otamme yhteyttä pian.)' : 'Tallennettu! Otamme yhteyttä pian.')
    }
  }

  useEffect(() => {
    if (/^\d{7}-\d$/.test(businessId)) {
      fetchCompany(businessId)
    }
  }, [businessId])

  return (
    <div className="container max-w-4xl py-10 space-y-8">
      <h1 className="text-3xl font-semibold">Rahoituslaskuri</h1>

      {/* Y-tunnus ja perustiedot */}
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm mb-1">Y-tunnus</label>
            <input
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="1234567-8"
              className="w-full rounded-md border px-3 py-2 bg-background"
            />
            {company && (
              <p className="text-sm text-muted-foreground mt-1">{company.name} — {company.city}</p>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1">Sähköposti (pakollinen)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nimi@yritys.fi"
              className="w-full rounded-md border px-3 py-2 bg-background"
              aria-invalid={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
            />
            {!email && (
              <p className="text-xs text-red-500 mt-1">Sähköposti vaaditaan tallennusta varten.</p>
            )}
            {company?.name && (
              <p className="text-xs text-muted-foreground mt-1">Yritys: {company.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1">Puhelin (valinnainen)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+358401234567"
              className="w-full rounded-md border px-3 py-2 bg-background"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Laskennan tyyppi</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CalculatorType)}
              className="w-full rounded-md border px-3 py-2 bg-background"
            >
              <option value="general_financing">Yleinen rahoitus</option>
              <option value="factoring">Factoring</option>
              <option value="business_loan">Yrityslaina</option>
              <option value="credit_line">Yrityslimiitti</option>
              <option value="leasing">Leasing</option>
            </select>
          </div>
        </div>
      </section>

      {/* Dynaamiset syötteet tyyppikohtaisesti */}
      <section className="space-y-6">
        {type === 'general_financing' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1" title="Arvioitu rahoitustarve euroina">Tarvittava määrä (€)</label>
              <input type="range" min={5000} max={500000} step={1000} value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full" />
              <div className="text-sm text-muted-foreground mt-1">{amount.toLocaleString('fi-FI')} €</div>
            </div>
            <div>
              <label className="block text-sm mb-1" title="Rahoituksen takaisinmaksuaika kuukausina">Kesto (kk)</label>
              <input type="range" min={3} max={72} step={1} value={termMonths} onChange={(e) => setTermMonths(parseInt(e.target.value))} className="w-full" />
              <div className="text-sm text-muted-foreground mt-1">{termMonths} kk</div>
            </div>
          </div>
        )}

        {type === 'factoring' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1" title="Myyntilaskujen arvo kuukaudessa">Kuukauden laskut (€)</label>
              <input type="range" min={5000} max={500000} step={1000} value={factoringMonthlyInvoices} onChange={(e) => setFactoringMonthlyInvoices(parseInt(e.target.value))} className="w-full" />
              <div className="text-sm text-muted-foreground mt-1">{factoringMonthlyInvoices.toLocaleString('fi-FI')} €</div>
            </div>
            <div>
              <label className="block text-sm mb-1" title="Asiakkaiden keskimääräinen maksuaika päivissä">Keskimääräinen maksuaika (pv)</label>
              <input type="range" min={7} max={90} step={1} value={factoringAvgDays} onChange={(e) => setFactoringAvgDays(parseInt(e.target.value))} className="w-full" />
              <div className="text-sm text-muted-foreground mt-1">{factoringAvgDays} päivää</div>
            </div>
          </div>
        )}

        {type === 'credit_line' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1" title="Yrityslimiitin ylin mahdollinen käyttö euroina">Luottoraja (€)</label>
              <input type="range" min={5000} max={200000} step={1000} value={creditLineLimit} onChange={(e) => setCreditLineLimit(parseInt(e.target.value))} className="w-full" />
              <div className="text-sm text-muted-foreground mt-1">{creditLineLimit.toLocaleString('fi-FI')} €</div>
            </div>
            <div>
              <label className="block text-sm mb-1" title="Kuinka suuri osa limiitistä on käytössä">Käyttöaste (%)</label>
              <input type="range" min={0} max={100} step={1} value={creditLineUtilization} onChange={(e) => setCreditLineUtilization(parseInt(e.target.value))} className="w-full" />
              <div className="text-sm text-muted-foreground mt-1">{creditLineUtilization} %</div>
            </div>
          </div>
        )}

        {type === 'leasing' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1" title="Rahoitettavan kohteen hinta">Hankintahinta (€)</label>
              <input type="range" min={2000} max={150000} step={500} value={leasingAssetPrice} onChange={(e) => setLeasingAssetPrice(parseInt(e.target.value))} className="w-full" />
              <div className="text-sm text-muted-foreground mt-1">{leasingAssetPrice.toLocaleString('fi-FI')} €</div>
            </div>
            <div>
              <label className="block text-sm mb-1" title="Käsirahan osuus prosentteina hankintahinnasta">Käsiraha (%)</label>
              <input type="range" min={0} max={50} step={1} value={leasingDownPaymentPct} onChange={(e) => setLeasingDownPaymentPct(parseInt(e.target.value))} className="w-full" />
              <div className="text-sm text-muted-foreground mt-1">{leasingDownPaymentPct} %</div>
            </div>
            <div>
              <label className="block text-sm mb-1" title="Sopimuksen pituus kuukausina">Kesto (kk)</label>
              <input type="range" min={6} max={84} step={1} value={termMonths} onChange={(e) => setTermMonths(parseInt(e.target.value))} className="w-full" />
              <div className="text-sm text-muted-foreground mt-1">{termMonths} kk</div>
            </div>
          </div>
        )}

        {type === 'business_loan' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1" title="Haettavan lainan määrä">Lainan määrä (€)</label>
              <input type="range" min={5000} max={500000} step={1000} value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full" />
              <div className="text-sm text-muted-foreground mt-1">{amount.toLocaleString('fi-FI')} €</div>
            </div>
            <div>
              <label className="block text-sm mb-1" title="Lainan takaisinmaksuaika kuukausina">Kesto (kk)</label>
              <input type="range" min={6} max={84} step={1} value={termMonths} onChange={(e) => setTermMonths(parseInt(e.target.value))} className="w-full" />
              <div className="text-sm text-muted-foreground mt-1">{termMonths} kk</div>
            </div>
            <div>
              <label className="block text-sm mb-1" title="Vuosikorko ilman kuluja">Nimelliskorko (%/v)</label>
              <input type="range" min={3} max={25} step={0.5} value={loanInterestPct} onChange={(e) => setLoanInterestPct(parseFloat(e.target.value))} className="w-full" />
              <div className="text-sm text-muted-foreground mt-1">{loanInterestPct} %</div>
            </div>
          </div>
        )}
      </section>

      {/* Tulokset */}
      <section className="rounded-lg border p-4">
        <h2 className="font-medium mb-3">Tulokset</h2>
        {type === 'business_loan' && (
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>Arvioitu kuukausierä (annuiteetti): <strong>{result.annuity?.toLocaleString?.('fi-FI') ?? result.annuity} €</strong></li>
            <li>Arvioitu kuukausikorko: <strong>{result.monthlyInterest?.toLocaleString?.('fi-FI') ?? result.monthlyInterest} €</strong></li>
            <li>Lainan määrä: {amount.toLocaleString('fi-FI')} € · Kesto: {termMonths} kk · Nimelliskorko: {loanInterestPct} %/v</li>
          </ul>
        )}
        {type === 'leasing' && (
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>Käsiraha: <strong>{result.downPayment?.toLocaleString?.('fi-FI') ?? result.downPayment} €</strong></li>
            <li>Rahoitettava osuus: <strong>{result.financed?.toLocaleString?.('fi-FI') ?? result.financed} €</strong></li>
            <li>Arvioitu kuukausierä: <strong>{result.monthly?.toLocaleString?.('fi-FI') ?? result.monthly} €</strong></li>
            <li>Hankintahinta: {leasingAssetPrice.toLocaleString('fi-FI')} € · Käsiraha {leasingDownPaymentPct} % · Kesto {termMonths} kk</li>
          </ul>
        )}
        {type === 'credit_line' && (
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>Käytössä: <strong>{result.used?.toLocaleString?.('fi-FI') ?? result.used} €</strong></li>
            <li>Arvioitu kuukausikorko: <strong>{result.monthlyInterest?.toLocaleString?.('fi-FI') ?? result.monthlyInterest} €</strong></li>
            <li>Luottoraja: {creditLineLimit.toLocaleString('fi-FI')} € · Käyttöaste: {creditLineUtilization} %</li>
          </ul>
        )}
        {type === 'factoring' && (
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>Ennakko: <strong>{result.advance?.toLocaleString?.('fi-FI') ?? result.advance} €</strong></li>
            <li>Arvioidut kulut / kk: <strong>{result.fees?.toLocaleString?.('fi-FI') ?? result.fees} €</strong></li>
            <li>Kuukauden laskut: {factoringMonthlyInvoices.toLocaleString('fi-FI')} € · Maksuaika: {factoringAvgDays} pv</li>
          </ul>
        )}
        {type === 'general_financing' && (
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>Arvioitu rahoitustarve: <strong>{result.estimate?.toLocaleString?.('fi-FI') ?? result.estimate} €</strong></li>
            <li>Määrä: {amount.toLocaleString('fi-FI')} € · Kesto: {termMonths} kk</li>
          </ul>
        )}
      </section>

      {/* Chatbot (LastBot widget) */}
      <section className="rounded-lg border p-4">
        <h2 className="font-medium mb-3">Kysy rahoitusasiantuntijalta</h2>
        <p className="text-sm text-muted-foreground mb-3">Voit kysyä mitä luvut tarkoittavat, mitä tietoja tarvitaan tai miten edetä.</p>
        <p className="text-xs text-muted-foreground mb-3">Huom. Keskustelu ja syöttämäsi tiedot voidaan tallentaa analyysiä ja palvelun kehittämistä varten.</p>
        {/* Upota chat suoraan sivulle, jos käytössä */}
        <div className="min-h-24">
          {/* Erillinen analyysibotti (LastBot). Jos ei käytössä, näytetään fallback */}
          <NewAnalysisBot className="mt-4" context={{
            locale,
            businessId,
            companyName: company?.name,
            email,
            calculatorType: type,
            result,
            inputs: {
              amount,
              termMonths,
              factoringMonthlyInvoices,
              factoringAvgDays,
              creditLineLimit,
              creditLineUtilization,
              leasingAssetPrice,
              leasingDownPaymentPct,
              loanInterestPct,
            },
            adjustedKeys,
          }} />
          <InternalAnalysisBot className="mt-4" context={{
            locale,
            businessId,
            companyName: company?.name,
            email,
            calculatorType: type,
            result,
            inputs: {
              amount,
              termMonths,
              factoringMonthlyInvoices,
              factoringAvgDays,
              creditLineLimit,
              creditLineUtilization,
              leasingAssetPrice,
              leasingDownPaymentPct,
              loanInterestPct,
            },
            adjustedKeys,
          }} />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={saveLead}
          disabled={!email}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Tallenna ja jatka
        </button>
      </div>
    </div>
  )
}


