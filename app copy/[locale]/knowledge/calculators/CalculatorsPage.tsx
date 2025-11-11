'use client'

import { useState } from 'react'
import { Link } from '@/app/i18n/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from 'next-intl'

export default function CalculatorsPage() {
  const t = useTranslations('Calculators')
  const [activeCalculator, setActiveCalculator] = useState<string | null>(null)

  // Kassavirran laskuri
  const [cashFlowData, setCashFlowData] = useState({
    revenue: '',
    expenses: '',
    receivables: '',
    payables: '',
    inventory: ''
  })

  // Lainan laskuri
  const [loanData, setLoanData] = useState({
    amount: '',
    interestRate: '',
    termYears: ''
  })

  // ROI-laskuri
  const [roiData, setRoiData] = useState({
    initialInvestment: '',
    finalValue: '',
    timeYears: ''
  })

  // Factoring-laskuri
  const [factoringData, setFactoringData] = useState({
    invoiceAmount: '',
    factoringRate: '',
    discountRate: ''
  })

  // Laskentafunktiot
  const calculateCashFlow = () => {
    const revenue = parseFloat(cashFlowData.revenue) || 0
    const expenses = parseFloat(cashFlowData.expenses) || 0
    const receivables = parseFloat(cashFlowData.receivables) || 0
    const payables = parseFloat(cashFlowData.payables) || 0
    const inventory = parseFloat(cashFlowData.inventory) || 0

    const operatingCashFlow = revenue - expenses
    const workingCapital = receivables + inventory - payables
    const freeCashFlow = operatingCashFlow - (workingCapital * 0.1) // Simplified calculation

    return {
      operatingCashFlow,
      workingCapital,
      freeCashFlow
    }
  }

  const calculateLoan = () => {
    const principal = parseFloat(loanData.amount) || 0
    const annualRate = parseFloat(loanData.interestRate) / 100 || 0
    const years = parseFloat(loanData.termYears) || 0
    
    const monthlyRate = annualRate / 12
    const numberOfPayments = years * 12
    
    if (monthlyRate === 0) {
      return {
        monthlyPayment: principal / numberOfPayments,
        totalPayment: principal,
        totalInterest: 0
      }
    }

    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    
    const totalPayment = monthlyPayment * numberOfPayments
    const totalInterest = totalPayment - principal

    return {
      monthlyPayment,
      totalPayment,
      totalInterest
    }
  }

  const calculateROI = () => {
    const initial = parseFloat(roiData.initialInvestment) || 0
    const final = parseFloat(roiData.finalValue) || 0
    const years = parseFloat(roiData.timeYears) || 1

    const totalReturn = final - initial
    const roiPercentage = (totalReturn / initial) * 100
    const annualizedROI = Math.pow(final / initial, 1 / years) - 1

    return {
      totalReturn,
      roiPercentage,
      annualizedROI: annualizedROI * 100
    }
  }

  const calculateFactoring = () => {
    const amount = parseFloat(factoringData.invoiceAmount) || 0
    const rate = parseFloat(factoringData.factoringRate) / 100 || 0
    const discount = parseFloat(factoringData.discountRate) / 100 || 0

    const factoringFee = amount * rate
    const discountFee = amount * discount
    const totalFees = factoringFee + discountFee
    const netAmount = amount - totalFees

    return {
      factoringFee,
      discountFee,
      totalFees,
      netAmount,
      effectiveRate: (totalFees / amount) * 100
    }
  }

  const calculators = [
    {
      id: 'cashflow',
      title: t('calculators.cashflow.title'),
      description: t('calculators.cashflow.description'),
      icon: t('calculators.cashflow.icon')
    },
    {
      id: 'loan',
      title: t('calculators.loan.title'),
      description: t('calculators.loan.description'),
      icon: t('calculators.loan.icon')
    },
    {
      id: 'roi',
      title: t('calculators.roi.title'),
      description: t('calculators.roi.description'),
      icon: t('calculators.roi.icon')
    },
    {
      id: 'factoring',
      title: t('calculators.factoring.title'),
      description: t('calculators.factoring.description'),
      icon: t('calculators.factoring.icon')
    }
  ]

  const renderCalculator = () => {
    switch (activeCalculator) {
      case 'cashflow':
        const cashFlowResults = calculateCashFlow()
        return (
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                {t('calculators.cashflow.icon')} {t('calculators.cashflow.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="revenue" className="text-white">{t('calculators.cashflow.fields.revenue')}</Label>
                  <Input
                    id="revenue"
                    type="number"
                    value={cashFlowData.revenue}
                    onChange={(e) => setCashFlowData({...cashFlowData, revenue: e.target.value})}
                    placeholder={t('calculators.cashflow.placeholders.revenue')}
                  />
                </div>
                <div>
                  <Label htmlFor="expenses" className="text-white">{t('calculators.cashflow.fields.expenses')}</Label>
                  <Input
                    id="expenses"
                    type="number"
                    value={cashFlowData.expenses}
                    onChange={(e) => setCashFlowData({...cashFlowData, expenses: e.target.value})}
                    placeholder={t('calculators.cashflow.placeholders.expenses')}
                  />
                </div>
                <div>
                  <Label htmlFor="receivables" className="text-white">{t('calculators.cashflow.fields.receivables')}</Label>
                  <Input
                    id="receivables"
                    type="number"
                    value={cashFlowData.receivables}
                    onChange={(e) => setCashFlowData({...cashFlowData, receivables: e.target.value})}
                    placeholder={t('calculators.cashflow.placeholders.receivables')}
                  />
                </div>
                <div>
                  <Label htmlFor="payables" className="text-white">{t('calculators.cashflow.fields.payables')}</Label>
                  <Input
                    id="payables"
                    type="number"
                    value={cashFlowData.payables}
                    onChange={(e) => setCashFlowData({...cashFlowData, payables: e.target.value})}
                    placeholder={t('calculators.cashflow.placeholders.payables')}
                  />
                </div>
                <div>
                  <Label htmlFor="inventory" className="text-white">{t('calculators.cashflow.fields.inventory')}</Label>
                  <Input
                    id="inventory"
                    type="number"
                    value={cashFlowData.inventory}
                    onChange={(e) => setCashFlowData({...cashFlowData, inventory: e.target.value})}
                    placeholder={t('calculators.cashflow.placeholders.inventory')}
                  />
                </div>
              </div>
              
              <div className="bg-gold-primary/10 rounded-lg p-4 mt-6">
                <h3 className="text-lg font-semibold text-gold-primary mb-3">{t('calculators.cashflow.results.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">{t('calculators.cashflow.results.operatingCashFlow')}</div>
                    <div className="text-xl font-bold text-white">
                      {cashFlowResults.operatingCashFlow.toLocaleString('fi-FI')} €
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t('calculators.cashflow.results.workingCapital')}</div>
                    <div className="text-xl font-bold text-white">
                      {cashFlowResults.workingCapital.toLocaleString('fi-FI')} €
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t('calculators.cashflow.results.freeCashFlow')}</div>
                    <div className="text-xl font-bold text-gold-primary">
                      {cashFlowResults.freeCashFlow.toLocaleString('fi-FI')} €
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'loan':
        const loanResults = calculateLoan()
        return (
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                {t('calculators.loan.icon')} {t('calculators.loan.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount" className="text-white">{t('calculators.loan.fields.amount')}</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={loanData.amount}
                    onChange={(e) => setLoanData({...loanData, amount: e.target.value})}
                    placeholder={t('calculators.loan.placeholders.amount')}
                  />
                </div>
                <div>
                  <Label htmlFor="interestRate" className="text-white">{t('calculators.loan.fields.interestRate')}</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    value={loanData.interestRate}
                    onChange={(e) => setLoanData({...loanData, interestRate: e.target.value})}
                    placeholder={t('calculators.loan.placeholders.interestRate')}
                  />
                </div>
                <div>
                  <Label htmlFor="termYears" className="text-white">{t('calculators.loan.fields.termYears')}</Label>
                  <Input
                    id="termYears"
                    type="number"
                    value={loanData.termYears}
                    onChange={(e) => setLoanData({...loanData, termYears: e.target.value})}
                    placeholder={t('calculators.loan.placeholders.termYears')}
                  />
                </div>
              </div>
              
              <div className="bg-gold-primary/10 rounded-lg p-4 mt-6">
                <h3 className="text-lg font-semibold text-gold-primary mb-3">{t('calculators.loan.results.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">{t('calculators.loan.results.monthlyPayment')}</div>
                    <div className="text-xl font-bold text-gold-primary">
                      {loanResults.monthlyPayment.toLocaleString('fi-FI', {maximumFractionDigits: 2})} €
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t('calculators.loan.results.totalPayment')}</div>
                    <div className="text-xl font-bold text-white">
                      {loanResults.totalPayment.toLocaleString('fi-FI', {maximumFractionDigits: 2})} €
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t('calculators.loan.results.totalInterest')}</div>
                    <div className="text-xl font-bold text-white">
                      {loanResults.totalInterest.toLocaleString('fi-FI', {maximumFractionDigits: 2})} €
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'roi':
        const roiResults = calculateROI()
        return (
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                {t('calculators.roi.icon')} {t('calculators.roi.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="initialInvestment" className="text-white">{t('calculators.roi.fields.initialInvestment')}</Label>
                  <Input
                    id="initialInvestment"
                    type="number"
                    value={roiData.initialInvestment}
                    onChange={(e) => setRoiData({...roiData, initialInvestment: e.target.value})}
                    placeholder={t('calculators.roi.placeholders.initialInvestment')}
                  />
                </div>
                <div>
                  <Label htmlFor="finalValue" className="text-white">{t('calculators.roi.fields.finalValue')}</Label>
                  <Input
                    id="finalValue"
                    type="number"
                    value={roiData.finalValue}
                    onChange={(e) => setRoiData({...roiData, finalValue: e.target.value})}
                    placeholder={t('calculators.roi.placeholders.finalValue')}
                  />
                </div>
                <div>
                  <Label htmlFor="timeYears" className="text-white">{t('calculators.roi.fields.timeYears')}</Label>
                  <Input
                    id="timeYears"
                    type="number"
                    value={roiData.timeYears}
                    onChange={(e) => setRoiData({...roiData, timeYears: e.target.value})}
                    placeholder={t('calculators.roi.placeholders.timeYears')}
                  />
                </div>
              </div>
              
              <div className="bg-gold-primary/10 rounded-lg p-4 mt-6">
                <h3 className="text-lg font-semibold text-gold-primary mb-3">{t('calculators.roi.results.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">{t('calculators.roi.results.totalReturn')}</div>
                    <div className="text-xl font-bold text-white">
                      {roiResults.totalReturn.toLocaleString('fi-FI')} €
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t('calculators.roi.results.roiPercentage')}</div>
                    <div className="text-xl font-bold text-gold-primary">
                      {roiResults.roiPercentage.toFixed(1)} %
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t('calculators.roi.results.annualizedROI')}</div>
                    <div className="text-xl font-bold text-gold-primary">
                      {roiResults.annualizedROI.toFixed(1)} %
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'factoring':
        const factoringResults = calculateFactoring()
        return (
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                {t('calculators.factoring.icon')} {t('calculators.factoring.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invoiceAmount" className="text-white">{t('calculators.factoring.fields.invoiceAmount')}</Label>
                  <Input
                    id="invoiceAmount"
                    type="number"
                    value={factoringData.invoiceAmount}
                    onChange={(e) => setFactoringData({...factoringData, invoiceAmount: e.target.value})}
                    placeholder={t('calculators.factoring.placeholders.invoiceAmount')}
                  />
                </div>
                <div>
                  <Label htmlFor="factoringRate" className="text-white">{t('calculators.factoring.fields.factoringRate')}</Label>
                  <Input
                    id="factoringRate"
                    type="number"
                    step="0.1"
                    value={factoringData.factoringRate}
                    onChange={(e) => setFactoringData({...factoringData, factoringRate: e.target.value})}
                    placeholder={t('calculators.factoring.placeholders.factoringRate')}
                  />
                </div>
                <div>
                  <Label htmlFor="discountRate" className="text-white">{t('calculators.factoring.fields.discountRate')}</Label>
                  <Input
                    id="discountRate"
                    type="number"
                    step="0.1"
                    value={factoringData.discountRate}
                    onChange={(e) => setFactoringData({...factoringData, discountRate: e.target.value})}
                    placeholder={t('calculators.factoring.placeholders.discountRate')}
                  />
                </div>
              </div>
              
              <div className="bg-gold-primary/10 rounded-lg p-4 mt-6">
                <h3 className="text-lg font-semibold text-gold-primary mb-3">{t('calculators.factoring.results.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">{t('calculators.factoring.results.factoringFee')}</div>
                    <div className="text-lg font-bold text-white">
                      {factoringResults.factoringFee.toLocaleString('fi-FI', {maximumFractionDigits: 2})} €
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t('calculators.factoring.results.discountFee')}</div>
                    <div className="text-lg font-bold text-white">
                      {factoringResults.discountFee.toLocaleString('fi-FI', {maximumFractionDigits: 2})} €
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t('calculators.factoring.results.totalFees')}</div>
                    <div className="text-lg font-bold text-white">
                      {factoringResults.totalFees.toLocaleString('fi-FI', {maximumFractionDigits: 2})} €
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t('calculators.factoring.results.netAmount')}</div>
                    <div className="text-xl font-bold text-gold-primary">
                      {factoringResults.netAmount.toLocaleString('fi-FI', {maximumFractionDigits: 2})} €
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-muted-foreground">{t('calculators.factoring.results.effectiveCost')}</div>
                    <div className="text-2xl font-bold text-gold-primary">
                      {factoringResults.effectiveRate.toFixed(2)} %
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gold-primary mb-4">
          {t('hero.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t('hero.description')}
        </p>
      </div>

      {/* Calculator Selection */}
      {!activeCalculator && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {calculators.map((calculator) => (
            <Card key={calculator.id} className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
                  <span className="text-2xl">{calculator.icon}</span>
                  {calculator.title}
                </CardTitle>
                <p className="text-muted-foreground">
                  {calculator.description}
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setActiveCalculator(calculator.id)}
                  className="w-full bg-gold-primary text-black hover:bg-gold-highlight"
                >
                  {t(`calculators.${calculator.id}.button`)}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Active Calculator */}
      {activeCalculator && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => setActiveCalculator(null)}
              variant="outline"
              className="border-gold-primary text-gold-primary hover:bg-gold-primary hover:text-black"
            >
              {t('navigation.backToCalculators')}
            </Button>
          </div>
          
          {renderCalculator()}
        </div>
      )}

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-gold-primary/10 to-gold-highlight/10 rounded-lg p-8 mt-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('benefits.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('benefits.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(t.raw('benefits.items') as Array<{icon: string, title: string, description: string}>).map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          {t('cta.title')}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t('cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/onboarding">
            <Button className="bg-gold-primary text-black hover:bg-gold-highlight">
              {t('cta.primaryButton')}
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" className="border-gold-primary text-gold-primary hover:bg-gold-primary hover:text-black">
              {t('cta.secondaryButton')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}