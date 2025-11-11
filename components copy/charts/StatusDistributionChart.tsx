import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { 
  MasterChartWrapper, 
  MasterTooltip,
  MasterEmptyState,
  MasterInsight,
  MASTER_COLORS
} from './MasterChartStyle';

interface StatusDistributionChartProps {
  data: {
    completed: number;
    in_progress: number;
    abandoned: number;
    started: number;
  };
}

const STATUS_CONFIG = {
  completed: { 
    label: 'Valmis', 
    color: '#22c55e',
    description: 'Kysely täytetty loppuun',
    icon: '✅'
  },
  in_progress: { 
    label: 'Kesken', 
    color: '#f59e0b',
    description: 'Kysely aloitettu mutta ei vielä valmis',
    icon: '⏳'
  },
  abandoned: { 
    label: 'Hylätty', 
    color: '#ef4444',
    description: 'Kysely aloitettu mutta hylätty',
    icon: '❌'
  },
  started: { 
    label: 'Aloitettu', 
    color: '#3b82f6',
    description: 'Kysely juuri aloitettu',
    icon: '🚀'
  }
};

const StatusDistributionChart = ({ data }: StatusDistributionChartProps) => {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  
  if (total === 0) {
    return (
      <MasterEmptyState
        icon="📊"
        title="Ei vastausdata saatavilla"
        description="Vastausten tilat näkyvät täällä kun kyselyyn vastataan"
      />
    );
  }

  // Prepare data for enhanced visualization
  const chartData = Object.entries(data)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label,
      value: count,
      percentage: ((count / total) * 100).toFixed(1),
      color: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].color,
      description: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].description,
      icon: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].icon,
      status: status
    }));

  const customTooltipFormatter = (value: any, name: string, props: any) => [
    <span key="value" style={{ color: props.payload.color, fontWeight: 600 }}>
      {value} vastausta ({props.payload.percentage}%)
    </span>, 
    <span key="name" style={{ color: '#374151', fontWeight: 500 }}>
      {name}
    </span>
  ];

  // Calculate completion rate
  const completionRate = total > 0 ? ((data.completed / total) * 100).toFixed(1) : '0';
  const abandonmentRate = total > 0 ? ((data.abandoned / total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(data).map(([status, count]) => {
          const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          
          return (
            <div key={status} className="relative overflow-hidden bg-gray-50 dark:bg-gray-800 p-4 rounded-lg hover:shadow-sm transition-shadow">
              {/* Background accent */}
              <div 
                className="absolute inset-0 opacity-5"
                style={{ backgroundColor: config.color }}
              />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">{config.icon}</div>
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: config.color }}
                  />
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: config.color }}>
                  {count}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {config.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {percentage}% kaikista
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Chart */}
        <div className="space-y-4">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            📊 Vastausten jakautuminen
          </h5>
          
          <MasterChartWrapper height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => percentage > 5 ? `${percentage}%` : null}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <MasterTooltip
                formatter={customTooltipFormatter}
                colors={chartData.map(d => d.color)}
              />
            </PieChart>
          </MasterChartWrapper>
        </div>

        {/* Status Details */}
        <div className="space-y-4">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            📋 Tilojen selitykset
          </h5>
          
          <div className="space-y-3">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-xl">{entry.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm flex items-center justify-between">
                    <span>{entry.name}</span>
                    <span className="font-bold" style={{ color: entry.color }}>
                      {entry.value}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {entry.description}
                  </div>
                  <div className="text-xs font-medium mt-1" style={{ color: entry.color }}>
                    {entry.percentage}% kaikista vastauksista
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MasterInsight
          icon="✅"
          title="Valmistumisaste"
          description={`${completionRate}% vastaajista on saanut kyselyn valmiiksi. ${
            parseFloat(completionRate) > 70 ? 'Erinomainen tulos!' :
            parseFloat(completionRate) > 50 ? 'Hyvä tulos.' :
            'Valmistumisastetta voisi parantaa.'
          }`}
          color={parseFloat(completionRate) > 70 ? 'green' : parseFloat(completionRate) > 50 ? 'blue' : 'yellow'}
        />
        
        <MasterInsight
          icon="❌"
          title="Keskeyttämisaste"
          description={`${abandonmentRate}% vastaajista on keskeyttänyt kyselyn. ${
            parseFloat(abandonmentRate) < 10 ? 'Matala keskeyttämisaste - hyvä!' :
            parseFloat(abandonmentRate) < 20 ? 'Kohtuullinen keskeyttämisaste.' :
            'Korkea keskeyttämisaste - kyselyä kannattaa tarkistaa.'
          }`}
          color={parseFloat(abandonmentRate) < 10 ? 'green' : parseFloat(abandonmentRate) < 20 ? 'yellow' : 'red'}
        />
      </div>
    </div>
  );
};

export default StatusDistributionChart;
