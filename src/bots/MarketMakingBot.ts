/**
 * Market Making Bot - Provides liquidity with simultaneous buy/sell orders
 */

import { BaseBot, MarketData, ExecutionResult } from "../types";

export class MarketMakingBot extends BaseBot {
  private spreadPercent: number = 0.5;
  private orderSize: number = 0.1;
  private inventory: number = 0;
  private maxInventory: number = 1;

  constructor() {
    super("market_making_bot", "Market Making");
  }

  async execute(marketData: MarketData): Promise<ExecutionResult> {
    const currentPrice = marketData.price;
    const bidPrice = currentPrice * (1 - this.spreadPercent / 100);
    const askPrice = currentPrice * (1 + this.spreadPercent / 100);

    // Simulate market making activity
    const random = Math.random();

    // Someone hit our bid (we buy)
    if (random < 0.3 && this.inventory < this.maxInventory) {
      this.inventory += this.orderSize;

      const result: ExecutionResult = {
        success: true,
        action: "buy",
        amount: this.orderSize,
        price: bidPrice,
        reason: `Bid filled at $${bidPrice.toFixed(2)}`,
        profitLoss: 0,
        metadata: {
          inventory: this.inventory,
          bidPrice,
          askPrice,
        },
      };

      this.recordExecution(result);
      return result;
    }

    // Someone hit our ask (we sell)
    if (random > 0.7 && this.inventory > 0) {
      const profit = (askPrice - bidPrice) * this.orderSize;
      this.inventory -= this.orderSize;

      const result: ExecutionResult = {
        success: true,
        action: "sell",
        amount: this.orderSize,
        price: askPrice,
        reason: `Ask filled at $${askPrice.toFixed(2)}`,
        profitLoss: profit,
        metadata: {
          inventory: this.inventory,
          bidPrice,
          askPrice,
          spread: this.spreadPercent,
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
      reason: `Orders placed. Bid: $${bidPrice.toFixed(2)}, Ask: $${askPrice.toFixed(2)}`,
    };
  }
}
