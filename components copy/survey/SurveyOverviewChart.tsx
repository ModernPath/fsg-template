'use client'

import { useMemo } from 'react'

interface SurveyOverviewChartProps {
  data: Record<string, number> | any
  type: 'timeline' | 'pie' | 'bar'
}

export function SurveyOverviewChart({ data, type }: SurveyOverviewChartProps) {
  const chartData = useMemo(() => {
    if (type === 'timeline') {
      // Timeline data should be date -> count
      const entries = Object.entries(data as Record<string, number>)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .slice(-30) // Last 30 days
      
      return entries
    } else if (type === 'pie') {
      // Pie chart data for status distribution
      return Object.entries(data).map(([key, value]) => ({
        name: formatStatusName(key),
        value: value as number,
        color: getStatusColor(key)
      }))
    }
    return []
  }, [data, type])

  const formatStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      'completed': 'Valmis',
      'in_progress': 'Käynnissä',
      'abandoned': 'Hylätty',
      'started': 'Aloitettu'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'completed': '#10b981',
      'in_progress': '#f59e0b',
      'abandoned': '#ef4444',
      'started': '#6b7280'
    }
    return colorMap[status] || '#6b7280'
  }

  if (type === 'timeline') {
    const maxValue = Math.max(...chartData.map(([_, value]) => value as number))
    
    return (
      <div className="space-y-3">
        {chartData.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Ei tietoja näytettäväksi
          </div>
        ) : (
          <div className="space-y-2">
            {chartData.map(([date, count]) => (
              <div key={date} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(date).toLocaleDateString('fi-FI', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <div className="flex items-center gap-2 flex-1 mx-4">
                  <div 
                    className="bg-blue-500 h-4 rounded transition-all duration-300"
                    style={{ 
                      width: maxValue > 0 ? `${((count as number) / maxValue) * 100}%` : '0%',
                      minWidth: count > 0 ? '4px' : '0px'
                    }}
                  />
                  <span className="text-sm font-medium min-w-[20px]">{count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (type === 'pie') {
    const total = chartData.reduce((sum, item) => sum + item.value, 0)
    
    return (
      <div className="space-y-4">
        {total === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Ei tietoja näytettäväksi
          </div>
        ) : (
          <>
            {/* Simple pie chart representation */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {chartData.map((item, index) => {
                    const percentage = (item.value / total) * 100
                    const startAngle = chartData.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 360, 0)
                    const endAngle = startAngle + (percentage / 100) * 360
                    
                    if (percentage === 0) return null
                    
                    const isLargeArc = percentage > 50 ? 1 : 0
                    const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180)
                    const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180)
                    const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180)
                    const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180)
                    
                    const pathData = [
                      'M', 50, 50,
                      'L', x1, y1,
                      'A', 40, 40, 0, isLargeArc, 1, x2, y2,
                      'Z'
                    ].join(' ')
                    
                    return (
                      <path
                        key={index}
                        d={pathData}
                        fill={item.color}
                        stroke="#fff"
                        strokeWidth="1"
                      />
                    )
                  })}
                </svg>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.value}</span>
                    <span className="text-xs text-gray-500">
                      ({((item.value / total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="text-center text-gray-500 py-8">
      Kaaviotyyppiä ei tueta
    </div>
  )
}
