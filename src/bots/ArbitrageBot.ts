/**
 * Arbitrage Bot - Cross-exchange price difference exploitation
 */

import { BaseBot, MarketData, ExecutionResult } from "../types";

export class ArbitrageBot extends BaseBot {
  private minSpreadPercent: number = 0.5;
  private maxPositionSize: number = 1;

  constructor() {
    super("arbitrage_bot", "Arbitrage");
  }

  async execute(marketData: MarketData): Promise<ExecutionResult> {
    const currentPrice = marketData.price;
    const bidPrice = marketData.bidPrice;
    const askPrice = marketData.askPrice;

    // Calculate spread
    const spread = ((askPrice - bidPrice) / bidPrice) * 100;

    if (spread >= this.minSpreadPercent) {
      // Simulate arbitrage opportunity
      const profit = (askPrice - bidPrice) * this.maxPositionSize;

      const result: ExecutionResult = {
        success: true,
        action: "buy",
        amount: this.maxPositionSize,
        price: bidPrice,
        reason: `Arbitrage opportunity detected. Spread: ${spread.toFixed(2)}%`,
        profitLoss: profit,
        metadata: {
          bidPrice,
          askPrice,
          spread,
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
      reason: `No arbitrage opportunity. Current spread: ${spread.toFixed(2)}%`,
    };
  }
}
