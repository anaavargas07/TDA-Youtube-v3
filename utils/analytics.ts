
import { DailyMetric } from '../types';

export interface TrendAnalysis {
    weeklyGrowthRate: number; // percentage
    monthlyGrowth: number;
    bestDay: { date: string; growth: number };
    worstDay: { date: string; growth: number };
}

export interface ForecastPoint {
    date: Date;
    value: number;
}

// Simple linear regression to find slope (m) and intercept (b) of y = mx + b
const linearRegression = (data: { x: number; y: number }[]): { m: number; b: number } => {
    const n = data.length;
    if (n < 2) return { m: 0, b: data[0]?.y || 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (const point of data) {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumXX += point.x * point.x;
    }

    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    return { m: isNaN(m) ? 0 : m, b: isNaN(b) ? data[data.length - 1].y : b };
};

export const generateForecast = (
    history: DailyMetric[],
    metric: 'subscriberCount' | 'viewCount',
    daysToForecast: number
): ForecastPoint[] => {
    if (history.length < 2) return [];

    const data = history.map((item, index) => ({
        x: index,
        y: parseInt(item[metric], 10)
    }));
    
    const { m, b } = linearRegression(data);

    const forecast: ForecastPoint[] = [];
    const lastDate = new Date(history[history.length - 1].date);
    const lastIndex = history.length - 1;

    for (let i = 1; i <= daysToForecast; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + i);
        
        const predictedValue = m * (lastIndex + i) + b;
        
        forecast.push({
            date: nextDate,
            value: Math.max(0, Math.round(predictedValue)) // Value can't be negative
        });
    }

    return forecast;
};

export const calculateTrendAnalysis = (
    history: DailyMetric[],
    metric: 'subscriberCount' | 'viewCount'
): TrendAnalysis => {
    if (history.length < 2) {
        return { weeklyGrowthRate: 0, monthlyGrowth: 0, bestDay: { date: '', growth: 0 }, worstDay: { date: '', growth: 0 } };
    }

    const dailyChanges = history.slice(1).map((item, index) => {
        const prevItem = history[index];
        const growth = parseInt(item[metric], 10) - parseInt(prevItem[metric], 10);
        return { date: item.date, growth };
    });

    if (dailyChanges.length === 0) {
        return { weeklyGrowthRate: 0, monthlyGrowth: 0, bestDay: { date: '', growth: 0 }, worstDay: { date: '', growth: 0 } };
    }
    
    // Growth rates
    let totalWeeklyGrowth = 0;
    let weeks = 0;
    for (let i = 7; i < history.length; i++) {
        const current = parseInt(history[i][metric], 10);
        const previous = parseInt(history[i - 7][metric], 10);
        if (previous > 0) {
            totalWeeklyGrowth += (current - previous) / previous;
            weeks++;
        }
    }
    const weeklyGrowthRate = weeks > 0 ? (totalWeeklyGrowth / weeks) * 100 : 0;
    
    const last30DaysHistory = history.slice(-30);
    const monthlyGrowth = last30DaysHistory.length > 1 
      ? parseInt(last30DaysHistory[last30DaysHistory.length - 1][metric], 10) - parseInt(last30DaysHistory[0][metric], 10)
      : 0;
    
    const bestDay = dailyChanges.reduce((max, current) => current.growth > max.growth ? current : max, dailyChanges[0]);
    const worstDay = dailyChanges.reduce((min, current) => current.growth < min.growth ? current : min, dailyChanges[0]);

    return {
        weeklyGrowthRate: parseFloat(weeklyGrowthRate.toFixed(2)),
        monthlyGrowth,
        bestDay,
        worstDay,
    };
};
