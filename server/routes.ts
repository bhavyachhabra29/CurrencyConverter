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
      
      const response = await fetch(`${BASE_URL}/${API_KEY}/pair/${baseCurrency}/${targetCurrency}`);
      const data = await response.json();
      
      if (data.result === "success") {
        // Save the current rate to our storage
        await storage.saveExchangeRate({
          baseCurrency,
          targetCurrency,
          rate: data.conversion_rate,
          date: new Date()
        });
        
        res.json({
          rate: data.conversion_rate,
          baseCurrency,
          targetCurrency,
          lastUpdated: new Date().toISOString()
        });
      } else {
        res.status(400).json({ message: data.error || "Failed to get exchange rate" });
      }
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
      
      // Try to get from storage first
      const storedRates = await storage.getExchangeRates(baseCurrency, targetCurrency, days);
      
      // If we don't have enough rates stored, fetch from API
      if (storedRates.length < days) {
        const response = await fetch(`${BASE_URL}/${API_KEY}/history/${baseCurrency}/${targetCurrency}/${days}`);
        const data = await response.json();
        
        if (data.result === "success") {
          const rates = [];
          const conversionRates = data.conversion_rates || {};
          
          for (const [dateStr, rate] of Object.entries(conversionRates)) {
            const date = new Date(dateStr);
            
            // Save to storage
            await storage.saveExchangeRate({
              baseCurrency,
              targetCurrency,
              rate: rate as number,
              date
            });
            
            rates.push({
              date: date.toISOString(),
              rate
            });
          }
          
          // Calculate statistics
          const rateValues = rates.map(r => r.rate as number);
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
        } else {
          res.status(400).json({ message: data.error || "Failed to get historical rates" });
        }
      } else {
        // We have enough stored rates
        const formattedRates = storedRates.map(rate => ({
          date: rate.date.toISOString(),
          rate: rate.rate
        }));
        
        // Calculate statistics
        const rateValues = formattedRates.map(r => r.rate);
        const avg = rateValues.reduce((a, b) => a + b, 0) / rateValues.length;
        const min = Math.min(...rateValues);
        const max = Math.max(...rateValues);
        const volatility = ((max - min) / avg) * 100;
        
        res.json({
          rates: formattedRates,
          statistics: {
            average: avg,
            min,
            max,
            volatility: parseFloat(volatility.toFixed(2))
          }
        });
      }
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
      
      // Get historical data for analysis
      const historicalDays = 90; // Using more data for better forecasting
      const storedRates = await storage.getExchangeRates(baseCurrency, targetCurrency, historicalDays);
      
      if (storedRates.length < 7) {
        // Not enough data for forecasting, fetch historical data
        const response = await fetch(`${BASE_URL}/${API_KEY}/history/${baseCurrency}/${targetCurrency}/${historicalDays}`);
        const data = await response.json();
        
        if (data.result === "success") {
          const historicalRates = [];
          const conversionRates = data.conversion_rates || {};
          
          for (const [dateStr, rate] of Object.entries(conversionRates)) {
            const date = new Date(dateStr);
            
            // Save to storage
            await storage.saveExchangeRate({
              baseCurrency,
              targetCurrency,
              rate: rate as number,
              date
            });
            
            historicalRates.push(rate);
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
          const direction = percentChange > 0 ? "up" : percentChange < 0 ? "down" : "stable";
          
          res.json({
            forecast,
            analysis: {
              percentChange: parseFloat(percentChange.toFixed(2)),
              direction,
              confidence: 75, // Fixed confidence level
              expectedHigh: parseFloat(Math.max(...forecastRates).toFixed(4)),
              expectedLow: parseFloat(Math.min(...forecastRates).toFixed(4))
            }
          });
        } else {
          res.status(400).json({ message: data.error || "Failed to get historical data for forecasting" });
        }
      } else {
        // We have enough stored rates for forecasting
        const historicalRates = storedRates.map(rate => rate.rate);
        
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
        const direction = percentChange > 0 ? "up" : percentChange < 0 ? "down" : "stable";
        
        res.json({
          forecast,
          analysis: {
            percentChange: parseFloat(percentChange.toFixed(2)),
            direction,
            confidence: 75, // Fixed confidence level
            expectedHigh: parseFloat(Math.max(...forecastRates).toFixed(4)),
            expectedLow: parseFloat(Math.min(...forecastRates).toFixed(4))
          }
        });
      }
    } catch (error) {
      console.error("Forecast API error:", error);
      res.status(500).json({ message: "Failed to generate forecast" });
    }
  });

  // Get supported currencies
  app.get("/api/currencies", async (req, res) => {
    try {
      const response = await fetch(`${BASE_URL}/${API_KEY}/codes`);
      const data = await response.json();
      
      if (data.result === "success") {
        res.json(data.supported_codes);
      } else {
        res.status(400).json({ message: data.error || "Failed to get currency codes" });
      }
    } catch (error) {
      console.error("Currencies API error:", error);
      res.status(500).json({ message: "Failed to fetch currency codes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
