/**
 * Momentum AI Bot - AI-powered pattern recognition and volume analysis
 */

import { BaseBot, MarketData, ExecutionResult } from "../types";

export class MomentumAIBot extends BaseBot {
  private prices: number[] = [];
  private volumes: number[] = [];
  private position: number = 0;
  private entryPrice: number = 0;
  private momentumThreshold: number = 2;

  constructor() {
    super("momentum_ai_bot", "Momentum AI");
  }

  private calculateMomentum(prices: number[], period: number = 14): number {
    if (prices.length < period) return 0;

    const current = prices[prices.length - 1];
    const past = prices[prices.length - period];

    return ((current - past) / past) * 100;
  }

  private calculateVolumeRatio(volumes: number[], period: number = 20): number {
    if (volumes.length < period) return 1;

    const avgVolume = volumes.slice(-period).reduce((a, b) => a + b, 0) / period;
    const currentVolume = volumes[volumes.length - 1];

    return currentVolume / avgVolume;
  }

  private predictDirection(): "up" | "down" | "neutral" {
    const momentum = this.calculateMomentum(this.prices);
    const volumeRatio = this.calculateVolumeRatio(this.volumes);

    // AI prediction based on momentum and volume
    if (momentum > this.momentumThreshold && volumeRatio > 1.5) {
      return "up";
    } else if (momentum < -this.momentumThreshold && volumeRatio > 1.5) {
      return "down";
    }

    return "neutral";
  }

  async execute(marketData: MarketData): Promise<ExecutionResult> {
    const currentPrice = marketData.price;
    this.prices.push(currentPrice);
    this.volumes.push(marketData.volume);

    if (this.prices.length > 100) {
      this.prices = this.prices.slice(-100);
      this.volumes = this.volumes.slice(-100);
    }

    const prediction = this.predictDirection();
    const momentum = this.calculateMomentum(this.prices);
    const volumeRatio = this.calculateVolumeRatio(this.volumes);

    // Buy on bullish prediction
    if (prediction === "up" && this.position === 0) {
      this.position = 0.1;
      this.entryPrice = currentPrice;

      const result: ExecutionResult = {
        success: true,
        action: "buy",
        amount: 0.1,
        price: currentPrice,
        reason: `AI predicts UP. Momentum: ${momentum.toFixed(2)}%, Volume: ${volumeRatio.toFixed(2)}x`,
        profitLoss: 0,
        metadata: {
          prediction,
          momentum,
          volumeRatio,
        },
      };

      this.recordExecution(result);
      return result;
    }

    // Sell on bearish prediction or take profit
    if ((prediction === "down" || momentum < 0) && this.position > 0) {
      const profit = (currentPrice - this.entryPrice) * this.position;
      this.position = 0;

      const result: ExecutionResult = {
        success: true,
        action: "sell",
        amount: 0.1,
        price: currentPrice,
        reason: `AI predicts ${prediction.toUpperCase()}. Taking profit.`,
        profitLoss: profit,
        metadata: {
          prediction,
          momentum,
          volumeRatio,
        },
      };

      this.recordExecution(result);
      return result;
    }

    return {
      success: true,
      action: "hold",
      amount: 0,
      price: currentPrice,
      reason: `AI prediction: ${prediction}. Momentum: ${momentum.toFixed(2)}%`,
    };
  }
}
