/**
 * Grid Trading Bot - Places buy/sell orders at predefined price intervals
 */

import { BaseBot, MarketData, ExecutionResult } from "../types";

export class GridTradingBot extends BaseBot {
  private gridLevels: number = 10;
  private priceRange: number = 5; // percentage
  private lastPrice: number = 0;
  private gridOrders: Map<number, { type: "buy" | "sell"; price: number }> = new Map();

  constructor() {
    super("grid_bot", "Grid Trading");
    this.initializeGrid(50000); // Default price
  }

  private initializeGrid(basePrice: number): void {
    const step = (basePrice * this.priceRange) / 100 / this.gridLevels;

    for (let i = 0; i < this.gridLevels; i++) {
      const buyPrice = basePrice - step * (i + 1);
      const sellPrice = basePrice + step * (i + 1);

      this.gridOrders.set(i * 2, { type: "buy", price: buyPrice });
      this.gridOrders.set(i * 2 + 1, { type: "sell", price: sellPrice });
    }
  }

  async execute(marketData: MarketData): Promise<ExecutionResult> {
    const currentPrice = marketData.price;

    // Check if any grid level is triggered
    for (const [level, order] of this.gridOrders) {
      if (order.type === "buy" && currentPrice <= order.price && this.lastPrice > order.price) {
        const result: ExecutionResult = {
          success: true,
          action: "buy",
          amount: 0.01,
          price: currentPrice,
          reason: `Grid buy triggered at level ${level}`,
          profitLoss: 0,
        };
        this.recordExecution(result);
        this.lastPrice = currentPrice;
        return result;
      }

      if (order.type === "sell" && currentPrice >= order.price && this.lastPrice < order.price) {
        const profit = (currentPrice - this.lastPrice) * 0.01;
        const result: ExecutionResult = {
          success: true,
          action: "sell",
          amount: 0.01,
          price: currentPrice,
          reason: `Grid sell triggered at level ${level}`,
          profitLoss: profit,
        };
        this.recordExecution(result);
        this.lastPrice = currentPrice;
        return result;
      }
    }

    this.lastPrice = currentPrice;

    return {
      success: true,
      action: "hold",
      amount: 0,
      price: currentPrice,
      reason: "No grid level triggered",
    };
  }
}
