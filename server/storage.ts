import { 
  users, 
  type User, 
  type InsertUser, 
  conversions, 
  type Conversion, 
  type InsertConversion,
  exchangeRates,
  type ExchangeRate,
  type InsertExchangeRate
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversion methods
  saveConversion(conversion: InsertConversion): Promise<Conversion>;
  getConversions(limit?: number): Promise<Conversion[]>;
  
  // Exchange rate methods
  saveExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate>;
  getExchangeRates(baseCurrency: string, targetCurrency: string, days: number): Promise<ExchangeRate[]>;
  getLatestExchangeRate(baseCurrency: string, targetCurrency: string): Promise<ExchangeRate | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversionRecords: Map<number, Conversion>;
  private exchangeRateRecords: Map<number, ExchangeRate>;
  private userId: number;
  private conversionId: number;
  private exchangeRateId: number;

  constructor() {
    this.users = new Map();
    this.conversionRecords = new Map();
    this.exchangeRateRecords = new Map();
    this.userId = 1;
    this.conversionId = 1;
    this.exchangeRateId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveConversion(insertConversion: InsertConversion): Promise<Conversion> {
    const id = this.conversionId++;
    const conversion: Conversion = { 
      ...insertConversion, 
      id, 
      createdAt: new Date() 
    };
    this.conversionRecords.set(id, conversion);
    return conversion;
  }

  async getConversions(limit?: number): Promise<Conversion[]> {
    const conversions = Array.from(this.conversionRecords.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? conversions.slice(0, limit) : conversions;
  }

  async saveExchangeRate(insertRate: InsertExchangeRate): Promise<ExchangeRate> {
    const id = this.exchangeRateId++;
    const rate: ExchangeRate = { ...insertRate, id };
    this.exchangeRateRecords.set(id, rate);
    return rate;
  }

  async getExchangeRates(baseCurrency: string, targetCurrency: string, days: number): Promise<ExchangeRate[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - days);
    
    return Array.from(this.exchangeRateRecords.values())
      .filter(rate => 
        rate.baseCurrency === baseCurrency && 
        rate.targetCurrency === targetCurrency &&
        rate.date.getTime() >= targetDate.getTime()
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getLatestExchangeRate(baseCurrency: string, targetCurrency: string): Promise<ExchangeRate | undefined> {
    const rates = Array.from(this.exchangeRateRecords.values())
      .filter(rate => 
        rate.baseCurrency === baseCurrency && 
        rate.targetCurrency === targetCurrency
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return rates.length > 0 ? rates[0] : undefined;
  }
}

export const storage = new MemStorage();
