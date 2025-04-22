import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversionSchema, insertExchangeRateSchema } from "@shared/schema";
import fetch from "node-fetch";
import { z } from "zod";

const API_KEY = process.env.EXCHANGERATE_API_KEY || "DEMO_API_KEY";
const BASE_URL = "https://v6.exchangerate-api.com/v6";

// Linear regression for trend analysis
function linearRegression(y: number[]): { slope: number; intercept: number } {
  const x = Array.from({ length: y.length }, (_, i) => i);
  const n = y.length;
  
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

// Generate forecast data based on historical rates
function generateForecast(rates: number[], days: number): number[] {
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current exchange rate
  app.get("/api/rate", async (req, res) => {
    try {
      const baseCurrency = (req.query.from as string)?.toUpperCase() || "USD";
      const targetCurrency = (req.query.to as string)?.toUpperCase() || "EUR";
      
      // Hardcoded exchange rates for specific currency pairs
      const exchangeRates: Record<string, Record<string, number>> = {
        "USD": {
          "EUR": 0.92,
          "INR": 83.72,
          "DKK": 6.87,
          "AED": 3.67
        },
        "EUR": {
          "USD": 1.09,
          "INR": 91.00,
          "DKK": 7.47,
          "AED": 4.00
        },
        "INR": {
          "USD": 0.012,
          "EUR": 0.011,
          "DKK": 0.082,
          "AED": 0.044
        },
        "DKK": {
          "USD": 0.146,
          "EUR": 0.134,
          "INR": 12.19,
          "AED": 0.535
        },
        "AED": {
          "USD": 0.272,
          "EUR": 0.25,
          "INR": 22.81,
          "DKK": 1.87
        }
      };
      
      // Default rate if the specific pair is not in our hardcoded data
      let rate = 1.0;
      
      // Get rate from our hardcoded data
      if (baseCurrency !== targetCurrency) {
        if (exchangeRates[baseCurrency] && exchangeRates[baseCurrency][targetCurrency]) {
          rate = exchangeRates[baseCurrency][targetCurrency];
        } else {
          // If we don't have the specific pair, use a default rate
          console.log(`Using default rate for ${baseCurrency}/${targetCurrency}`);
        }
      }
      
      // Save the current rate to our storage
      await storage.saveExchangeRate({
        baseCurrency,
        targetCurrency,
        rate,
        date: new Date()
      });
      
      res.json({
        rate,
        baseCurrency,
        targetCurrency,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Exchange rate API error:", error);
      res.status(500).json({ message: "Failed to fetch exchange rate" });
    }
  });

  // Save conversion
  app.post("/api/conversions", async (req, res) => {
    try {
      const parsedBody = insertConversionSchema.parse(req.body);
      const conversion = await storage.saveConversion(parsedBody);
      res.status(201).json(conversion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid conversion data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save conversion" });
      }
    }
  });

  // Get conversion history
  app.get("/api/conversions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const conversions = await storage.getConversions(limit);
      res.json(conversions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversion history" });
    }
  });

  // Get historical rates
  app.get("/api/historical", async (req, res) => {
    try {
      const baseCurrency = (req.query.from as string)?.toUpperCase() || "USD";
      const targetCurrency = (req.query.to as string)?.toUpperCase() || "EUR";
      const days = parseInt(req.query.days as string) || 30;
      
      // Hardcoded exchange rates for specific currency pairs
      const baseRates: Record<string, Record<string, number>> = {
        "USD": {
          "EUR": 0.92,
          "INR": 83.72,
          "DKK": 6.87,
          "AED": 3.67
        },
        "EUR": {
          "USD": 1.09,
          "INR": 91.00,
          "DKK": 7.47,
          "AED": 4.00
        },
        "INR": {
          "USD": 0.012,
          "EUR": 0.011,
          "DKK": 0.082,
          "AED": 0.044
        },
        "DKK": {
          "USD": 0.146,
          "EUR": 0.134,
          "INR": 12.19,
          "AED": 0.535
        },
        "AED": {
          "USD": 0.272,
          "EUR": 0.25,
          "INR": 22.81,
          "DKK": 1.87
        }
      };
      
      // Default base rate if the specific pair is not in our hardcoded data
      let baseRate = 1.0;
      
      // Get base rate from our hardcoded data
      if (baseCurrency !== targetCurrency) {
        if (baseRates[baseCurrency] && baseRates[baseCurrency][targetCurrency]) {
          baseRate = baseRates[baseCurrency][targetCurrency];
        }
      }
      
      // Generate simulated historical rates with slight variations
      const rates = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Add small random variations to the base rate
        const variation = (Math.random() - 0.5) * 0.02 * baseRate; // +/- 2%
        const rate = baseRate + variation;
        
        // Save to storage
        await storage.saveExchangeRate({
          baseCurrency,
          targetCurrency,
          rate,
          date
        });
        
        rates.push({
          date: date.toISOString(),
          rate
        });
      }
      
      // Calculate statistics
      const rateValues = rates.map(r => r.rate);
      const avg = rateValues.reduce((a, b) => a + b, 0) / rateValues.length;
      const min = Math.min(...rateValues);
      const max = Math.max(...rateValues);
      const volatility = ((max - min) / avg) * 100;
      
      res.json({
        rates,
        statistics: {
          average: avg,
          min,
          max,
          volatility: parseFloat(volatility.toFixed(2))
        }
      });
    } catch (error) {
      console.error("Historical rates API error:", error);
      res.status(500).json({ message: "Failed to fetch historical rates" });
    }
  });

  // Get forecast data
  app.get("/api/forecast", async (req, res) => {
    try {
      const baseCurrency = (req.query.from as string)?.toUpperCase() || "USD";
      const targetCurrency = (req.query.to as string)?.toUpperCase() || "EUR";
      const days = parseInt(req.query.days as string) || 30;
      
      // Hardcoded exchange rates for specific currency pairs
      const baseRates: Record<string, Record<string, number>> = {
        "USD": {
          "EUR": 0.92,
          "INR": 83.72,
          "DKK": 6.87,
          "AED": 3.67
        },
        "EUR": {
          "USD": 1.09,
          "INR": 91.00,
          "DKK": 7.47,
          "AED": 4.00
        },
        "INR": {
          "USD": 0.012,
          "EUR": 0.011,
          "DKK": 0.082,
          "AED": 0.044
        },
        "DKK": {
          "USD": 0.146,
          "EUR": 0.134,
          "INR": 12.19,
          "AED": 0.535
        },
        "AED": {
          "USD": 0.272,
          "EUR": 0.25,
          "INR": 22.81,
          "DKK": 1.87
        }
      };
      
      // Default base rate if the specific pair is not in our hardcoded data
      let baseRate = 1.0;
      
      // Get base rate from our hardcoded data
      if (baseCurrency !== targetCurrency) {
        if (baseRates[baseCurrency] && baseRates[baseCurrency][targetCurrency]) {
          baseRate = baseRates[baseCurrency][targetCurrency];
        }
      }
      
      // Generate simulated historical rates for analysis
      const historicalRates = [];
      for (let i = 0; i < 90; i++) {
        // Add more variation for historical data
        const variation = (Math.random() - 0.5) * 0.06 * baseRate; // +/- 3%
        historicalRates.push(baseRate + variation);
      }
      
      // Generate forecast
      const forecastRates = generateForecast(historicalRates, days);
      
      // Format the response
      const today = new Date();
      const forecast = forecastRates.map((rate, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() + i + 1);
        return {
          date: date.toISOString(),
          rate
        };
      });
      
      // Analyze trend
      const startRate = forecastRates[0];
      const endRate = forecastRates[forecastRates.length - 1];
      const percentChange = ((endRate - startRate) / startRate) * 100;
      
      // Determine direction based on percentChange
      let direction: 'up' | 'down' | 'stable';
      if (percentChange > 0.5) {
        direction = 'up';
      } else if (percentChange < -0.5) {
        direction = 'down';
      } else {
        direction = 'stable';
      }
      
      // Random confidence between 65 and 85 percent
      const confidence = Math.floor(65 + Math.random() * 20);
      
      res.json({
        forecast,
        analysis: {
          percentChange: parseFloat(percentChange.toFixed(2)),
          direction,
          confidence,
          expectedHigh: parseFloat((baseRate * 1.03).toFixed(4)),
          expectedLow: parseFloat((baseRate * 0.97).toFixed(4))
        }
      });
    } catch (error) {
      console.error("Forecast API error:", error);
      res.status(500).json({ message: "Failed to generate forecast" });
    }
  });

  // Get supported currencies
  app.get("/api/currencies", async (req, res) => {
    try {
      // Hardcoded currencies per user request, instead of fetching from API that's currently failing
      const currencies = [
        ["USD", "US Dollar"],
        ["EUR", "Euro"],
        ["INR", "Indian Rupee"],
        ["DKK", "Danish Krone"],
        ["AED", "UAE Dirham"]
      ];
      
      // Return hardcoded currencies
      res.json(currencies);
    } catch (error) {
      console.error("Currencies API error:", error);
      res.status(500).json({ message: "Failed to fetch currency codes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
