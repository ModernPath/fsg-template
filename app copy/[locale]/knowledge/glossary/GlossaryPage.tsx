'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/app/i18n/navigation'
import { 
  BookmarkIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function GlossaryPage() {
  const t = useTranslations('Glossary')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', label: t('categories.all'), icon: BookmarkIcon },
    { id: 'general', label: t('categories.general'), icon: CurrencyEuroIcon },
    { id: 'funding-types', label: t('categories.fundingTypes'), icon: BuildingOfficeIcon },
    { id: 'process', label: t('categories.process'), icon: DocumentTextIcon },
    { id: 'ratios', label: t('categories.ratios'), icon: ChartBarIcon },
    { id: 'institutions', label: t('categories.institutions'), icon: ShieldCheckIcon },
    { id: 'situations', label: t('categories.situations'), icon: ClockIcon }
  ]

  const glossaryTerms = (t.raw('terms') as Array<{term: string, definition: string, category: string}>)

  // Suodatetut termit
  const filteredTerms = useMemo(() => {
    return glossaryTerms.filter(term => {
      const matchesSearch = searchTerm === '' || 
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory
      
      return matchesSearch && matchesCategory
    }).sort((a, b) => a.term.localeCompare(b.term))
  }, [glossaryTerms, searchTerm, selectedCategory])

  // Ryhmittele termit aakkosten mukaan
  const groupedTerms = useMemo(() => {
    const groups: { [key: string]: typeof filteredTerms } = {}
    
    filteredTerms.forEach(term => {
      const firstLetter = term.term.charAt(0).toUpperCase()
      if (!groups[firstLetter]) {
        groups[firstLetter] = []
      }
      groups[firstLetter].push(term)
    })
    
    return groups
  }, [filteredTerms])

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.icon || BookmarkIcon
  }

  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden pt-16 pb-20 md:pt-20 md:pb-28">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center lg:text-left">
            <Link
              href="/knowledge"
              className="inline-flex items-center text-gold-primary hover:text-gold-primary/80 transition-colors mb-6"
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
              {t('search.resultsCount', { count: filteredTerms.length })}
            </p>
          </div>
        </div>
      </section>

      {/* Glossary Terms */}
      <section className="relative py-20 bg-background">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto">
            {Object.keys(groupedTerms).length > 0 ? (
              <div className="space-y-12">
                {Object.keys(groupedTerms).sort().map(letter => (
                  <div key={letter}>
                    <h2 className="text-3xl font-bold text-gold-primary mb-6 border-b border-border pb-2">
                      {letter}
                    </h2>
                    <div className="grid gap-6">
                      {groupedTerms[letter].map((term, index) => {
                        const IconComponent = getCategoryIcon(term.category)
                        return (
                          <div key={index} className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-start space-x-4">
                              <IconComponent className="h-6 w-6 text-gold-primary mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                  {term.term}
                                </h3>
                                <p className="text-foreground/80 leading-relaxed">
                                  {term.definition}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookmarkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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

      {/* Related Resources */}
      <section className="relative py-20 bg-gradient-to-r from-gold-primary/10 to-gold-highlight/10">
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
                href="/knowledge/faq"
                className="bg-card border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors"
              >
                <DocumentTextIcon className="h-8 w-8 text-gold-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('relatedResources.faq.title')}</h3>
                <p className="text-foreground/80 text-sm">
                  {t('relatedResources.faq.description')}
                </p>
              </Link>
              
              <Link
                href="/knowledge/guide"
                className="bg-card border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors"
              >
                <BookmarkIcon className="h-8 w-8 text-gold-primary mx-auto mb-4" />
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
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-background">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary">
              {t('cta.title')}
            </h2>
            <p className="text-xl leading-relaxed mb-8 text-foreground">
              {t('cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/onboarding"
                className="inline-flex items-center px-8 py-4 bg-gold-primary text-black rounded-lg font-semibold hover:bg-gold-highlight transition-colors"
              >
                {t('cta.primaryButton')}
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-card border border-border rounded-lg font-semibold hover:bg-muted/50 transition-colors"
              >
                {t('cta.secondaryButton')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
