'use client'

import { useEffect, useRef, useState } from 'react'

interface InternalAnalysisBotProps {
  className?: string
  context?: Record<string, any>
}

/**
 * Lightweight internal chat bot fallback using Gemini API via our backend route /api/gemini
 * (or a minimal local echo if API key missing). No external widget required.
 */
export default function InternalAnalysisBot({ className, context }: InternalAnalysisBotProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content:
        'Hei! Olen rahoitusasiantuntija. Voin selittää laskurin tulokset ja seuraavat stepit. Kerro, mitä haluat tietää.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const ask = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      // Try calc-chat (no admin requirement) with context + short history
      const payload = {
        message: text,
        context: context || {},
        history: messages.slice(-6),
        email: context?.email,
        businessId: context?.businessId,
        calculatorType: context?.calculatorType,
      }
      const res = await fetch('/api/calc-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        const answer = data?.text || data?.result || 'Kiitos kysymyksestä!'
        setMessages((m) => [...m, { role: 'assistant', content: String(answer) }])
      } else {
        // Fallback simple heuristic explanation enhanced with context
        const c = context || {}
        const r = c.result || {}
        const type = (c.calculatorType as string) || 'general_financing'
        let fallback = 'En pystynyt tavoittamaan analyysipalvelua. '
        if (type === 'business_loan' && (r.annuity || r.monthlyInterest)) {
          fallback += `Lainan arvioitu kuukausierä (annuiteetti) on noin ${r.annuity?.toLocaleString?.('fi-FI') ?? r.annuity} € ja kuukausikorko noin ${r.monthlyInterest?.toLocaleString?.('fi-FI') ?? r.monthlyInterest} €. `
        } else if (type === 'leasing' && (r.monthly || r.downPayment)) {
          fallback += `Leasing: käsiraha noin ${r.downPayment?.toLocaleString?.('fi-FI') ?? r.downPayment} €, rahoitettava osuus ${r.financed?.toLocaleString?.('fi-FI') ?? r.financed} €, kuukausierä noin ${r.monthly?.toLocaleString?.('fi-FI') ?? r.monthly} €. `
        } else if (type === 'credit_line' && (r.used || r.monthlyInterest)) {
          fallback += `Luottolimiitti: käytössä noin ${r.used?.toLocaleString?.('fi-FI') ?? r.used} €, arvioitu kuukausikorko ${r.monthlyInterest?.toLocaleString?.('fi-FI') ?? r.monthlyInterest} €. `
        } else if (type === 'factoring' && (r.advance || r.fees)) {
          fallback += `Factoring: ennakko noin ${r.advance?.toLocaleString?.('fi-FI') ?? r.advance} €, kulut noin ${r.fees?.toLocaleString?.('fi-FI') ?? r.fees} € / kk. `
        } else if (r.estimate) {
          fallback += `Arvioitu rahoitustarve noin ${r.estimate?.toLocaleString?.('fi-FI') ?? r.estimate} €. `
        }
        fallback += 'Voit säätää liukuja ja kysyä tarkennusta esimerkiksi korkoon, kestoihin tai kuluihin.'
        setMessages((m) => [...m, { role: 'assistant', content: fallback }])
      }
    } catch {
      const c = context || {}
      const r = c.result || {}
      const type = (c.calculatorType as string) || 'general_financing'
      let fallback = 'En pystynyt vastaamaan juuri nyt. '
      if (type === 'business_loan' && (r.annuity || r.monthlyInterest)) {
        fallback += `Nykyisillä arvoilla kuukausierä ~ ${r.annuity?.toLocaleString?.('fi-FI') ?? r.annuity} € ja kuukausikorko ~ ${r.monthlyInterest?.toLocaleString?.('fi-FI') ?? r.monthlyInterest} €. `
      } else if (type === 'leasing' && (r.monthly || r.downPayment)) {
        fallback += `Leasingissa käsiraha ~ ${r.downPayment?.toLocaleString?.('fi-FI') ?? r.downPayment} €, kuukausierä ~ ${r.monthly?.toLocaleString?.('fi-FI') ?? r.monthly} €. `
      } else if (type === 'credit_line' && (r.used || r.monthlyInterest)) {
        fallback += `Luottolimiitissä käyttö ~ ${r.used?.toLocaleString?.('fi-FI') ?? r.used} €, kuukausikorko ~ ${r.monthlyInterest?.toLocaleString?.('fi-FI') ?? r.monthlyInterest} €. `
      } else if (type === 'factoring' && (r.advance || r.fees)) {
        fallback += `Factoringin ennakko ~ ${r.advance?.toLocaleString?.('fi-FI') ?? r.advance} €, kulut ~ ${r.fees?.toLocaleString?.('fi-FI') ?? r.fees} €. `
      } else if (r.estimate) {
        fallback += `Arvio ~ ${r.estimate?.toLocaleString?.('fi-FI') ?? r.estimate} €. `
      }
      fallback += 'Voit kysyä esim. “Miten kuukausierä muuttuu 24 kk kestolla?”'
      setMessages((m) => [...m, { role: 'assistant', content: fallback }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <div
        ref={listRef}
        className="rounded-md border bg-background/50 p-3 h-64 overflow-y-auto space-y-2 text-sm"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === 'assistant'
                ? 'bg-muted/50 border rounded p-2'
                : 'bg-primary/10 border border-primary/20 rounded p-2'
            }
          >
            <strong className="mr-1">{msg.role === 'assistant' ? 'Asiantuntija' : 'Sinä'}:</strong>
            <span>{msg.content}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Kirjoita kysymys…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              ask()
            }
          }}
        />
        <button
          onClick={ask}
          disabled={loading}
          className="px-3 py-2 rounded-md bg-primary text-primary-foreground"
        >
          {loading ? 'Ajatellaan…' : 'Lähetä'}
        </button>
      </div>
    </div>
  )
}


