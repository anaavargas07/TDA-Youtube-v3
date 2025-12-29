

import React, { useState, useMemo } from 'react';
import { DailyMetric } from '../types';
import { formatNumber } from '../utils/helpers';
import { generateForecast, calculateTrendAnalysis, TrendAnalysis, ForecastPoint } from '../utils/analytics';

interface GrowthChartProps {
    history: DailyMetric[];
}

type ChartMetric = 'subscriberCount' | 'viewCount' | 'videoCount';
type ChartView = 'trend' | 'analysis';
type TimeRange = '1h' | '12h' | '24h' | 7 | 30 | 90 | 365 | 'all';

// A small info icon for tooltips
const InfoIcon = ({ tooltip }: { tooltip: string }) => (
    <div className="relative inline-flex items-center ml-1 group">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="absolute bottom-full left-1/2 z-20 w-64 p-2 mb-2 -translate-x-1/2 text-xs text-white bg-gray-900 border border-gray-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {tooltip}
        </div>
    </div>
);

const StatCard: React.FC<{ title: string; value: string; delta?: string; tooltip: string, deltaColor?: string }> = ({ title, value, delta, tooltip, deltaColor = 'text-green-400' }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg">
        <h3 className="text-sm text-gray-400 flex items-center">{title} <InfoIcon tooltip={tooltip} /></h3>
        <p className="text-2xl font-bold text-white">{value}</p>
        {delta && <p className={`text-sm font-semibold ${deltaColor}`}>{delta}</p>}
    </div>
);

