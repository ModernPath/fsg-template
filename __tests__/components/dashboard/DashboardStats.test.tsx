import { render, screen } from '@testing-library/react'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import '@testing-library/jest-dom'

describe('DashboardStats', () => {
  const mockStats = {
    companiesCount: 10,
    dealsCount: 25,
    totalValue: 5000000,
    activeDeals: 15,
  }

  it('renders all stat cards', () => {
    render(<DashboardStats stats={mockStats} />)
    expect(screen.getByText('Companies')).toBeInTheDocument()
    expect(screen.getByText('Total Deals')).toBeInTheDocument()
    expect(screen.getByText('Pipeline Value')).toBeInTheDocument()
    expect(screen.getByText('Active Deals')).toBeInTheDocument()
  })

  it('displays company count correctly', () => {
    render(<DashboardStats stats={mockStats} />)
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('displays deals count correctly', () => {
    render(<DashboardStats stats={mockStats} />)
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('formats total value in millions', () => {
    render(<DashboardStats stats={mockStats} />)
    // 5,000,000 / 1,000,000 = €5.0M
    expect(screen.getByText('€5.0M')).toBeInTheDocument()
  })

  it('displays active deals count', () => {
    render(<DashboardStats stats={mockStats} />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('shows percentage changes', () => {
    render(<DashboardStats stats={mockStats} />)
    const changes = screen.getAllByText(/\+\d+%/)
    expect(changes.length).toBe(4)
  })

  it('handles zero values', () => {
    const zeroStats = {
      companiesCount: 0,
      dealsCount: 0,
      totalValue: 0,
      activeDeals: 0,
    }
    render(<DashboardStats stats={zeroStats} />)
    expect(screen.getByText('€0.0M')).toBeInTheDocument()
  })

  it('renders icons for each stat card', () => {
    const { container } = render(<DashboardStats stats={mockStats} />)
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThanOrEqual(4)
  })
})

