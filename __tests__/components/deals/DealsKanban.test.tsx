import { render, screen } from '@testing-library/react'
import { DealsKanban } from '@/components/deals/DealsKanban'
import '@testing-library/jest-dom'

// Mock DealCard component
jest.mock('@/components/deals/DealCard', () => ({
  DealCard: ({ deal }: { deal: any }) => (
    <div data-testid={`deal-card-${deal.id}`}>{deal.companies.name}</div>
  ),
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('DealsKanban', () => {
  const mockStages = [
    { id: 'lead', name: 'Lead', color: 'gray' },
    { id: 'qualification', name: 'Qualification', color: 'yellow' },
    { id: 'nda_signed', name: 'NDA Signed', color: 'blue' },
  ]

  const mockDeals = [
    {
      id: 'deal-1',
      current_stage: 'lead',
      estimated_value: 1000000,
      companies: { id: 'c1', name: 'Company A', industry: 'Tech', logo_url: '' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    },
    {
      id: 'deal-2',
      current_stage: 'qualification',
      estimated_value: 500000,
      companies: { id: 'c2', name: 'Company B', industry: 'Retail', logo_url: '' },
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    },
    {
      id: 'deal-3',
      current_stage: 'lead',
      estimated_value: 750000,
      companies: { id: 'c3', name: 'Company C', industry: 'Services', logo_url: '' },
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-17T00:00:00Z',
    },
  ]

  it('renders all stages', () => {
    render(<DealsKanban deals={mockDeals} stages={mockStages} />)
    expect(screen.getByText('Lead')).toBeInTheDocument()
    expect(screen.getByText('Qualification')).toBeInTheDocument()
    expect(screen.getByText('NDA Signed')).toBeInTheDocument()
  })

  it('shows deal count per stage', () => {
    render(<DealsKanban deals={mockDeals} stages={mockStages} />)
    // Lead stage should have 2 deals
    const badges = screen.getAllByText('2')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('displays total value per stage', () => {
    render(<DealsKanban deals={mockDeals} stages={mockStages} />)
    // Lead stage has 2 deals: 1M + 750K = 1.75M
    expect(screen.getByText('€1.8M')).toBeInTheDocument()
  })

  it('renders deals in correct stages', () => {
    render(<DealsKanban deals={mockDeals} stages={mockStages} />)
    expect(screen.getByTestId('deal-card-deal-1')).toBeInTheDocument()
    expect(screen.getByTestId('deal-card-deal-2')).toBeInTheDocument()
    expect(screen.getByTestId('deal-card-deal-3')).toBeInTheDocument()
  })

  it('shows empty state for stages with no deals', () => {
    render(<DealsKanban deals={mockDeals} stages={mockStages} />)
    // NDA Signed stage should show "No deals in this stage"
    const emptyMessages = screen.getAllByText('No deals in this stage')
    expect(emptyMessages.length).toBeGreaterThan(0)
  })

  it('handles empty deals array', () => {
    render(<DealsKanban deals={[]} stages={mockStages} />)
    mockStages.forEach(stage => {
      expect(screen.getByText(stage.name)).toBeInTheDocument()
    })
  })
})