export const GrowthChart: React.FC<GrowthChartProps> = ({ history }) => {
    const [metric, setMetric] = useState<ChartMetric>('subscriberCount');
    const [view, setView] = useState<ChartView>('trend');
    const [timeRange, setTimeRange] = useState<TimeRange>('24h');
    const [showForecast, setShowForecast] = useState(false);

    const filteredHistory = useMemo(() => {
        const now = Date.now();
        if (timeRange === 'all') return history;

        if (typeof timeRange === 'string') {
            let hours;
            if (timeRange === '1h') hours = 1;
            else if (timeRange === '12h') hours = 12;
            else hours = 24; // '24h'
            const startTime = now - hours * 60 * 60 * 1000;
            return history.filter(h => h.timestamp >= startTime);
        }
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);
        return history.filter(h => h.timestamp >= startDate.getTime());

    }, [history, timeRange]);

    const analysisData = useMemo<TrendAnalysis | null>(() => {
        if (!filteredHistory || filteredHistory.length < 2 || metric === 'videoCount') return null;
        return calculateTrendAnalysis(filteredHistory, metric);
    }, [filteredHistory, metric]);

    const forecastData = useMemo<ForecastPoint[] | null>(() => {
        if (!showForecast || !filteredHistory || filteredHistory.length < 2 || metric === 'videoCount') return null;
        return generateForecast(filteredHistory, metric, 30);
    }, [filteredHistory, metric, showForecast]);

    const chartData = useMemo(() => {
        if (!filteredHistory || filteredHistory.length < 2) return null;

        const data = filteredHistory.map(item => ({
            date: new Date(item.timestamp),
            value: parseInt(item[metric], 10)
        })).sort((a, b) => a.date.getTime() - b.date.getTime());

        const combinedData = [...data];
        if (forecastData) {
            combinedData.push(...forecastData.map(f => ({ date: f.date, value: f.value })));
        }

        const values = combinedData.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        const dates = combinedData.map(d => d.date);
        const startTime = dates[0].getTime();
        const endTime = dates[dates.length - 1].getTime();
        if (endTime === startTime) return null; // Avoid division by zero

        const width = 800;
        const height = 400;
        const padding = 50;

        const formatLabel = (date: Date) => {
            if (typeof timeRange === 'string') {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return date.toLocaleDateString();
        };

        const points = data.map(d => {
            const x = ((d.date.getTime() - startTime) / (endTime - startTime)) * (width - padding * 2) + padding;
            const y = height - (((d.value - min) / (max - min || 1)) * (height - padding * 2) + padding);
            return { x, y, value: d.value, date: formatLabel(d.date) };
        });
        
        const forecastPoints = forecastData ? forecastData.map(d => {
             const x = ((d.date.getTime() - startTime) / (endTime - startTime)) * (width - padding * 2) + padding;
            const y = height - (((d.value - min) / (max - min || 1)) * (height - padding * 2) + padding);
            return { x, y, value: d.value, date: formatLabel(d.date) };
        }) : [];

        const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');
        const forecastPath = [points[points.length - 1], ...forecastPoints]
            .map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

        return { width, height, padding, min, max, points, path, forecastPoints, forecastPath, startTime, endTime };
    }, [filteredHistory, metric, forecastData, timeRange]);
    
    const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        setTimeRange(['1h', '12h', '24h', 'all'].includes(value) ? value as TimeRange : parseInt(value, 10) as TimeRange);
    };

    const renderAnalysisView = () => {
        if (!analysisData) {
             return <p className="text-gray-400 text-center py-10">Analysis is not available for Video Count or for periods with insufficient data.</p>;
        }

        const forecast30 = forecastData?.[29];
        const metricName = metric === 'subscriberCount' ? 'subscribers' : 'views';
        
        const worstDayColor = analysisData.worstDay.growth < 0 ? 'text-red-400' : 'text-gray-400';

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <StatCard 
                    title="Avg. Weekly Growth"
                    value={`${analysisData.weeklyGrowthRate}%`}
                    tooltip={`The average week-over-week percentage growth for ${metricName} in the selected period.`}
                />
                <StatCard 
                    title="Net Growth (Last 30 Days)"
                    value={formatNumber(analysisData.monthlyGrowth)}
                    tooltip={`The net change in ${metricName} over the last 30 days of the selected period.`}
                />
                {forecast30 && (
                     <StatCard 
                        title="30-Day Forecast"
                        value={formatNumber(forecast30.value)}
                        tooltip={`Projected ${metricName} count in 30 days based on the current trend.`}
                     />
                )}
                 <StatCard 
                    title="Best Day"
                    value={`+${formatNumber(analysisData.bestDay.growth)}`}
                    delta={new Date(analysisData.bestDay.date).toLocaleDateString()}
                    tooltip={`The single day with the largest increase in ${metricName}.`}
                />
                 <StatCard 
                    title="Worst Day"
                    value={formatNumber(analysisData.worstDay.growth)}
                    delta={new Date(analysisData.worstDay.date).toLocaleDateString()}
                    deltaColor={worstDayColor}
                    tooltip={`The single day with the smallest (or most negative) increase in ${metricName}.`}
                />
            </div>
        );
    };

    const renderTrendView = () => {
        if (!chartData) {
            return (
                 <div className="text-center py-10">
                    <p className="text-gray-400">Not enough historical data to display a chart for this period.</p>
                </div>
            );
        }
        const { width, height, padding, min, max, points, path, forecastPath, forecastPoints } = chartData;
        return (
            <div className="w-full overflow-x-auto">
                 <svg viewBox={`0 0 ${width} ${height}`} className="font-sans">
                    {/* Y Axis Labels */}
                    <text x={padding - 10} y={padding + 5} textAnchor="end" fill="#9ca3af" fontSize="12">{formatNumber(max)}</text>
                    <text x={padding - 10} y={height - padding} textAnchor="end" fill="#9ca3af" fontSize="12">{formatNumber(min)}</text>
                    <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4b5563" strokeWidth="1" />

                    {/* X Axis Labels */}
                     <text x={padding} y={height - padding + 20} textAnchor="start" fill="#9ca3af" fontSize="12">{points[0].date}</text>
                     <text x={width - padding} y={height - padding + 20} textAnchor="end" fill="#9ca3af" fontSize="12">{points[points.length - 1].date}</text>
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4b5563" strokeWidth="1" />

                    {/* Chart Path */}
                    <path d={path} fill="none" stroke="#4f46e5" strokeWidth="2" />
                    {showForecast && forecastPath && (
                         <path d={forecastPath} fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="5,5" />
                    )}
                    
                    {/* Data Points and Tooltips */}
                    {points.map((point, i) => (
                        <g key={`p-${i}`} className="group">
                             <circle cx={point.x} cy={point.y} r="4" fill="#4f46e5" className="cursor-pointer" />
                             <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <rect x={point.x - 50} y={point.y - 45} width="100" height="35" rx="5" fill="#1f2937" stroke="#4f46e5" />
                                <text x={point.x} y={point.y - 30} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{formatNumber(point.value)}</text>
                                <text x={point.x} y={point.y - 15} textAnchor="middle" fill="#9ca3af" fontSize="10">{point.date}</text>
                            </g>
                        </g>
                    ))}
                    {forecastPoints.map((point, i) => (
                         <g key={`f-${i}`} className="group">
                             <circle cx={point.x} cy={point.y} r="4" fill="#818cf8" className="cursor-pointer" />
                             <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <rect x={point.x - 50} y={point.y - 45} width="100" height="35" rx="5" fill="#1f2937" stroke="#818cf8" />
                                <text x={point.x} y={point.y - 30} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{formatNumber(point.value)}</text>
                                <text x={point.x} y={point.y - 15} textAnchor="middle" fill="#9ca3af" fontSize="10">{point.date}</text>
                            </g>
                        </g>
                    ))}
                </svg>
            </div>
        )
    };
    
    return (
        <div className="bg-gray-800/50 rounded-lg p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-white">Advanced Analysis & Forecasting</h2>
                {/* Metric Select */}
                <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-lg">
                     <button 
                        onClick={() => setMetric('subscriberCount')}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${metric === 'subscriberCount' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        Subscribers
                    </button>
                    <button 
                        onClick={() => setMetric('viewCount')}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${metric === 'viewCount' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        Views
                    </button>
                    <button 
                        onClick={() => setMetric('videoCount')}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${metric === 'videoCount' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        Videos
                    </button>
                </div>
            </div>

             {/* Controls */}
             <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-3 bg-gray-900/30 rounded-lg border border-gray-700/50 mb-6">
                {/* View Toggles */}
                <div className="flex items-center gap-2 bg-gray-700/50 p-1 rounded-lg">
                    <button onClick={() => setView('trend')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'trend' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}>Growth Trend</button>
                    <button onClick={() => setView('analysis')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'analysis' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}>Performance Analysis</button>
                </div>

                 {/* Time Range */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Range:</span>
                     <select value={timeRange} onChange={handleTimeRangeChange} className="bg-gray-700 border-gray-600 rounded-md text-sm p-2">
                        <option value="1h">Last Hour</option>
                        <option value="12h">Last 12 Hours</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                        <option value="365">Last Year</option>
                        <option value="all">All Time</option>
                    </select>
                </div>

                {/* Forecast Toggle */}
                {view === 'trend' && metric !== 'videoCount' && (
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={showForecast} onChange={e => setShowForecast(e.target.checked)} className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-indigo-600 focus:ring-indigo-500"/>
                        <span className="text-sm text-gray-300">Show 30-Day Forecast</span>
                    </label>
                )}
            </div>

            {view === 'trend' ? renderTrendView() : renderAnalysisView()}
        </div>
    );
};