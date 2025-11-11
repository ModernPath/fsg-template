import { render, screen } from '@testing-library/react'
import { DealCard } from '@/components/deals/DealCard'
import '@testing-library/jest-dom'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('DealCard', () => {
  const mockDeal = {
    id: 'deal-1',
    estimated_value: 1500000,
    companies: {
      id: 'company-1',
      name: 'Acme Corp',
      industry: 'Technology',
      logo_url: '/logo.png',
    },
    buyer: {
      id: 'buyer-1',
      full_name: 'John Doe',
      email: 'john@example.com',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  }

  it('renders company name', () => {
    render(<DealCard deal={mockDeal} />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('renders company industry', () => {
    render(<DealCard deal={mockDeal} />)
    expect(screen.getByText('Technology')).toBeInTheDocument()
  })

  it('formats deal value correctly', () => {
    render(<DealCard deal={mockDeal} />)
    expect(screen.getByText('€1.5M')).toBeInTheDocument()
  })

  it('renders buyer name when available', () => {
    render(<DealCard deal={mockDeal} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders without buyer', () => {
    const dealWithoutBuyer = { ...mockDeal, buyer: undefined }
    render(<DealCard deal={dealWithoutBuyer} />)
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  it('links to deal detail page', () => {
    render(<DealCard deal={mockDeal} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/dashboard/deals/deal-1')
  })

  it('formats small values in K', () => {
    const smallDeal = { ...mockDeal, estimated_value: 50000 }
    render(<DealCard deal={smallDeal} />)
    expect(screen.getByText('€50K')).toBeInTheDocument()
  })

  it('shows company logo when available', () => {
    render(<DealCard deal={mockDeal} />)
    const logo = screen.getByRole('img')
    expect(logo).toHaveAttribute('src', '/logo.png')
  })
})

