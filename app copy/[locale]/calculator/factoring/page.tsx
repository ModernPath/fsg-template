'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Building2, Calculator, TrendingUp, Zap, Target, ArrowRight, CheckCircle } from 'lucide-react'

type CompanyResult = {
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
  street?: string
  buildingNumber?: string
  entrance?: string
  apartmentNumber?: string
  postalPostCode?: string
  postalCity?: string
  postalStreet?: string
  postalBuilding?: string
  countryCode?: string
}

export default function FactoringCalculatorPage() {
  const params = useParams() as { locale?: string }
  const locale = params?.locale || 'fi'
  const supabase = createClient()

  // Step/state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Company search / manual
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<CompanyResult[]>([])
  const [useManual, setUseManual] = useState(false)

  const [businessId, setBusinessId] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [founded, setFounded] = useState('')
  const [employees, setEmployees] = useState<number | ''>('')
  const [address, setAddress] = useState('')
  const [postCode, setPostCode] = useState('')
  const [city, setCity] = useState('')

  // Factoring inputs
  const [monthlyInvoices, setMonthlyInvoices] = useState<number>(20000)
  const [avgDays, setAvgDays] = useState<number>(30)
  const advancePct = 80

  // Contact and saving
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Chatbot (floating bubble)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatTurns, setChatTurns] = useState(0)
  const chatMaxTurns = 5
  const chatPanelRef = useRef<HTMLDivElement | null>(null)

  // Debounced search
  useEffect(() => {
    const ctrl = new AbortController()
    const handler = setTimeout(async () => {
      if (!query || query.trim().length < 3 || useManual) {
        setResults([])
        return
      }
      try {
        setSearching(true)
        const res = await fetch(`/api/companies/search?query=${encodeURIComponent(query)}&limit=5`, {
          signal: ctrl.signal,
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setResults(data?.data || [])
      } catch (e) {
        // swallow; keep UX clean
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => {
      clearTimeout(handler)
      ctrl.abort()
    }
  }, [query, useManual])

  // When select company result, populate fields
  const handleSelectCompany = (c: CompanyResult) => {
    setBusinessId(c.businessId || '')
    setCompanyName(c.name || '')
    setIndustry(c.mainBusinessLine || '')
    setFounded(c.registrationDate || '')
    setEmployees('')
    setAddress(c.address || '')
    setPostCode(c.postCode || '')
    setCity(c.city || '')
    setResults([])
    setQuery(c.name)
  }

  // Track which inputs user changed
  const adjustedKeys = useMemo(() => {
    const changes: string[] = []
    if (monthlyInvoices !== 20000) changes.push('monthlyInvoices')
    if (avgDays !== 30) changes.push('avgDays')
    return changes
  }, [monthlyInvoices, avgDays])

  // Compute results and ranges
  const result = useMemo(() => {
    const advance = Math.round((monthlyInvoices * advancePct) / 100)
    const feesLow = Math.round(monthlyInvoices * 0.015)
    const feesMid = Math.round(monthlyInvoices * 0.03)
    const feesHigh = Math.round(monthlyInvoices * 0.045)
    const currentCashDelayDays = avgDays
    const factoringCashDelayDays = 2
    const freedWorkingCapital = Math.max(advance - feesMid, 0)
    const daysImproved = Math.max(currentCashDelayDays - factoringCashDelayDays, 0)
    return {
      advancePct,
      advance,
      feesLow,
      feesMid,
      feesHigh,
      freedWorkingCapital,
      daysImproved,
    }
  }, [monthlyInvoices, avgDays])

  const calculatorContext = useMemo(
    () => ({
      locale,
      calculatorType: 'factoring',
      inputs: { monthlyInvoices, avgDays },
      result,
      adjustedKeys,
    }),
    [locale, monthlyInvoices, avgDays, result, adjustedKeys]
  )

  const handleSave = async () => {
    if (!email || !companyName) {
      setError('Täytä vähintään sähköposti ja yrityksen nimi')
      return
    }
    setSaving(true)
    setError(null)
    try {
      // Get session token if available
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      // If authenticated, create/update company first
      if (token) {
        try {
          await fetch('/api/companies', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: companyName,
              business_id: businessId || undefined,
              mainBusinessLine: industry || undefined,
              registrationDate: founded || undefined,
              address: address || undefined,
              postCode: postCode || undefined,
              city: city || undefined,
            }),
          })
        } catch (e) {
          // Non-blocking
        }
      }

      // Always save lead (and invite if not authenticated)
      const payload = {
        locale,
        sourcePage: 'calculator/factoring',
        businessId: businessId || undefined,
        companyName,
        email,
        phone,
        calculatorType: 'factoring',
        inputs: { monthlyInvoices, avgDays },
        result,
        // request company creation on server even for guests
        createCompany: true,
        companyPayload: {
          name: companyName,
          business_id: businessId || undefined,
          mainBusinessLine: industry || undefined,
          registrationDate: founded || undefined,
          address: address || undefined,
          postCode: postCode || undefined,
          city: city || undefined,
        },
      }

      const res = await fetch('/api/calculator/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }

      setSaved(true)
      setStep(4)
    } catch (e: any) {
      setError(e?.message || 'Tallennus epäonnistui')
    } finally {
      setSaving(false)
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim() || chatTurns >= chatMaxTurns || chatLoading) return
    setChatLoading(true)
    const userMsg = { role: 'user' as const, content: chatInput.trim() }
    setChatHistory((h) => [...h, userMsg])
    setChatInput('')
    try {
      const res = await fetch('/api/calc-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          context: calculatorContext,
          history: chatHistory,
        }),
      })
      const data = await res.json()
      setChatHistory((h) => [...h, { role: 'assistant', content: String(data?.text || '') }])
      setChatTurns((t) => t + 1)
    } catch (e) {
      setChatHistory((h) => [...h, { role: 'assistant', content: 'Tekninen virhe, yritä hetken päästä uudelleen.' }])
      setChatTurns((t) => t + 1)
    } finally {
      setChatLoading(false)
      // scroll to bottom
      setTimeout(() => {
        chatPanelRef.current?.scrollTo({ top: chatPanelRef.current.scrollHeight, behavior: 'smooth' })
      }, 50)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-cyan-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(34,211,238,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.3),transparent_50%)]" />
      </div>

      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl"
          animate={{
            y: [0, 20, 0],
            x: [0, -10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/3 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl"
          animate={{
            y: [0, -15, 0],
            x: [0, 15, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <main className="relative z-10 text-white">
        {/* Custom Slider Styles */}
        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: linear-gradient(45deg, #06b6d4, #10b981);
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.2);
            transition: all 0.2s ease;
          }
          
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 6px 20px rgba(6, 182, 212, 0.6);
          }
          
          .slider-purple::-webkit-slider-thumb {
            background: linear-gradient(45deg, #a855f7, #ec4899);
            box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
          }
          
          .slider-purple::-webkit-slider-thumb:hover {
            box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
          }
          
          input[type="range"]::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: linear-gradient(45deg, #06b6d4, #10b981);
            cursor: pointer;
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
          }
        `}</style>
        {/* Hero Header */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="pt-16 pb-12"
        >
          <div className="mx-auto max-w-6xl px-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium">Factoring-laskuri</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-6"
            >
              Kassavirta kiitää, <br />
              <span className="text-purple-400">maksuviive häviää</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto"
            >
              Muuta myyntisaamisesi välittömäksi kassavirraksi. Laske factoringin hyödyt yrityksellesi.
            </motion.p>
          </div>
        </motion.section>

        {/* Progress Indicator */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mx-auto max-w-4xl px-6 mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            {[
              { icon: Building2, label: "Yritys", step: 1 },
              { icon: Calculator, label: "Syötteet", step: 2 },
              { icon: TrendingUp, label: "Tulokset", step: 3 },
              { icon: Target, label: "Yhteystiedot", step: 4 }
            ].map((item, index) => (
              <div key={index} className="flex items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-500 ${
                    step >= item.step 
                      ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/40 text-white' 
                      : 'bg-white/5 border border-white/10 text-slate-400'
                  }`}
                >
                  {step > item.step ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <item.icon className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium hidden md:block">{item.label}</span>
                </motion.div>
                {index < 3 && (
                  <div className={`w-8 md:w-16 h-0.5 mx-2 transition-all duration-500 ${
                    step > item.step ? 'bg-gradient-to-r from-purple-400 to-cyan-400' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.section>

        {/* Step 1: Company search or manual */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.section
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-4xl px-6 mb-12"
            >
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Yritystiedot</h2>
                        <p className="text-slate-300">Aloita hakemalla tai syöttämällä yrityksesi tiedot</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setUseManual((v) => !v)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium text-white transition-all duration-300"
                    >
                      {useManual ? '🔍 Hae automaattisesti' : '✏️ Täytä manuaalisesti'}
                    </motion.button>
                  </div>

                  {!useManual && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                          placeholder="Hae Y-tunnuksella (1234567-8) tai yrityksen nimellä..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                        {searching && (
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full"
                            />
                          </div>
                        )}
                      </div>
                      
                      {!!results.length && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          {results.map((r, index) => (
                            <motion.button
                              key={`${r.businessId}-${r.name}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              onClick={() => handleSelectCompany(r)}
                              className="w-full text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/40 rounded-xl transition-all duration-300 group"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">{r.name}</div>
                                  <div className="text-sm text-slate-400">{r.businessId} • {r.city || r.postalCity || ''}</div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transform group-hover:translate-x-1 transition-all duration-300" />
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {useManual && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      {[
                        { label: "Yrityksen nimi", value: companyName, onChange: setCompanyName, span: "md:col-span-2" },
                        { label: "Y-tunnus", value: businessId, onChange: setBusinessId },
                        { label: "Toimiala", value: industry, onChange: setIndustry },
                        { label: "Perustamisvuosi", value: founded, onChange: setFounded },
                        { label: "Henkilöstömäärä", value: employees, onChange: (v) => setEmployees(Number.isNaN(Number(v)) ? '' : Number(v)) },
                        { label: "Osoite", value: address, onChange: setAddress, span: "md:col-span-2" },
                        { label: "Postinumero", value: postCode, onChange: setPostCode },
                        { label: "Kaupunki", value: city, onChange: setCity },
                      ].map((field, index) => (
                        <motion.div
                          key={field.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className={field.span || ""}
                        >
                          <label className="block text-sm font-medium text-slate-300 mb-2">{field.label}</label>
                          <input
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder={`Anna ${field.label.toLowerCase()}...`}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-end mt-8"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(139, 92, 246, 0.4)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStep(2)}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
                    >
                      Jatka laskentaan
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.section>
          )}

          {/* Step 2: Inputs */}
          {step === 2 && (
            <motion.section
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-4xl px-6 mb-12"
            >
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl">
                      <Calculator className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Laskentaparametrit</h2>
                      <p className="text-slate-300">Säädä yrityksesi laskutustietoja</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Monthly Invoices Slider */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-lg font-semibold text-white">Kuukausilaskutus</label>
                        <div className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-lg border border-cyan-400/30">
                          <span className="text-xl font-bold text-cyan-400">
                            {monthlyInvoices.toLocaleString('fi-FI')} €
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min={1000}
                          max={200000}
                          step={500}
                          value={monthlyInvoices}
                          onChange={(e) => setMonthlyInvoices(Number(e.target.value))}
                          className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer slider-cyan"
                          style={{
                            background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((monthlyInvoices - 1000) / (200000 - 1000)) * 100}%, rgba(255,255,255,0.1) ${((monthlyInvoices - 1000) / (200000 - 1000)) * 100}%, rgba(255,255,255,0.1) 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-2">
                          <span>1 000 €</span>
                          <span>200 000 €</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">Keskimääräinen kuukausilaskutuksesi euroissa</p>
                    </motion.div>

                    {/* Average Days Slider */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-lg font-semibold text-white">Maksuviive</label>
                        <div className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-400/30">
                          <span className="text-xl font-bold text-purple-400">
                            {avgDays} päivää
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min={7}
                          max={90}
                          step={1}
                          value={avgDays}
                          onChange={(e) => setAvgDays(Number(e.target.value))}
                          className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer slider-purple"
                          style={{
                            background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((avgDays - 7) / (90 - 7)) * 100}%, rgba(255,255,255,0.1) ${((avgDays - 7) / (90 - 7)) * 100}%, rgba(255,255,255,0.1) 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-2">
                          <span>7 pv</span>
                          <span>90 pv</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">Keskimääräinen aika maksun saamiseen</p>
                    </motion.div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-end mt-8"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(6, 182, 212, 0.4)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStep(3)}
                      className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
                    >
                      Näytä tulokset
                      <TrendingUp className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.section>
          )}

        {/* Step 3: Results */}
        {step === 3 && (
          <motion.section
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-6xl px-6 mb-12"
          >
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40"
              >
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-lg font-semibold text-white">Factoring-analyysi valmis!</span>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl md:text-4xl font-bold text-white mb-4"
              >
                Kassavirtasi muutos
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-lg text-slate-300"
              >
                Näin factoring vaikuttaisi yrityksesi talouteen
              </motion.p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Advance Card */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-slate-400">≈ {advancePct}%</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Välitön kassavirta</h3>
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    {result.advance.toLocaleString('fi-FI')} €
                  </div>
                  <p className="text-sm text-slate-400 mt-2">Saat käyttöösi heti laskutuksen jälkeen</p>
                  
                  {/* Mini Progress Bar */}
                  <div className="mt-4 bg-white/10 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${advancePct}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Cost Ranges Card */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-slate-400">kuukausittain</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-4">Kustannushaarukka</h3>
                  
                  <div className="space-y-3">
                    {[
                      { label: "Edullinen", value: result.feesLow, color: "from-green-400 to-emerald-400", percent: "1.5%" },
                      { label: "Keskitaso", value: result.feesMid, color: "from-yellow-400 to-orange-400", percent: "3.0%" },
                      { label: "Premium", value: result.feesHigh, color: "from-red-400 to-pink-400", percent: "4.5%" }
                    ].map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${item.color}`} />
                          <span className="text-sm text-white">{item.label}</span>
                          <span className="text-xs text-slate-400">{item.percent}</span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {item.value.toLocaleString('fi-FI')} €
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* ROI & Benefits Card */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-slate-400">hyödyt</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-4">Liiketoimintahyödyt</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">Vapautuva käyttöpääoma</span>
                        <span className="text-lg font-bold text-blue-400">
                          {result.freedWorkingCapital.toLocaleString('fi-FI')} €
                        </span>
                      </div>
                      <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "85%" }}
                          transition={{ delay: 0.8, duration: 1 }}
                          className="h-full bg-gradient-to-r from-blue-400 to-indigo-400"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">Kiertonopeus paranee</span>
                        <span className="text-lg font-bold text-indigo-400">
                          {result.daysImproved} päivää
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Nyt: {avgDays} pv</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-emerald-400">Factoring: 1-2 pv</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Call to Action */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="text-center"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 25px 35px -5px rgba(139, 92, 246, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep(4)}
                className="px-12 py-5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-4 mx-auto"
              >
                Ota yhteyttä asiantuntijaan
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-6 h-6" />
                </motion.div>
              </motion.button>
              <p className="text-slate-400 mt-4">Saat henkilökohtaisen tarjouksen 24 tunnin sisällä</p>
            </motion.div>
          </motion.section>
        )}

        {/* Step 4: Contact & Save */}
        {step === 4 && (
          <motion.section
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl px-6 mb-12"
          >
            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-violet-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500/20 to-violet-500/20 border border-pink-400/40"
                  >
                    <Target className="w-5 h-5 text-pink-400" />
                    <span className="text-lg font-semibold text-white">Viimeistele analyysi</span>
                  </motion.div>
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-bold text-white mb-4"
                  >
                    Saat henkilökohtaisen tarjouksen
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-lg text-slate-300"
                  >
                    Anna yhteystietosi, niin läheteään sinulle yksilöllinen factoring-tarjous
                  </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-lg font-semibold text-white mb-3">Sähköpostiosoite</label>
                    <input
                      type="email"
                      className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all duration-300"
                      placeholder="nimi@yritys.fi"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-lg font-semibold text-white mb-3">Puhelinnumero</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all duration-300"
                      placeholder="+358 40 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </motion.div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 p-4 bg-red-500/20 border border-red-400/40 rounded-xl text-red-300 text-center"
                  >
                    {error}
                  </motion.div>
                )}

                {saved ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 rounded-2xl mb-4">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                      <span className="text-lg font-semibold text-white">Analyysi tallennettu!</span>
                    </div>
                    <p className="text-slate-300 text-lg">
                      Kiitos! Käsittelemme tietosi ja olemme yhteydessä pian henkilökohtaisella factoring-tarjouksella.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center"
                  >
                    <motion.button
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 25px 35px -5px rgba(236, 72, 153, 0.4)",
                      }}
                      whileTap={{ scale: 0.95 }}
                      disabled={saving}
                      onClick={handleSave}
                      className="px-12 py-5 bg-gradient-to-r from-pink-500 via-violet-500 to-purple-500 text-white text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-4 mx-auto disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                          />
                          Tallennetaan...
                        </>
                      ) : (
                        <>
                          Lähetä tarjouspyyntö
                          <ArrowRight className="w-6 h-6" />
                        </>
                      )}
                    </motion.button>
                    <p className="text-slate-400 mt-4">Vastaamme 24 tunnin sisällä • Ei sitovia sitoumuksia</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.section>
        )}
        </AnimatePresence>

        {/* Modern Floating Chatbot */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Avaa factoring-chat"
          onClick={() => setChatOpen((v) => !v)}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[9999] w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-2xl flex items-center justify-center group"
        >
          <motion.div
            animate={chatOpen ? { rotate: 45 } : { rotate: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {chatOpen ? (
              <span className="text-white text-2xl">✕</span>
            ) : (
              <div className="relative">
                <span className="text-white text-2xl">💬</span>
                {/* Pulse animation when closed */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-ping opacity-20" />
              </div>
            )}
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-28 right-6 md:bottom-32 md:right-8 z-[9999] w-[min(92vw,400px)] h-[520px] rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="relative p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-sm">🤖</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">Factoring-asiantuntija</div>
                      <div className="text-xs text-slate-300">{chatTurns}/{chatMaxTurns} kysymystä</div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-slate-300 hover:text-white p-1"
                    onClick={() => setChatOpen(false)}
                  >
                    ✕
                  </motion.button>
                </div>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatPanelRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
              >
                {chatHistory.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-slate-400 text-sm bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    💡 Kysy miten factoring vaikuttaisi kassavirtaan tai kustannuksiin. Voit viitata nykyisiin syötteisiin.
                  </motion.div>
                )}
                
                {chatHistory.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-lg whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white/10 backdrop-blur-sm text-slate-100 border border-white/20'
                    }`}>
                      {m.content}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex gap-3">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendChat() }}
                    disabled={chatLoading || chatTurns >= chatMaxTurns}
                    placeholder={chatTurns >= chatMaxTurns ? 'Keskusteluraja saavutettu' : 'Kirjoita viesti…'}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 disabled:opacity-60"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendChat}
                    disabled={chatLoading || chatTurns >= chatMaxTurns}
                    className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl disabled:opacity-50 transition-all duration-300 flex items-center justify-center min-w-[60px]"
                  >
                    {chatLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium">Lähetä</span>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}


