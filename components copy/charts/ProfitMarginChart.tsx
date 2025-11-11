import React from 'react';
import { AreaChart, Area } from 'recharts';
import { 
  MasterChartWrapper, 
  MasterGrid, 
  MasterXAxis, 
  MasterYAxis, 
  MasterTooltip,
  MasterEmptyState,
  MasterInsight,
  MasterGradientDefs,
  MASTER_COLORS,
  formatters
} from './MasterChartStyle';

interface ProfitMarginChartProps {
  data: {
    month: string;
    profit: number;
  }[];
  color?: string;
}

const ProfitMarginChart = ({ data, color = MASTER_COLORS.primary[0] }: ProfitMarginChartProps) => {
  if (!data || data.length === 0) {
    return (
      <MasterEmptyState
        icon="📈"
        title="Ei voittomarginaalidataa saatavilla"
        description="Voittomarginaalin kehitys näkyy täällä kun dataa on saatavilla"
      />
    );
  }

  // Calculate profit margin metrics
  const avgProfit = data.reduce((sum, item) => sum + item.profit, 0) / data.length;
  const maxProfit = Math.max(...data.map(item => item.profit));
  const minProfit = Math.min(...data.map(item => item.profit));
  const lastProfit = data[data.length - 1]?.profit || 0;
  const previousProfit = data[data.length - 2]?.profit || 0;
  const profitChange = lastProfit - previousProfit;

  const customTooltipFormatter = (value: number) => [
    <span key="value" style={{ color: color, fontWeight: 600 }}>
      {formatters.percentage(value)}
    </span>, 
    <span key="label" style={{ color: '#374151', fontWeight: 500 }}>
      Voittomarginaali
    </span>
  ];

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Keskiarvo</div>
          <div className="text-xl font-bold" style={{ color: MASTER_COLORS.primary[0] }}>
            {formatters.percentage(avgProfit)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Maksimi</div>
          <div className="text-xl font-bold" style={{ color: MASTER_COLORS.primary[1] }}>
            {formatters.percentage(maxProfit)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Minimi</div>
          <div className="text-xl font-bold" style={{ color: MASTER_COLORS.primary[2] }}>
            {formatters.percentage(minProfit)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Muutos</div>
          <div className={`text-xl font-bold ${
            profitChange > 0 ? 'text-green-600' : profitChange < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {profitChange > 0 ? '+' : ''}{formatters.percentage(profitChange)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          📊 Voittomarginaalin kehitys
        </h4>
        
        <MasterChartWrapper height={240}>
          <AreaChart data={data}>
            <MasterGradientDefs />
            <MasterGrid />
            <MasterXAxis dataKey="month" />
            <MasterYAxis 
              tickFormatter={(value) => formatters.percentage(value)}
              width={50}
            />
            <MasterTooltip
              formatter={customTooltipFormatter}
              colors={[color]}
            />
            <Area 
              type="monotone"
              dataKey="profit"
              stroke={color}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#gradient-gold)`}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#fff' }}
            />
          </AreaChart>
        </MasterChartWrapper>
      </div>

      {/* Insights */}
      <MasterInsight
        icon="💹"
        title="Voittomarginaalin analyysi"
        description={`${data.length} kuukauden data. Keskimääräinen voittomarginaali on ${formatters.percentage(avgProfit)}. ${
          avgProfit > 20 ? 'Erinomainen kannattavuus!' :
          avgProfit > 10 ? 'Hyvä kannattavuus.' :
          avgProfit > 5 ? 'Kohtuullinen kannattavuus.' :
          avgProfit > 0 ? 'Matala kannattavuus - optimointi suositeltavaa.' :
          'Negatiivinen kannattavuus - toimenpiteet tarvitaan.'
        } Vaihteluväli: ${formatters.percentage(minProfit)} - ${formatters.percentage(maxProfit)}.`}
        color={avgProfit > 20 ? 'green' : avgProfit > 10 ? 'blue' : avgProfit > 0 ? 'yellow' : 'red'}
      />
    </div>
  );
};

export default ProfitMarginChart; 