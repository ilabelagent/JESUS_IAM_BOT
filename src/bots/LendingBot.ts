/**
 * Lending Bot - DeFi lending and borrowing automation
 */

import { BaseBot, MarketData, ExecutionResult } from "../types";

interface LendingPosition {
  protocol: string;
  supplied: number;
  borrowed: number;
  supplyApy: number;
  borrowApy: number;
  healthFactor: number;
}

export class LendingBot extends BaseBot {
  private positions: LendingPosition[] = [];
  private totalCapital: number = 10000;
  private targetHealthFactor: number = 2.0;
  private minHealthFactor: number = 1.5;

  constructor() {
    super("lending_bot", "DeFi Lending");
    this.initializePositions();
  }

  private initializePositions(): void {
    this.positions = [
      {
        protocol: "Aave",
        supplied: 5000,
        borrowed: 2000,
        supplyApy: 5,
        borrowApy: 8,
        healthFactor: 2.5,
      },
      {
        protocol: "Compound",
        supplied: 3000,
        borrowed: 1000,
        supplyApy: 4,
        borrowApy: 7,
        healthFactor: 3.0,
      },
    ];
  }

  private calculateNetApy(): number {
    let netApy = 0;
    for (const pos of this.positions) {
      const supplyEarnings = pos.supplied * pos.supplyApy / 100;
      const borrowCost = pos.borrowed * pos.borrowApy / 100;
      netApy += supplyEarnings - borrowCost;
    }
    return netApy;
  }

  private checkHealthFactors(): LendingPosition | null {
    for (const pos of this.positions) {
      // Simulate health factor changes
      pos.healthFactor += (Math.random() - 0.5) * 0.2;

      if (pos.healthFactor < this.minHealthFactor) {
        return pos;
      }
    }
    return null;
  }

  async execute(marketData: MarketData): Promise<ExecutionResult> {
    const currentPrice = marketData.price;

    // Check for positions needing adjustment
    const riskPosition = this.checkHealthFactors();

    if (riskPosition) {
      // Repay some debt to improve health factor
      const repayAmount = riskPosition.borrowed * 0.2;
      riskPosition.borrowed -= repayAmount;
      riskPosition.healthFactor = riskPosition.supplied / riskPosition.borrowed * 0.8;

      const result: ExecutionResult = {
        success: true,
        action: "sell",
        amount: repayAmount,
        price: currentPrice,
        reason: `Repaid $${repayAmount.toFixed(2)} on ${riskPosition.protocol} to improve health`,
        profitLoss: -repayAmount * 0.01, // Small fee
        metadata: {
          protocol: riskPosition.protocol,
          newHealthFactor: riskPosition.healthFactor,
        },
      };

      this.recordExecution(result);
      return result;
    }

    // Accumulate earnings
    const dailyEarnings = this.calculateNetApy() / 365;

    return {
      success: true,
      action: "hold",
      amount: 0,
      price: currentPrice,
      reason: `Net APY: $${this.calculateNetApy().toFixed(2)}/year. Daily: $${dailyEarnings.toFixed(2)}`,
    };
  }
}
