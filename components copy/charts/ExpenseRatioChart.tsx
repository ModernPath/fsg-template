import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { 
  MasterChartWrapper, 
  MasterTooltip,
  MasterEmptyState,
  MasterInsight,
  MASTER_COLORS,
  formatters
} from './MasterChartStyle';

interface ExpenseRatioData {
  name: string;
  value: number;
  color?: string;
}

interface ExpenseRatioChartProps {
  data: ExpenseRatioData[];
  mainColor?: string;
}

const ExpenseRatioChart = ({ data, mainColor = MASTER_COLORS.primary[0] }: ExpenseRatioChartProps) => {
  if (!data || data.length === 0) {
    return (
      <MasterEmptyState
        icon="🥧"
        title="Ei kulurakennedataa saatavilla"
        description="Kulujen jakautuminen näkyy täällä kun dataa on saatavilla"
      />
    );
  }

  // Assign colors from master palette if not provided
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || MASTER_COLORS.primary[index % MASTER_COLORS.primary.length]
  }));

  // Sort data by value in descending order
  const sortedData = [...dataWithColors].sort((a, b) => b.value - a.value);
  
  // Main portion and other portions
  const mainPortion = sortedData[0];
  const otherPortions = sortedData.slice(1);
  const totalValue = sortedData.reduce((sum, item) => sum + item.value, 0);

  const customTooltipFormatter = (value: number, name: string) => [
    <span key="value" style={{ color: MASTER_COLORS.primary[0], fontWeight: 600 }}>
      {formatters.percentage(value)}
    </span>, 
    <span key="label" style={{ color: '#374151', fontWeight: 500 }}>
      {name}
    </span>
  ];

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Suurin kuluerä</div>
          <div className="text-lg font-bold" style={{ color: mainPortion.color }}>
            {mainPortion.name}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatters.percentage(mainPortion.value)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Kuluerät yhteensä</div>
          <div className="text-lg font-bold" style={{ color: MASTER_COLORS.primary[1] }}>
            {sortedData.length}
          </div>
          <div className="text-sm text-muted-foreground">kategoriaa</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Kokonaisosuus</div>
          <div className="text-lg font-bold" style={{ color: MASTER_COLORS.primary[2] }}>
            {formatters.percentage(totalValue)}
          </div>
          <div className="text-sm text-muted-foreground">kaikista kuluista</div>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          🥧 Kulujen jakautuminen
        </h4>
        
        <div className="relative">
          <MasterChartWrapper height={240}>
            <PieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                innerRadius={60}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
              >
                {sortedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <MasterTooltip
                formatter={customTooltipFormatter}
                colors={sortedData.map(d => d.color)}
              />
            </PieChart>
          </MasterChartWrapper>
          
          {/* Center value display */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold" style={{ color: mainPortion.color }}>
                {formatters.percentage(mainPortion.value)}
              </div>
              <div className="text-sm text-muted-foreground font-medium mt-1">
                {mainPortion.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Yksityiskohtainen erittely
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  style={{ backgroundColor: item.color }} 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                />
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              <div className="font-bold" style={{ color: item.color }}>
                {formatters.percentage(item.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <MasterInsight
        icon="💰"
        title="Kulurakenne-analyysi"
        description={`Suurin kuluerä "${mainPortion.name}" muodostaa ${formatters.percentage(mainPortion.value)} kokonaiskuluista. ${
          mainPortion.value > 50 ? 'Merkittävä keskittyminen yhteen kuluerään - harkitse optimointia.' :
          mainPortion.value > 30 ? 'Kohtuullinen jakautuminen kuluissa.' :
          'Tasainen kulurakenne eri kategorioiden kesken.'
        } Kuluja seurataan ${sortedData.length} eri kategoriassa.`}
        color={mainPortion.value > 50 ? 'yellow' : mainPortion.value > 30 ? 'blue' : 'green'}
      />
    </div>
  );
};

export default ExpenseRatioChart; 