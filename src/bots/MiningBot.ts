/**
 * Mining Bot - Crypto mining management and profitability
 */

import { BaseBot, MarketData, ExecutionResult } from "../types";

interface Miner {
  id: string;
  hashRate: number; // TH/s
  powerConsumption: number; // Watts
  isActive: boolean;
}

export class MiningBot extends BaseBot {
  private miners: Miner[] = [];
  private electricityCost: number = 0.10; // $/kWh
  private totalMined: number = 0;
  private totalRevenue: number = 0;
  private totalCost: number = 0;

  constructor() {
    super("mining_bot", "Mining Management");
    this.initializeMiners();
  }

  private initializeMiners(): void {
    this.miners = [
      { id: "miner_1", hashRate: 110, powerConsumption: 3250, isActive: true },
      { id: "miner_2", hashRate: 100, powerConsumption: 3000, isActive: true },
      { id: "miner_3", hashRate: 90, powerConsumption: 2800, isActive: false },
    ];
  }

  private calculateHashRate(): number {
    return this.miners
      .filter((m) => m.isActive)
      .reduce((sum, m) => sum + m.hashRate, 0);
  }

  private calculatePowerCost(): number {
    const totalWatts = this.miners
      .filter((m) => m.isActive)
      .reduce((sum, m) => sum + m.powerConsumption, 0);

    return (totalWatts / 1000) * this.electricityCost * 24; // Daily cost
  }

  private calculateDailyReward(btcPrice: number): number {
    // Simplified: ~0.0000001 BTC per TH/s per day at current difficulty
    const hashRate = this.calculateHashRate();
    return hashRate * 0.0000001 * btcPrice;
  }

  private isProfitable(btcPrice: number): boolean {
    const dailyReward = this.calculateDailyReward(btcPrice);
    const dailyCost = this.calculatePowerCost();
    return dailyReward > dailyCost;
  }

  async execute(marketData: MarketData): Promise<ExecutionResult> {
    const btcPrice = marketData.price;

    const dailyReward = this.calculateDailyReward(btcPrice);
    const dailyCost = this.calculatePowerCost();
    const dailyProfit = dailyReward - dailyCost;
    const isProfitable = this.isProfitable(btcPrice);

    // Adjust miners based on profitability
    if (!isProfitable) {
      // Turn off least efficient miner
      const leastEfficient = this.miners
        .filter((m) => m.isActive)
        .sort((a, b) => (a.hashRate / a.powerConsumption) - (b.hashRate / b.powerConsumption))[0];

      if (leastEfficient) {
        leastEfficient.isActive = false;

        const result: ExecutionResult = {
          success: true,
          action: "sell",
          amount: leastEfficient.hashRate,
          price: btcPrice,
          reason: `Shut down ${leastEfficient.id} - unprofitable at $${btcPrice.toFixed(0)}`,
          profitLoss: -dailyCost / 24,
          metadata: {
            minerId: leastEfficient.id,
            hashRate: this.calculateHashRate(),
            reason: "Low profitability",
          },
        };

        this.recordExecution(result);
        return result;
      }
    } else {
      // Turn on inactive miners if profitable
      const inactiveMiners = this.miners.filter((m) => !m.isActive);
      if (inactiveMiners.length > 0 && dailyProfit > dailyCost * 0.2) {
        const minerToActivate = inactiveMiners[0];
        minerToActivate.isActive = true;

        const result: ExecutionResult = {
          success: true,
          action: "buy",
          amount: minerToActivate.hashRate,
          price: btcPrice,
          reason: `Activated ${minerToActivate.id} - profitable at $${btcPrice.toFixed(0)}`,
          profitLoss: dailyProfit / 24,
          metadata: {
            minerId: minerToActivate.id,
            hashRate: this.calculateHashRate(),
            dailyProfit: dailyProfit,
          },
        };

        this.recordExecution(result);
        return result;
      }
    }

    // Accumulate mining rewards
    this.totalMined += dailyReward / 24 / btcPrice; // BTC
    this.totalRevenue += dailyReward / 24;
    this.totalCost += dailyCost / 24;

    return {
      success: true,
      action: "hold",
      amount: 0,
      price: btcPrice,
      reason: `Mining: ${this.calculateHashRate()} TH/s. Daily profit: $${dailyProfit.toFixed(2)}`,
    };
  }
}
