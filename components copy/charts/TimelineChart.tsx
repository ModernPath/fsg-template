import React from 'react';
import { LineChart, Line } from 'recharts';
import { 
  MasterChartWrapper, 
  MasterGrid, 
  MasterXAxis, 
  MasterYAxis, 
  MasterTooltip,
  MasterEmptyState,
  MasterGradientDefs,
  MASTER_COLORS,
  formatters
} from './MasterChartStyle';

interface TimelineChartProps {
  data: Record<string, number>;
  title?: string;
  color?: string;
}

const TimelineChart = ({ 
  data, 
  title = "Vastausten jakautuminen ajassa",
  color = MASTER_COLORS.primary[0]
}: TimelineChartProps) => {
  // Convert data object to array format for recharts
  const chartData = Object.entries(data)
    .map(([date, count]) => ({
      date: formatters.date(date),
      fullDate: date,
      count
    }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    .slice(-30); // Show last 30 days

  if (chartData.length === 0) {
    return (
      <MasterEmptyState
        icon="📊"
        title="Ei vastausdata saatavilla"
        description="Vastaukset näkyvät täällä kun kyselyyn vastataan"
      />
    );
  }

  const customTooltipFormatter = (value: any) => [
    <span key="value" style={{ color: color, fontWeight: 600 }}>
      {value} vastausta
    </span>, 
    <span key="label" style={{ color: '#374151', fontWeight: 500 }}>
      Vastauksia
    </span>
  ];

  const customLabelFormatter = (label: any, payload?: any[]) => {
    if (payload && payload[0]) {
      const fullDate = payload[0].payload.fullDate;
      return formatters.dateTime(fullDate);
    }
    return label;
  };

  return (
    <div className="w-full relative space-y-4">
      {/* Summary stats */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Viimeisen 30 päivän data</span>
        <span>Yhteensä {chartData.reduce((sum, item) => sum + item.count, 0)} vastausta</span>
      </div>

      <MasterChartWrapper height={240}>
        <LineChart data={chartData}>
          <MasterGradientDefs />
          <MasterGrid />
          <MasterXAxis 
            dataKey="date" 
            tickFormatter={(value) => value}
          />
          <MasterYAxis width={30} />
          <MasterTooltip
            formatter={customTooltipFormatter}
            labelFormatter={customLabelFormatter}
            colors={[color]}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke={color}
            strokeWidth={3}
            fill={`url(#gradient-gold)`}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#fff' }}
          />
        </LineChart>
      </MasterChartWrapper>
    </div>
  );
};

export default TimelineChart;
