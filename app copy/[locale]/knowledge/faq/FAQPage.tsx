'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/app/i18n/navigation'
import { 
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  CurrencyEuroIcon,
  ClockIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  CogIcon,
  RocketLaunchIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function FAQPage() {
  const t = useTranslations('FAQ')
  const [openItems, setOpenItems] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', label: t('categories.all'), icon: QuestionMarkCircleIcon },
    { id: 'general', label: t('categories.general'), icon: CurrencyEuroIcon },
    { id: 'application', label: t('categories.application'), icon: DocumentTextIcon },
    { id: 'requirements', label: t('categories.requirements'), icon: ShieldCheckIcon },
    { id: 'funding-types', label: t('categories.fundingTypes'), icon: BuildingOfficeIcon },
    { id: 'industries', label: t('categories.industries'), icon: CogIcon },
    { id: 'situations', label: t('categories.situations'), icon: RocketLaunchIcon },
    { id: 'crisis', label: t('categories.crisis'), icon: ExclamationTriangleIcon },
    { id: 'costs', label: t('categories.costs'), icon: ClockIcon }
  ]

  const faqItems = (t.raw('questions') as Array<{question: string, answer: string, category: string}>)

  // Suodatetut FAQ-kohteet
  const filteredItems = faqItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.icon || QuestionMarkCircleIcon
  }

  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden pt-16 pb-20 md:pt-20 md:pb-28">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center lg:text-left">
            <Link
              href="/knowledge"
              className="inline-flex items-center text-gold-primary hover:text-gold-highlight transition-colors mb-6"
            >
              <ArrowRightIcon className="h-4 w-4 mr-2 rotate-180" />
              {t('hero.backLink')}
            </Link>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-8 text-gold-primary">
              {t('hero.title')}
            </h1>
            
            <div className="text-lg sm:text-xl lg:text-2xl leading-relaxed mb-12 max-w-4xl">
              <p className="mb-8 text-foreground/80">
                {t('hero.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="relative py-12 bg-gray-very-dark">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:ring-2 focus:ring-gold-primary focus:border-transparent text-foreground"
                />
              </div>
              
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-card border border-border rounded-lg focus:ring-2 focus:ring-gold-primary focus:border-transparent text-foreground min-w-[200px]"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Results count */}
            <p className="text-foreground/60 mb-6">
              {t('search.resultsCount', { count: filteredItems.length })}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="relative py-20 bg-background">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto">
            {filteredItems.length > 0 ? (
              <div className="space-y-4">
                {filteredItems.map((item, index) => {
                  const IconComponent = getCategoryIcon(item.category)
                  return (
                      <div 
                        key={index} 
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm"
                      >
                        <button
                          onClick={() => toggleItem(index)}
                          className="w-full px-6 py-4 text-left flex justify-between items-center bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center pr-4">
                            <IconComponent className="h-5 w-5 text-gold-primary mr-3 flex-shrink-0" />
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {item.question}
                            </span>
                          </div>
                        {openItems.includes(index) ? (
                          <ChevronUpIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>
                      
                        {openItems.includes(index) && (
                          <div className="px-6 pb-4 bg-white dark:bg-gray-900">
                            <div className="pt-4 ml-8 border-t border-gray-200 dark:border-gray-700">
                              <p className="leading-relaxed mb-4 text-gray-900 dark:text-gray-100">
                                {item.answer}
                              </p>
                            {/* Lisää kontekstuaalisia linkkejä tiettyihin kysymyksiin */}
                            {item.question.toLowerCase().includes("factoring") && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Link 
                                  href="/funding/factoring-ar" 
                                  className="text-xs px-2 py-1 bg-gold-primary/10 text-gray-800 dark:text-gray-200 hover:bg-gold-primary/20 rounded transition-colors"
                                >
                                  {t('links.factoring')}
                                </Link>
                                <Link 
                                  href="/knowledge/glossary" 
                                  className="text-xs px-2 py-1 bg-gold-primary/10 text-gray-800 dark:text-gray-200 hover:bg-gold-primary/20 rounded transition-colors"
                                >
                                  {t('links.factoringGlossary')}
                                </Link>
                              </div>
                            )}
                            {item.question.toLowerCase().includes("luottolimiitti") && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Link 
                                  href="/funding/credit-line" 
                                  className="text-xs px-2 py-1 bg-gold-primary/10 text-gray-800 dark:text-gray-200 hover:bg-gold-primary/20 rounded transition-colors"
                                >
                                  {t('links.creditLine')}
                                </Link>
                                <Link 
                                  href="/knowledge/calculators" 
                                  className="text-xs px-2 py-1 bg-gold-primary/10 text-gray-800 dark:text-gray-200 hover:bg-gold-primary/20 rounded transition-colors"
                                >
                                  {t('links.calculators')}
                                </Link>
                              </div>
                            )}
                            {item.question.toLowerCase().includes("kasvun rahoitus") && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Link 
                                  href="/situations/growth" 
                                  className="text-xs px-2 py-1 bg-gold-primary/10 text-gray-800 dark:text-gray-200 hover:bg-gold-primary/20 rounded transition-colors"
                                >
                                  {t('links.growthFunding')}
                                </Link>
                                <Link 
                                  href="/solutions/technology" 
                                  className="text-xs px-2 py-1 bg-gold-primary/10 text-gray-800 dark:text-gray-200 hover:bg-gold-primary/20 rounded transition-colors"
                                >
                                  {t('links.technology')}
                                </Link>
                              </div>
                            )}
                            {item.question.toLowerCase().includes("käyttöpääoma") && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Link 
                                  href="/situations/working-capital" 
                                  className="text-xs px-2 py-1 bg-gold-primary/10 text-gray-800 dark:text-gray-200 hover:bg-gold-primary/20 rounded transition-colors"
                                >
                                  {t('links.workingCapital')}
                                </Link>
                                <Link 
                                  href="/solutions/retail" 
                                  className="text-xs px-2 py-1 bg-gold-primary/10 text-gray-800 dark:text-gray-200 hover:bg-gold-primary/20 rounded transition-colors"
                                >
                                  {t('links.retail')}
                                </Link>
                              </div>
                            )}
                            {item.question.toLowerCase().includes("leasing") && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Link 
                                  href="/funding/leasing" 
                                  className="text-xs px-2 py-1 bg-gold-primary/10 text-gray-800 dark:text-gray-200 hover:bg-gold-primary/20 rounded transition-colors"
                                >
                                  {t('links.leasing')}
                                </Link>
                                <Link 
                                  href="/solutions/manufacturing" 
                                  className="text-xs px-2 py-1 bg-gold-primary/10 text-gray-800 dark:text-gray-200 hover:bg-gold-primary/20 rounded transition-colors"
                                >
                                  {t('links.manufacturing')}
                                </Link>
                              </div>
                            )}
                            {item.question.toLowerCase().includes("kriisi") && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Link 
                                  href="/situations/crisis-financing" 
                                  className="text-xs px-2 py-1 bg-gold-primary/10 text-gray-800 dark:text-gray-200 hover:bg-gold-primary/20 rounded transition-colors"
                                >
                                  {t('links.crisisFinancing')}
                                </Link>
                                <Link 
                                  href="/contact" 
                                  className="text-xs px-2 py-1 bg-gold-primary/10 text-gray-800 dark:text-gray-200 hover:bg-gold-primary/20 rounded transition-colors"
                                >
                                  {t('links.contact')}
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <QuestionMarkCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('search.noResults')}
                </h3>
                <p className="text-muted-foreground">
                  {t('search.noResultsDescription')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Still have questions section */}
      <section className="relative py-20 bg-gradient-to-r from-gold-primary/10 to-gold-highlight/10">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary">
              {t('stillHaveQuestions.title')}
            </h2>
            <p className="text-xl leading-relaxed mb-8 text-foreground">
              {t('stillHaveQuestions.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-gold-primary hover:bg-gold-highlight text-gray-800 rounded-lg font-semibold transition-colors"
              >
                {t('stillHaveQuestions.contactButton')}
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex items-center px-8 py-4 bg-card border border-border rounded-lg font-semibold hover:bg-muted/50 transition-colors"
              >
                {t('stillHaveQuestions.startAnalysisButton')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="relative py-20 bg-background">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary">
              {t('relatedResources.title')}
            </h2>
            <p className="text-xl text-foreground/80 mb-12">
              {t('relatedResources.description')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Link
                href="/knowledge/guide"
                className="bg-card border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors"
              >
                <DocumentTextIcon className="h-8 w-8 text-gold-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('relatedResources.guide.title')}</h3>
                <p className="text-foreground/80 text-sm">
                  {t('relatedResources.guide.description')}
                </p>
              </Link>
              
              <Link
                href="/knowledge/calculators"
                className="bg-card border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors"
              >
                <CurrencyEuroIcon className="h-8 w-8 text-gold-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('relatedResources.calculators.title')}</h3>
                <p className="text-foreground/80 text-sm">
                  {t('relatedResources.calculators.description')}
                </p>
              </Link>
              
              <Link
                href="/knowledge/glossary"
                className="bg-card border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors"
              >
                <QuestionMarkCircleIcon className="h-8 w-8 text-gold-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('relatedResources.glossary.title')}</h3>
                <p className="text-foreground/80 text-sm">
                  {t('relatedResources.glossary.description')}
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
