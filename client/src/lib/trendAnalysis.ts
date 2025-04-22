/**
 * Perform linear regression on an array of rates
 * @param rates Array of exchange rates
 * @returns Slope and intercept of the linear regression
 */
export function linearRegression(rates: number[]): { slope: number; intercept: number } {
  const x = Array.from({ length: rates.length }, (_, i) => i);
  const n = rates.length;
  
  // Calculate sums for the linear regression formula
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = rates.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * rates[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  
  // Calculate slope and intercept
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

/**
 * Generate forecast data based on historical rates
 * @param rates Array of historical exchange rates
 * @param days Number of days to forecast
 * @returns Array of forecasted rates
 */
export function generateForecast(rates: number[], days: number): number[] {
  const { slope, intercept } = linearRegression(rates);
  const lastX = rates.length - 1;
  
  return Array.from({ length: days }, (_, i) => {
    const x = lastX + i + 1;
    const predictedValue = slope * x + intercept;
    // Add small random noise for more realistic forecasting
    const noise = (Math.random() - 0.5) * 0.002;
    return predictedValue + noise;
  });
}

/**
 * Calculate statistics from an array of rates
 * @param rates Array of exchange rates
 * @returns Statistics object with average, min, max, and volatility
 */
export function calculateStatistics(rates: number[]): {
  average: number;
  min: number;
  max: number;
  volatility: number;
} {
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  const volatility = ((max - min) / average) * 100;
  
  return {
    average,
    min,
    max,
    volatility,
  };
}

/**
 * Calculate the confidence level of a forecast
 * @param rates Array of historical exchange rates
 * @returns Confidence percentage (0-100)
 */
export function calculateConfidence(rates: number[]): number {
  // Calculate R-squared coefficient
  const { slope, intercept } = linearRegression(rates);
  const x = Array.from({ length: rates.length }, (_, i) => i);
  
  // Calculate predictions
  const predictions = x.map(x => slope * x + intercept);
  
  // Calculate means
  const yMean = rates.reduce((sum, y) => sum + y, 0) / rates.length;
  
  // Calculate sums of squares
  const ssTotal = rates.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const ssResidual = rates.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0);
  
  // Calculate R-squared
  const rSquared = 1 - (ssResidual / ssTotal);
  
  // Convert R-squared to confidence percentage, limiting between 50% and 95%
  return Math.min(95, Math.max(50, rSquared * 100));
}

/**
 * Analyze trend direction and strength
 * @param rates Array of historical exchange rates
 * @returns Object with trend information
 */
export function analyzeTrend(rates: number[]): {
  direction: 'up' | 'down' | 'stable';
  percentChange: number;
} {
  const { slope } = linearRegression(rates);
  const firstRate = rates[0];
  const lastRate = rates[rates.length - 1];
  const percentChange = ((lastRate - firstRate) / firstRate) * 100;
  
  // Determine direction based on slope
  let direction: 'up' | 'down' | 'stable';
  if (slope > 0.0001) {
    direction = 'up';
  } else if (slope < -0.0001) {
    direction = 'down';
  } else {
    direction = 'stable';
  }
  
  return {
    direction,
    percentChange
  };
}
