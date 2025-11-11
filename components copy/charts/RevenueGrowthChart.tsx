import React from 'react';
import { BarChart, Bar, Cell } from 'recharts';
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

interface RevenueGrowthChartProps {
  data: {
    month: string;
    revenue: number;
  }[];
  colors?: string[];
}

const RevenueGrowthChart = ({ data, colors = MASTER_COLORS.primary }: RevenueGrowthChartProps) => {
  if (!data || data.length === 0) {
    return (
      <MasterEmptyState
        icon="📈"
        title="Ei liikevaihtodataa saatavilla"
        description="Liikevaihdon kehitys näkyy täällä kun dataa on saatavilla"
      />
    );
  }

  // Calculate growth metrics
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const avgRevenue = totalRevenue / data.length;
  const lastMonth = data[data.length - 1]?.revenue || 0;
  const previousMonth = data[data.length - 2]?.revenue || 0;
  const growthRate = previousMonth > 0 ? ((lastMonth - previousMonth) / previousMonth) * 100 : 0;

  const customTooltipFormatter = (value: number) => [
    <span key="value" style={{ color: MASTER_COLORS.primary[0], fontWeight: 600 }}>
      {formatters.currency(value)}
    </span>, 
    <span key="label" style={{ color: '#374151', fontWeight: 500 }}>
      Liikevaihto
    </span>
  ];

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Kokonaisliikevaihto</div>
          <div className="text-xl font-bold" style={{ color: MASTER_COLORS.primary[0] }}>
            {formatters.currency(totalRevenue)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Keskiarvo/kk</div>
          <div className="text-xl font-bold" style={{ color: MASTER_COLORS.primary[1] }}>
            {formatters.currency(avgRevenue)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Viimeisin kuukausi</div>
          <div className="text-xl font-bold" style={{ color: MASTER_COLORS.primary[2] }}>
            {formatters.currency(lastMonth)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Kasvu</div>
          <div className={`text-xl font-bold ${
            growthRate > 0 ? 'text-green-600' : growthRate < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          📊 Liikevaihdon kehitys
        </h4>
        
        <MasterChartWrapper height={240}>
          <BarChart data={data}>
            <MasterGradientDefs />
            <MasterGrid />
            <MasterXAxis dataKey="month" />
            <MasterYAxis 
              tickFormatter={(value) => formatters.currency(value)}
              width={80}
            />
            <MasterTooltip
              formatter={customTooltipFormatter}
              colors={colors}
            />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </MasterChartWrapper>
      </div>

      {/* Insights */}
      <MasterInsight
        icon="💰"
        title="Liikevaihdon analyysi"
        description={`${data.length} kuukauden data. ${
          growthRate > 10 ? 'Vahva kasvu - erinomainen kehitys!' :
          growthRate > 0 ? 'Positiivinen kasvu - hyvä suunta.' :
          growthRate === 0 ? 'Vakaa liikevaihto - ei merkittävää muutosta.' :
          'Laskeva trendi - kannattaa analysoida syitä.'
        } Keskimääräinen kuukausittainen liikevaihto on ${formatters.currency(avgRevenue)}.`}
        color={growthRate > 10 ? 'green' : growthRate > 0 ? 'blue' : growthRate === 0 ? 'yellow' : 'red'}
      />
    </div>
  );
};

export default RevenueGrowthChart; 