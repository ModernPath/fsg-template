import React, { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { 
  MasterChartWrapper, 
  MasterGrid, 
  MasterXAxis, 
  MasterYAxis, 
  MasterTooltip,
  MasterEmptyState,
  MasterInsight,
  MASTER_COLORS,
  formatters
} from './MasterChartStyle';

interface QuestionAnalyticsChartProps {
  question: {
    question_id: string;
    question_text: string;
    question_type: string;
    response_count: number;
    response_rate: number;
    rating_analysis?: {
      average: number;
      distribution: Record<number, number>;
    };
    text_analysis?: {
      total_responses: number;
      average_word_count: number;
      common_themes: { word: string; count: number }[];
      sample_responses: string[];
    };
    value_distribution?: Record<string, number>;
  };
}

const QuestionAnalyticsChart = ({ question }: QuestionAnalyticsChartProps) => {
  const [showAllResponses, setShowAllResponses] = useState(false);

  // Check if we have any analysis data
  const hasRatingAnalysis = question.rating_analysis;
  const hasTextAnalysis = question.text_analysis;
  const hasValueDistribution = question.value_distribution;

  if (!hasRatingAnalysis && !hasTextAnalysis && !hasValueDistribution) {
    return (
      <MasterEmptyState
        icon="📊"
        title="Ei analyysitietoja saatavilla"
        description="Tähän kysymykseen ei ole vielä vastattu tai analyysi ei ole käytettävissä"
      />
    );
  }

  // Render text analysis for textarea/text questions
  const renderTextAnalysis = () => {
    if (!hasTextAnalysis) return null;

    const { text_analysis } = question;
    const displayedResponses = showAllResponses 
      ? text_analysis.sample_responses 
      : text_analysis.sample_responses.slice(0, 5);

    return (
      <div className="space-y-6">
        {/* Text Analysis Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Vastauksia</div>
            <div className="text-2xl font-bold" style={{ color: MASTER_COLORS.primary[0] }}>
              {text_analysis.total_responses}
            </div>
            <div className="text-xs text-muted-foreground">kpl</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Keskimääräinen pituus</div>
            <div className="text-2xl font-bold" style={{ color: MASTER_COLORS.primary[1] }}>
              {text_analysis.average_word_count.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">sanaa</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Vastausaste</div>
            <div className="text-2xl font-bold" style={{ color: MASTER_COLORS.primary[2] }}>
              {question.response_rate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">osallistujista</div>
          </div>
        </div>

        {/* Common Themes */}
        {text_analysis.common_themes && text_analysis.common_themes.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              🏷️ Yleisimmät teemat
            </h5>
            <div className="flex flex-wrap gap-2">
              {text_analysis.common_themes.slice(0, 10).map((theme, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {theme.word} ({theme.count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sample Responses */}
        {text_analysis.sample_responses && text_analysis.sample_responses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Vastaukset ({displayedResponses.length}/{text_analysis.sample_responses.length})
              </h5>
              {text_analysis.sample_responses.length > 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllResponses(!showAllResponses)}
                  className="text-xs"
                >
                  {showAllResponses ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Näytä vähemmän
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Näytä lisää ({text_analysis.sample_responses.length - 5})
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {displayedResponses.map((response, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    "{response}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insight */}
        <MasterInsight
          icon="💬"
          title="Tekstianalyysi"
          description={`${text_analysis.total_responses} vastausta keskimäärin ${text_analysis.average_word_count.toFixed(1)} sanaa pitkiä. ${
            question.response_rate > 70 ? 'Korkea vastausaste osoittaa kysymyksen olevan relevantti.' :
            question.response_rate > 50 ? 'Kohtuullinen vastausaste.' :
            'Matala vastausaste - harkitse kysymyksen muotoilua.'
          }`}
          color="blue"
        />
      </div>
    );
  };

  // Render value distribution for checkbox/radio questions
  const renderValueDistribution = () => {
    if (!hasValueDistribution) return null;

    const distributionData = Object.entries(question.value_distribution)
      .map(([value, count]) => ({
        value,
        count,
        percentage: question.response_count > 0 ? (count / question.response_count * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count);

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Vastauksia</div>
            <div className="text-2xl font-bold" style={{ color: MASTER_COLORS.primary[0] }}>
              {question.response_count}
            </div>
            <div className="text-xs text-muted-foreground">kpl</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Vaihtoehtoja</div>
            <div className="text-2xl font-bold" style={{ color: MASTER_COLORS.primary[1] }}>
              {distributionData.length}
            </div>
            <div className="text-xs text-muted-foreground">valittua</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Vastausaste</div>
            <div className="text-2xl font-bold" style={{ color: MASTER_COLORS.primary[2] }}>
              {question.response_rate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">osallistujista</div>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            📊 Vastausten jakautuminen
          </h5>
          <div className="space-y-2">
            {distributionData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.value}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: MASTER_COLORS.primary[index % MASTER_COLORS.primary.length]
                      }}
                    />
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-lg font-bold" style={{ color: MASTER_COLORS.primary[index % MASTER_COLORS.primary.length] }}>
                    {item.count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insight */}
        <MasterInsight
          icon="📈"
          title="Vastausanalyysi"
          description={`Suosituin valinta "${distributionData[0]?.value}" sai ${distributionData[0]?.count} vastausta (${distributionData[0]?.percentage}%). ${
            question.response_rate > 70 ? 'Korkea vastausaste lisää tulosten luotettavuutta.' :
            question.response_rate > 50 ? 'Kohtuullinen vastausaste.' :
            'Matala vastausaste - tulokset voivat olla vääristyneitä.'
          }`}
          color="blue"
        />
      </div>
    );
  };

  // If we have rating analysis, render the existing chart
  if (hasRatingAnalysis) {
    const { rating_analysis } = question;
    
    // Prepare data for bar chart
    const barData = Object.entries(rating_analysis.distribution)
    .map(([rating, count]) => ({
      rating: `${rating}`,
      count: count,
      percentage: question.response_count > 0 ? (count / question.response_count * 100).toFixed(1) : 0
    }))
    .sort((a, b) => parseInt(a.rating) - parseInt(b.rating));

  // Prepare data for pie chart (only show non-zero values)
  const pieData = barData
    .filter(item => item.count > 0)
    .map((item, index) => ({
      name: `Arvosana ${item.rating}`,
      value: item.count,
      percentage: item.percentage,
      color: MASTER_COLORS.primary[index % MASTER_COLORS.primary.length]
    }));

  const customBarTooltipFormatter = (value: any, name: string, props: any) => [
    <span key="value" style={{ color: MASTER_COLORS.primary[props.dataKey % MASTER_COLORS.primary.length], fontWeight: 600 }}>
      {value} vastausta ({props.payload.percentage}%)
    </span>, 
    <span key="label" style={{ color: '#374151', fontWeight: 500 }}>
      Arvosana {props.payload.rating}
    </span>
  ];

  const customPieTooltipFormatter = (value: any, name: string, props: any) => [
    <span key="value" style={{ color: props.payload.color, fontWeight: 600 }}>
      {value} vastausta
    </span>, 
    <span key="label" style={{ color: '#374151', fontWeight: 500 }}>
      {name}
    </span>
  ];

  const renderBarChart = () => (
    <MasterChartWrapper height={200}>
      <BarChart data={barData}>
        <MasterGrid />
        <MasterXAxis dataKey="rating" />
        <MasterYAxis width={30} />
        <MasterTooltip
          formatter={customBarTooltipFormatter}
          colors={MASTER_COLORS.primary}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
          {barData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={MASTER_COLORS.primary[index % MASTER_COLORS.primary.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </MasterChartWrapper>
  );

  const renderPieChart = () => (
    <MasterChartWrapper height={200}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          strokeWidth={2}
          stroke="#fff"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <MasterTooltip
          formatter={customPieTooltipFormatter}
          colors={MASTER_COLORS.primary}
        />
      </PieChart>
    </MasterChartWrapper>
  );

  // Get rating quality assessment
  const getRatingQuality = () => {
    const avg = rating_analysis.average;
    if (avg >= 4.5) return { text: 'Erinomainen', color: 'green' as const };
    if (avg >= 3.5) return { text: 'Hyvä', color: 'blue' as const };
    if (avg >= 2.5) return { text: 'Keskitasoinen', color: 'yellow' as const };
    return { text: 'Parannettavaa', color: 'red' as const };
  };

  const quality = getRatingQuality();

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Keskiarvo</div>
          <div className="text-2xl font-bold" style={{ color: MASTER_COLORS.primary[0] }}>
            {rating_analysis.average.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">/ 5.0</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Vastauksia</div>
          <div className="text-2xl font-bold" style={{ color: MASTER_COLORS.primary[1] }}>
            {question.response_count}
          </div>
          <div className="text-xs text-muted-foreground">kpl</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Vastausaste</div>
          <div className="text-2xl font-bold" style={{ color: MASTER_COLORS.primary[2] }}>
            {question.response_rate.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">osallistujista</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Arvio</div>
          <div className={`text-lg font-bold ${
            quality.color === 'green' ? 'text-green-600' :
            quality.color === 'blue' ? 'text-blue-600' :
            quality.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {quality.text}
          </div>
          <div className="text-xs text-muted-foreground">laatu</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            📊 Vastausten jakautuminen
          </h5>
          {renderBarChart()}
        </div>
        
        {pieData.length > 1 && (
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              🥧 Osuudet
            </h5>
            {renderPieChart()}
            
            {/* Enhanced Legend */}
            <div className="grid grid-cols-1 gap-2 text-sm">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.name}</span>
                  </div>
                  <div className="font-medium">
                    {entry.value} ({entry.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Insight */}
      <MasterInsight
        icon="💡"
        title="Kysymyksen analyysi"
        description={`Keskiarvo ${rating_analysis.average.toFixed(1)} kertoo ${quality.text.toLowerCase()} tuloksesta. ${
          question.response_rate > 70 ? 'Korkea vastausaste lisää tulosten luotettavuutta.' :
          question.response_rate > 50 ? 'Kohtuullinen vastausaste.' :
          'Matala vastausaste - tulokset voivat olla vääristyneitä.'
        }`}
        color={quality.color}
      />
    </div>
  );
  }

  // If we have text analysis, render text analysis
  if (hasTextAnalysis) {
    return renderTextAnalysis();
  }

  // If we have value distribution, render value distribution
  if (hasValueDistribution) {
    return renderValueDistribution();
  }

  // Fallback (should not reach here due to earlier check)
  return (
    <MasterEmptyState
      icon="📊"
      title="Ei analyysitietoja saatavilla"
      description="Tähän kysymykseen ei ole vielä vastattu tai analyysi ei ole käytettävissä"
    />
  );
};

export default QuestionAnalyticsChart;
