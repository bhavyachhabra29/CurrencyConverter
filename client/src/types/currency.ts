export interface CurrencyPair {
  from: string;
  to: string;
}

export interface Currency {
  code: string;
  name: string;
}

export interface ExchangeRate {
  rate: number;
  date: string;
}

export interface ConversionResult {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  result: number;
  date: Date;
}

export interface ForecastResult {
  date: string;
  rate: number;
}

export interface ForecastAnalysis {
  percentChange: number;
  direction: 'up' | 'down' | 'stable';
  confidence: number;
  expectedHigh: number;
  expectedLow: number;
}
