/**
 * DCA Bot - Dollar-Cost Averaging strategy
 */

import { BaseBot, MarketData, ExecutionResult } from "../types";

export class DCABot extends BaseBot {
  private intervalMs: number = 86400000; // 24 hours
  private investmentAmount: number = 100;
  private lastPurchaseTime: number = 0;
  private totalInvested: number = 0;
  private totalUnits: number = 0;

  constructor() {
    super("dca_bot", "Dollar-Cost Averaging");
  }

  async execute(marketData: MarketData): Promise<ExecutionResult> {
    const now = Date.now();
    const currentPrice = marketData.price;

    // Check if it's time for a DCA purchase
    if (now - this.lastPurchaseTime >= this.intervalMs) {
      const units = this.investmentAmount / currentPrice;
      this.totalInvested += this.investmentAmount;
      this.totalUnits += units;
      this.lastPurchaseTime = now;

      const avgPrice = this.totalInvested / this.totalUnits;
      const unrealizedPnL = (currentPrice - avgPrice) * this.totalUnits;

      const result: ExecutionResult = {
        success: true,
        action: "buy",
        amount: units,
        price: currentPrice,
        reason: `DCA purchase - Avg price: $${avgPrice.toFixed(2)}`,
        profitLoss: unrealizedPnL,
        metadata: {
          totalInvested: this.totalInvested,
          totalUnits: this.totalUnits,
          averagePrice: avgPrice,
        },
      };

      this.recordExecution(result);
      return result;
    }

    const avgPrice = this.totalUnits > 0 ? this.totalInvested / this.totalUnits : 0;
    const unrealizedPnL = this.totalUnits > 0 ? (currentPrice - avgPrice) * this.totalUnits : 0;

    return {
      success: true,
      action: "hold",
      amount: 0,
      price: currentPrice,
      reason: `Waiting for next DCA interval. Unrealized P&L: $${unrealizedPnL.toFixed(2)}`,
    };
  }
}
