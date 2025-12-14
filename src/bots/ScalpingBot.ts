/**
 * Scalping Bot - Fast in/out trades based on EMA crossover and RSI
 */

import { BaseBot, MarketData, ExecutionResult } from "../types";

export class ScalpingBot extends BaseBot {
  private shortEMA: number[] = [];
  private longEMA: number[] = [];
  private rsiPeriod: number = 14;
  private prices: number[] = [];
  private position: number = 0;
  private entryPrice: number = 0;

  constructor() {
    super("scalping_bot", "Scalping");
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  private calculateRSI(prices: number[]): number {
    if (prices.length < this.rsiPeriod + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - this.rsiPeriod; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / this.rsiPeriod;
    const avgLoss = losses / this.rsiPeriod;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  async execute(marketData: MarketData): Promise<ExecutionResult> {
    const currentPrice = marketData.price;
    this.prices.push(currentPrice);

    if (this.prices.length > 100) {
      this.prices = this.prices.slice(-100);
    }

    const shortEma = this.calculateEMA(this.prices, 9);
    const longEma = this.calculateEMA(this.prices, 21);
    const rsi = this.calculateRSI(this.prices);

    // Buy signal: Short EMA crosses above Long EMA and RSI < 30
    if (shortEma > longEma && rsi < 30 && this.position === 0) {
      this.position = 0.1;
      this.entryPrice = currentPrice;

      const result: ExecutionResult = {
        success: true,
        action: "buy",
        amount: 0.1,
        price: currentPrice,
        reason: `Scalp entry: EMA crossover + RSI oversold (${rsi.toFixed(1)})`,
        profitLoss: 0,
      };

      this.recordExecution(result);
      return result;
    }

    // Sell signal: Short EMA crosses below Long EMA or RSI > 70
    if ((shortEma < longEma || rsi > 70) && this.position > 0) {
      const profit = (currentPrice - this.entryPrice) * this.position;
      this.position = 0;

      const result: ExecutionResult = {
        success: true,
        action: "sell",
        amount: 0.1,
        price: currentPrice,
        reason: `Scalp exit: EMA crossover or RSI overbought (${rsi.toFixed(1)})`,
        profitLoss: profit,
      };

      this.recordExecution(result);
      return result;
    }

    return {
      success: true,
      action: "hold",
      amount: 0,
      price: currentPrice,
      reason: `Waiting for signal. RSI: ${rsi.toFixed(1)}`,
    };
  }
}
